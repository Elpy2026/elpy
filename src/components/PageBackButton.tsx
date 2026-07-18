import { useLocation, useNavigate } from 'react-router-dom'

type Props = {
  fallback?: string
  label?: string
}

export default function PageBackButton({
  fallback = '/',
  label = '← Torna indietro',
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(location.state?.from ?? fallback)
    }
  }

  return (
    <button
      type="button"
      className="btn btn--secondary"
      onClick={handleClick}
      style={{ marginBottom: '1.5rem' }}
    >
      {label}
    </button>
  )
}