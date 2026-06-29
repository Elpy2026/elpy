import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type SignUpConsents = {
  acceptedTerms: boolean
  acceptedPrivacy: boolean
  marketingConsent: boolean
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'seeker' | 'helper',
    phone: string,
    consents: SignUpConsents,
  ) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        setLoading(false)
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: 'seeker' | 'helper',
    phone: string,
    consents: SignUpConsents,
  ) {
    const now = new Date().toISOString()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
          accepted_terms: consents.acceptedTerms,
          accepted_privacy: consents.acceptedPrivacy,
          marketing_consent: consents.marketingConsent,
        },
      },
    })

    console.log('SIGNUP RESULT', data, error)

    if (error) throw error

    const userId = data.user?.id

    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        role,
        phone: phone || null,
        verified: false,
        is_admin: false,
        accepted_terms: consents.acceptedTerms,
        accepted_privacy: consents.acceptedPrivacy,
        marketing_consent: consents.marketingConsent,
        accepted_terms_at: consents.acceptedTerms ? now : null,
        accepted_privacy_at: consents.acceptedPrivacy ? now : null,
        marketing_consent_at: consents.marketingConsent ? now : null,
      })

      if (profileError) throw profileError

      await supabase.from('admin_notifications').insert({
        type: 'new_user',
        title: 'Nuovo utente registrato',
        message: `${fullName} si è registrato su ELPYO.`,
        metadata: {
          user_id: userId,
          email,
          full_name: fullName,
          role,
        },
      })
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}