import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function PagamentoSuccessoPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/le-mie-richieste')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f6f7fb',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          padding: '40px',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>
          ✅
        </div>

        <h1
          style={{
            marginBottom: '16px',
            color: '#1f2937',
          }}
        >
          Pagamento completato
        </h1>

        <p
          style={{
            color: '#4b5563',
            lineHeight: 1.6,
            marginBottom: '12px',
          }}
        >
          Il pagamento è stato registrato correttamente.
        </p>

        <p
          style={{
            color: '#4b5563',
            lineHeight: 1.6,
            marginBottom: '12px',
          }}
        >
          Grazie per aver utilizzato ELPYO.
        </p>

        <p
          style={{
            color: '#6b7280',
            fontSize: '14px',
            marginBottom: '32px',
          }}
        >
          Verrai reindirizzato automaticamente tra 5 secondi...
        </p>

        <Link
          to="/le-mie-richieste"
          style={{
            display: 'inline-block',
            background: '#ff5a4f',
            color: '#fff',
            padding: '14px 24px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Torna subito alle mie richieste
        </Link>
      </div>
    </div>
  )
}