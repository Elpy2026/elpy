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
    const { error } = await supabase.auth.signUp({
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

    if (error) throw error
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
