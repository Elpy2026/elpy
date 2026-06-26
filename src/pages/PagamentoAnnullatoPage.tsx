import { Link } from 'react-router-dom'

export default function PagamentoAnnullatoPage() {
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
          ❌
        </div>

        <h1
          style={{
            marginBottom: '16px',
            color: '#1f2937',
          }}
        >
          Pagamento annullato
        </h1>

        <p
          style={{
            color: '#4b5563',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          Nessun importo è stato addebitato. Potrai riprovare in qualsiasi momento.
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
          Torna alle mie richieste
        </Link>
      </div>
    </div>
  )
}