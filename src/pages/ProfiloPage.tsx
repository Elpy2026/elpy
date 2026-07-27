import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import PageBackButton from '../components/PageBackButton'
import SettingsSection from '../components/SettingsSection'
import { useAuth } from '../context/AuthContext'
import PushNotificationsControl from '../components/PushNotificationsControl'

type ProfileSection =
  | 'personal'
  | 'security'
  | 'wallet'
  | 'emergency'
  | 'notifications'

function ProfiloPage() {
  const { user } = useAuth()
  const [openSection, setOpenSection] = useState<ProfileSection | null>('personal')

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verified, setVerified] = useState(false)

  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [emergencyShareLocation, setEmergencyShareLocation] = useState(true)

  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)
  const [stripeOnboardingCompleted, setStripeOnboardingCompleted] = useState(false)
  const [stripePayoutsEnabled, setStripePayoutsEnabled] = useState(false)
  const [stripeChargesEnabled, setStripeChargesEnabled] = useState(false)
  const [connectingStripe, setConnectingStripe] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function toggleSection(section: ProfileSection) {
    setOpenSection((current) => (current === section ? null : section))
  }

  async function syncStripeAccount() {
    try {
      const { data, error } = await supabase.functions.invoke('sync-connect-account')

      if (error) throw error

      setStripeOnboardingCompleted(Boolean(data?.stripe_onboarding_completed))
      setStripePayoutsEnabled(Boolean(data?.stripe_payouts_enabled))
      setStripeChargesEnabled(Boolean(data?.stripe_charges_enabled))

      if (data?.stripe_onboarding_completed) {
        setMessage('Account Stripe aggiornato correttamente.')
      }
    } catch {
      // Non blocchiamo il caricamento profilo se Stripe non risponde subito.
    }
  }

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          full_name,
          phone,
          city,
          bio,
          avatar_url,
          verified,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_share_location,
          stripe_account_id,
          stripe_onboarding_completed,
          stripe_payouts_enabled,
          stripe_charges_enabled
        `,
        )
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
        setEmergencyContactName(data?.emergency_contact_name ?? '')
        setEmergencyContactPhone(data?.emergency_contact_phone ?? '')
        setEmergencyShareLocation(data?.emergency_share_location ?? true)
        setStripeAccountId(data?.stripe_account_id ?? null)
        setStripeOnboardingCompleted(Boolean(data?.stripe_onboarding_completed))
        setStripePayoutsEnabled(Boolean(data?.stripe_payouts_enabled))
        setStripeChargesEnabled(Boolean(data?.stripe_charges_enabled))

        if (data?.stripe_account_id) {
          void syncStripeAccount()
        }
      }

      setLoading(false)
    }

    void loadProfile()
  }, [user])

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setMessage('')
    setError('')

    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido.')
      return
    }

    setAvatarFile(file)
    setAvatarUrl(URL.createObjectURL(file))
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!user || !avatarFile) return avatarUrl || null

    const fileExt = avatarFile.name.split('.').pop() || 'jpg'
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

  async function handleConnectStripe() {
    if (!user) {
      setError('Devi accedere per collegare il conto.')
      return
    }

    setConnectingStripe(true)
    setMessage('')
    setError('')

    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account')

      if (error) throw error

      if (!data?.url) {
        throw new Error('Stripe non ha restituito il link di onboarding.')
      }

      window.location.href = data.url
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Errore durante il collegamento del conto Stripe.',
      )
      setConnectingStripe(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
          setOpenSection('security')
          throw new Error('La nuova password deve contenere almeno 6 caratteri.')
        }

        if (newPassword !== confirmPassword) {
          setOpenSection('security')
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
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
          emergency_share_location: emergencyShareLocation,
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

  const walletReady =
    stripeOnboardingCompleted && stripePayoutsEnabled && stripeChargesEnabled

  return (
    <div className="landing">
      <Header />
      <PageBackButton />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container profile-settings-page">
            <div className="page-header">
              <p className="hero__badge">Profilo</p>
              <h1 className="page-title">Il mio profilo</h1>
              <p className="page-subtitle">
                Gestisci i tuoi dati, la sicurezza e le impostazioni del tuo account ELPYO.
              </p>
            </div>

            {loading && <p>Caricamento profilo…</p>}
            {message && <div className="alert alert--success">{message}</div>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && (
              <form className="request-form profile-settings" onSubmit={handleSubmit}>
                <div className="settings-list">
                  <SettingsSection
                    id="personal"
                    icon="👤"
                    title="Dati personali"
                    description="Foto, nome, telefono, città e presentazione."
                    isOpen={openSection === 'personal'}
                    onToggle={() => toggleSection('personal')}
                  >
                    <div className="profile-avatar-editor">
                      <div className="profile-avatar-editor__preview">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Foto profilo"
                            className="profile-avatar-editor__image"
                          />
                        ) : (
                          <div className="profile-avatar-editor__placeholder" aria-hidden="true">
                            👤
                          </div>
                        )}
                      </div>

                      <div className="profile-avatar-editor__copy">
                        <strong>Foto profilo</strong>
                        <p>Scegli una foto chiara per essere riconoscibile dagli altri utenti.</p>
                        <label
                          className="btn btn--secondary profile-avatar-editor__button"
                          htmlFor="avatarFile"
                        >
                          Scegli una foto
                        </label>
                        <input
                          id="avatarFile"
                          className="profile-avatar-editor__input"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="fullName">Nome e cognome</label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="profile-settings__grid">
                      <div className="form-field">
                        <label htmlFor="phone">Telefono</label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
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
                          onChange={(event) => setCity(event.target.value)}
                          placeholder="Es. Agrigento"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="bio">Bio</label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        rows={4}
                        placeholder="Racconta qualcosa su di te..."
                        disabled={saving}
                      />
                    </div>
                  </SettingsSection>

                  <SettingsSection
                    id="notifications"
                    icon="🔔"
                    title="Notifiche"
                    description="Gestisci gli avvisi ricevuti da ELPYO."
                    isOpen={openSection === 'notifications'}
                    onToggle={() => toggleSection('notifications')}
                  >
                    <PushNotificationsControl />
                  </SettingsSection>

                  <SettingsSection
                    id="security"
                    icon="🛡️"
                    title="Cambio password"
                    description="Modifica la password del tuo account."
                    badge={verified ? 'Verificata' : 'Da verificare'}
                    isOpen={openSection === 'security'}
                    onToggle={() => toggleSection('security')}
                  >
                    <div
                      className={`profile-status-card${
                        verified ? ' profile-status-card--success' : ''
                      }`}
                    >
                      <div className="profile-status-card__icon" aria-hidden="true">
                        {verified ? '✓' : '!'}
                      </div>
                      <div>
                        <strong>
                          {verified ? 'Identità verificata' : 'Identità non ancora verificata'}
                        </strong>
                        <p>
                          {verified
                            ? 'Il tuo profilo dispone della verifica di identità ELPYO.'
                            : 'La verifica dell’identità aumenta la fiducia tra gli utenti della piattaforma.'}
                        </p>
                      </div>
                    </div>

                    <div className="profile-settings__divider" />
                    <h3 className="profile-settings__content-title">Cambia password</h3>
                    <p className="profile-settings__content-description">
                      Lascia entrambi i campi vuoti se non vuoi modificare la password.
                    </p>

                    <div className="profile-settings__grid">
                      <div className="form-field">
                        <label htmlFor="newPassword">Nuova password</label>
                        <input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          placeholder="Almeno 6 caratteri"
                          autoComplete="new-password"
                          disabled={saving}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="confirmPassword">Conferma password</label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Ripeti la password"
                          autoComplete="new-password"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </SettingsSection>

                  <SettingsSection
                    id="wallet"
                    icon="💰"
                    title="Wallet ELPYO"
                    description="Gestisci il conto sul quale ricevere i compensi."
                    badge={walletReady ? 'Attivo' : stripeAccountId ? 'Da completare' : undefined}
                    isOpen={openSection === 'wallet'}
                    onToggle={() => toggleSection('wallet')}
                  >
                    <div className="wallet-preview">
                      <div className="wallet-preview__header">
                        <div>
                          <span className="wallet-preview__eyebrow">Wallet ELPYO</span>
                          <h3>Pagamenti e incassi</h3>
                        </div>
                        <span
                          className={`wallet-preview__status${
                            walletReady ? ' wallet-preview__status--success' : ''
                          }`}
                        >
                          {walletReady
                            ? 'Conto attivo'
                            : stripeAccountId
                              ? 'Configurazione incompleta'
                              : 'Conto non collegato'}
                        </span>
                      </div>

                      <p className="wallet-preview__description">
                        Collega il tuo conto per ricevere i compensi ottenuti completando gli aiuti.
                      </p>

                      {stripeAccountId ? (
                        <div className="wallet-preview__details">
                          <div className="wallet-preview__detail">
                            <span>Onboarding</span>
                            <strong>{stripeOnboardingCompleted ? 'Completato' : 'Da completare'}</strong>
                          </div>
                          <div className="wallet-preview__detail">
                            <span>Bonifici</span>
                            <strong>{stripePayoutsEnabled ? 'Abilitati' : 'Non abilitati'}</strong>
                          </div>
                          <div className="wallet-preview__detail">
                            <span>Pagamenti</span>
                            <strong>{stripeChargesEnabled ? 'Abilitati' : 'Non abilitati'}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="wallet-preview__empty">
                          <span aria-hidden="true">🏦</span>
                          <div>
                            <strong>Nessun conto collegato</strong>
                            <p>Collega un conto bancario tramite Stripe per ricevere i compensi.</p>
                          </div>
                        </div>
                      )}

                      <div className="form-actions profile-settings__inline-actions">
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => void handleConnectStripe()}
                          disabled={connectingStripe}
                        >
                          {connectingStripe
                            ? 'Collegamento…'
                            : walletReady
                              ? 'Gestisci account Stripe'
                              : stripeAccountId
                                ? 'Completa configurazione Stripe'
                                : 'Collega conto bancario'}
                        </button>
                      </div>

                      <div className="wallet-preview__coming-soon">
                        <strong>Prossimamente nel Wallet ELPYO</strong>
                        <p>Saldo disponibile, totale guadagnato, movimenti e trasferimenti sul conto.</p>
                      </div>
                    </div>
                  </SettingsSection>

                  <SettingsSection
                    id="emergency"
                    icon="🚨"
                    title="Sicurezza ed emergenze"
                    description="Configura un contatto fidato per i servizi attivi."
                    isOpen={openSection === 'emergency'}
                    onToggle={() => toggleSection('emergency')}
                  >
                    <p className="profile-settings__content-description">
                      Inserisci una persona da contattare rapidamente in caso di necessità durante un aiuto.
                    </p>

                    <div className="profile-settings__grid">
                      <div className="form-field">
                        <label htmlFor="emergencyContactName">Nome contatto</label>
                        <input
                          id="emergencyContactName"
                          type="text"
                          value={emergencyContactName}
                          onChange={(event) => setEmergencyContactName(event.target.value)}
                          placeholder="Es. Marco Rossi"
                          disabled={saving}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="emergencyContactPhone">Telefono contatto</label>
                        <input
                          id="emergencyContactPhone"
                          type="tel"
                          value={emergencyContactPhone}
                          onChange={(event) => setEmergencyContactPhone(event.target.value)}
                          placeholder="Es. +393331234567"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <label className="profile-settings__checkbox">
                      <input
                        type="checkbox"
                        checked={emergencyShareLocation}
                        onChange={(event) => setEmergencyShareLocation(event.target.checked)}
                        disabled={saving}
                      />
                      <span>
                        Autorizzo ELPYO a condividere la mia posizione durante un servizio attivo,
                        esclusivamente con l&apos;altra persona coinvolta.
                      </span>
                    </label>
                  </SettingsSection>

                </div>

                <div className="profile-settings__save">
                  <button className="btn btn--primary" type="submit" disabled={saving}>
                    {saving ? 'Salvataggio…' : 'Salva le modifiche'}
                  </button>
                  <p>Dati personali, password e contatti di emergenza vengono salvati insieme.</p>
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
