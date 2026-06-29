import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function SegnalaUtentePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const reportedUserId = searchParams.get('userId') ?? ''
  const requestId = searchParams.get('requestId') ?? ''

  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!user) {
      setError('Devi effettuare l’accesso.')
      return
    }

    if (!reportedUserId) {
      setError('Utente da segnalare non valido.')
      return
    }

    if (!reason.trim()) {
      setError('Seleziona una motivazione.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const { data: reportData, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      request_id: requestId || null,
      reason,
      details: details || null,
    })
    .select('id')
    .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }
    await supabase.from('admin_notifications').insert({
      type: 'new_report',
      title: 'Nuova segnalazione',
      message: 'È stata inviata una nuova segnalazione utente.',
      metadata: {
        report_id: reportData?.id ?? null,
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        request_id: requestId || null,
        reason,
      },
    })

    setMessage('Segnalazione inviata correttamente.')

    setTimeout(() => {
      navigate(-1)
    }, 1500)

    setSaving(false)
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Sicurezza</p>

              <h1 className="page-title">
                Segnala utente
              </h1>

              <p className="page-subtitle">
                Invia una segnalazione al team ELPYO.
              </p>
            </div>

            {message && (
              <div className="alert alert--success">
                {message}
              </div>
            )}

            {error && (
              <div className="alert alert--error">
                {error}
              </div>
            )}

            <form
              className="request-form"
              onSubmit={handleSubmit}
            >
              <div className="form-field">
                <label htmlFor="reason">
                  Motivo segnalazione
                </label>

                <select
                  id="reason"
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value)
                  }
                  required
                >
                  <option value="">
                    Seleziona...
                  </option>

                  <option value="comportamento_scorretto">
                    Comportamento scorretto
                  </option>

                  <option value="spam">
                    Spam
                  </option>

                  <option value="truffa">
                    Tentata truffa
                  </option>

                  <option value="profilo_falso">
                    Profilo falso
                  </option>

                  <option value="altro">
                    Altro
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="details">
                  Descrizione
                </label>

                <textarea
                  id="details"
                  rows={5}
                  value={details}
                  onChange={(e) =>
                    setDetails(e.target.value)
                  }
                  placeholder="Descrivi il problema..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Invio...'
                    : 'Invia segnalazione'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default SegnalaUtentePage