import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function VerifiedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    async function checkVerified() {
      if (!user) {
        setVerified(false)
        setChecking(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('verified')
        .eq('id', user.id)
        .single()

      setVerified(Boolean(data?.verified))
      setChecking(false)
    }

    if (!loading) {
      void checkVerified()
    }
  }, [user, loading])

  if (loading || checking) {
    return <p>Caricamento…</p>
  }

  if (!user) {
    return (
      <div className="container page-ntainer">
        <div className="alert alert--error">
          Devi registrarti e accedere prima di usare ELPY.
        </div>
        <div className="form-actions">
          <Link className="btn btn--primary" to="/registrazione">Registrati</Link>
          <Link className="btn btn--secondary" to="/login">Accedi</Link>
        </div>
      </div>
    )
  }

  if (!verified) {
    return (
      <div className="container page-container">
        <div className="alert alert--error">
          Devi completare la verifica identità ed essere approvato prima di pubblicare o offrire aiuto.
        </div>
        <div className="form-actions">
          <Link className="btn btn--primary" to="/verifica-identita">
            Completa verifica identità
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default VerifiedRoute
