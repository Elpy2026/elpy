import { useNavigate } from 'react-router-dom'

export default function BackButton() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className="btn btn--secondary"
      onClick={() => navigate(-1)}
      style={{
        marginBottom: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      ← Torna indietro
    </button>
  )
}
