import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/prelaunch.css'

function PreLaunchPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [cap, setCap] = useState('')
  const [interest, setInterest] = useState('both')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const role = interest === 'helper' ? 'helper' : 'seeker'

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          city,
          postal_code: cap,
          role,
          prelaunch_interest: interest,
          prelaunch_signup: true,
          accepted_terms: true,
          accepted_privacy: true,
          marketing_consent: true,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <main className="prelaunch">
      <header className="prelaunch-header">
        <img src="/elpy-logo-header-transparent.png" alt="ELPYO" />
        <nav>
          <a href="#come-funziona">Come funziona</a>
          <a href="#per-chi">Per chi</a>
          <a href="#iscriviti">Iscriviti</a>
        </nav>
        <a className="prelaunch-login" href="/login">Accedi</a>
      </header>

      <section className="prelaunch-hero">
        <div className="prelaunch-hero__copy">
          <h1>Aiuto vero,<br /><span>quando serve.</span></h1>
          <p>
  Trova una persona affidabile vicino a te oppure metti a disposizione il tuo tempo e guadagna aiutando la tua comunità.
</p>

          <div className="prelaunch-hero__actions">
            <a href="#iscriviti" className="prelaunch-btn prelaunch-btn--orange">
              Trova aiuto <small>Ho bisogno di una mano</small>
            </a>
            <a href="#iscriviti" className="prelaunch-btn prelaunch-btn--purple">
              Offri aiuto <small>Guadagna aiutando gli altri</small>
            </a>
          </div>

          <div className="prelaunch-counter">
            <strong>La community ELPYO sta nascendo.</strong>
            <span>Unisciti ora e aiutaci ad aprire nella tua città.</span>
          </div>
        </div>

        <div className="prelaunch-hero__image">
          <img src="/landing-waiting-hero.png" alt="Aiuto quotidiano ELPYO" />
        </div>
      </section>

      <section className="prelaunch-progress">
        <div>
          <h2>Insieme possiamo fare la differenza.</h2>
          <p>Più siamo, prima apriremo ELPYO nella tua città.</p>
        </div>
      </section>

      <section id="peri" className="prelaunch-split">
        <article className="prelaunch-card prelaunch-card--help">
          <img src="/landing-card-seeker.png" alt="Cerco aiuto" />
          <div>
            <h2>Cerco aiuto</h2>
            <p>Spesa, commissioni, accompagnamenti e molto altro. Trova qualcuno di affidabile vicino a te.</p>
          </div>
        </article>

        <article className="prelaunch-card prelaunch-card--helper">
          <div>
            <h2>Offro aiuto</h2>
            <p>Metti a disposizione il tuo tempo, aiuta il quartiere e guadagna in libertà e sicurezza.</p>
          </div>
          <img src="/landing-card-helper.png" alt="Offro aiuto" />
        </article>
      </section>

      <section id="come-funziona" className="prelaunch-steps">
        <h2>Come funziona</h2>
        <div className="prelaunch-steps__grid">
          <div><span>1</span><h3>Ti iscrivi</h3><p>Entri nella community pre-lancio.</p></div>
          <div><span>2</span><h3>La community cresce</h3><p>Raccogliamo perone nella tua zona.</p></div>
          <div><span>3</span><h3>ELPYO apre</h3><p>Potrai accedere con il tuo account.</p></div>
        </div>
      </section>

      <section className="prelaunch-different">
        <h2>Perché ELPYO è diverso</h2>
        <div>
          <article>🛡️<strong>Persone verificate</strong><p>Profili controllati per la tua sicurezza.</p></article>
          <article>🤝<strong>Community locale</strong><p>Persone della tua zona pronte ad aiutarti.</p></article>
          <article>💶<strong>Guadagno reale</strong><p>Il tuo tempo ha valore, per te e per gli altri.</p></article>
        </div>
      </section>

      <section className="prelaunch-gallery">
        <img src="/landing-waiting-hero.png" alt="" />
        <img src="/landing-waiting-help.jpg" alt="" />
        <img src="/landing-waiting-community.jpg" alt="" />
      </section>

      <section id="iscriviti" className="prelaunch-form-section">
        <div className="prelaunch-form-section__copy">
          <h2>E community ELPYO</h2>
          <p>Crei già il tuo account. Quando ELPYO aprirà nella tua città potrai accedere direttamente.</p>
          <ul>
            <li>Accesso prioritario al lancio</li>
            <li>Nessun impegno</li>
            <li>Potrai cercare aiuto o offrire il tuo tempo</li>
          </ul>
        </div>

        <form className="prelaunch-form" onSubmit={handleSubmit}>
          {success ? (
            <div className="prelaunch-success">
              <h3>Benvenuto nella community 🎉</h3>
              <p>Controlla la tua email per confermare l’account.</p>
            </div>
          ) : (
            <>
              <div className="prelaunch-form__grid">
                <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
                <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
                <label>
  Password
  <input
    type="password"
    minLength={8}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />
</label>
                <label>Città<input value={city} onChange={(e) => setCity(e.target.value)} required /></label>
                <label>CAP<input value={cap} onChange={(e) => setCap(e.target.value)} required /></label>
              </div>

              <fieldset>
                <legend>Sono interessato a:</legend>
                <label><input type="radio" name="interest" value="seeker" checked={interest === 'seeker'} onChange={(e) => setInterest(e.target.value)} /> Cerco aiuto</label>
                <label><input type="radio" name="interest" value="helper" checked={interest === 'helper'} onChange={(e) => setInterest(e.target.value)} /> Offro aiuto</label>
                <label><input type="radio" name="interest" value="both" checked={interest === 'both'} onChange={(e) => setInterest(e.target.value)} /> Entrambe</label>
              </fieldset>

              {error && <p className="prelaunch-error">{error}</p>}

              <button disabled={loading} type="submit">
                {loading ? 'Iscrizione...' : 'Crea il mio account ELPYO'}
                <span>→</span>
              </button>

              <small>Usiamo i tuoi dati solo per il lancio di ELPYO.</small>
            </>
          )}
        </form>
      </section>
    </main>
  )
}

export default PreLaunchPage
