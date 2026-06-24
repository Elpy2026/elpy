import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido.')
      return
    }

    setAvatarFile(file)
    setAvatarUrl(URL.createObjectURL(file))
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!user || !avatarFile) return avatarUrl || null

    const fileExt = avatarFile.name.split('.').pop()
    const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!user) {
      setError('Devi accedere per modificare il profilo.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      if (newPassword || confirmPassword) {
        if (newPassword.length < 6) {
          throw new Error('La nuova password deve contenere almeno 6 caratteri.')
        }

        if (newPassword !== confirmPassword) {
          throw new Error('Le password non coincidono.')
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (passwordError) throw passwordError
      }

      const finalAvatarUrl = await uploadAvatar()

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          city: city || null,
          bio: bio || null,
          avatar_url: finalAvatarUrl || null,
        })
        .eq('id', user.id)

      if (error) throw error

      setAvatarUrl(finalAvatarUrl ?? '')
      setAvatarFile(null)
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Profilo aggiornato con successo.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
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
                Aggiorna le informazioni visibili agli altri utenti ELPYO.
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
                  <label htmlFor="avatarFile">Foto profilo</label>
                  <input
                    id="avatarFile"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
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

                <div className="request-card">
                  <h2 className="request-card__title">Cambia password</h2>

                  <div className="form-field">
                    <label htmlFor="newPassword">Nuova password</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nuova password"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="confirmPassword">Conferma password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ripeti password"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="alert alert--success">
                  Stato identità: {verified ? 'verificata' : 'non ancora verificata'}
                </div>

                <div className="form-actions">
                  <button className="btn btn--primary" type="submit" disabled={saving}>
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