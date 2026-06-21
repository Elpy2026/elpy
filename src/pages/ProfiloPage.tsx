import { useEffect, useState, type FormEvent } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function ProfiloPage() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, city, bio, avatar_url, verified')
        .eq('id', user.id)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setFullName(data?.full_name ?? '')
        setPhone(data?.phone ?? '')
        setCity(data?.city ?? '')
        setBio(data?.bio ?? '')
        setAvatarUrl(data?.avatar_url ?? '')
        setVerified(Boolean(data?.verified))
      }

      setLoading(false)
    }

    void loadProfile()
  }, [user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!user) {
      setError('Devi accedere per modificare il profilo.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
        city: city || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      setMessage('Profilo aggiornato con successo.')
    }

    setSaving(false)
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Profilo</p>
              <h1 className="page-title">Il mio profilo</h1>
              <p className="page-subtitle">
                Aggiorna le informazioni visibili agli altri utenti ELPY.
              </p>
            </div>

            {loading && <p>Caricamento profilo…</p>}
            {message && <div className="alert alert--success">{message}</div>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && (
              <form className="request-form" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label htmlFor="fullName">Nome e cognome</label>
                  <input
                  id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="phone">Telefono</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Es. 3331234567"
                    disabled={saving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="city">Città</label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Es. Agrigento"
                    disabled={saving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Racconta qualcosa su di te..."
                    disabled={saving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="avatarUrl">URL foto profilo</label>
                  <input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    disabled={saving}
                  />
                </div>

                {avatarUrl && (
                  <div className="request-card">
                    <h2 className="request-card__title">Anteprima foto</h2>
                    <img
                      src={avatarUrl}
                      alt="Foto profilo"
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: '999px',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                )}

                <div className="alert alert--success">
                  Stato identità:{' '}
                  {verified ? 'verificata' : 'non ancora verificata'}
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn--primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Salvataggio…' : 'Salva profilo'}
                  </button>
                </div>
              </form>
         )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ProfiloPage
