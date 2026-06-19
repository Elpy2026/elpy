import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      setIsAdmin(Boolean(data?.is_admin))
      setChecking(false)
    }

    if (!loading) {
      void checkAdmin()
    }
  }, [user, loading])

  if (loading || checking) {
    return <p>Caricamento…</p>
  }

  if (!user) {
    return (
      <div className="container page-container">
      <div className="alert alert--error">
          Devi accedere per visualizzare questa pagina.
        </div>
        <Link className="btn btn--primary" to="/login">Accedi</Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container page-container">
        <div className="alert alert--error">
          Accesso negato. Questa area è riservata agli amministratori.
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminRoute
