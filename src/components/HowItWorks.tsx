const steps = [
  {
    number: '01',
    title: 'Pubblica una richiesta',
    description:
      'Descrivi di cosa hai bisogno, quando e dove. Ci vogliono pochi minuti.',
  },
  {
    number: '02',
    title: 'Ricevi candidature',
    description:
      'Helper verificati della tua città rispondono con proposta e disponibilità.',
  },
  {
    number: '03',
    title: 'Scegli il tuo helper',
    description:
      'Confronta profili e recensioni, poi conferma in tutta tranquillità.',
  },
]

function HowItWorks() {
  return (
    <section
      id="come-funziona"
      className="section how-it-works"
      aria-labelledby="how-title"
    >
      <div className="container">
        <div className="section__header">
          <h2 id="how-title" className="section__title">
            Come funziona
          </h2>
          <p className="section__subtitle">
            Tre passi semplici per ricevere supporto quotidiano, vicino a casa.
          </p>
        </div>
        <ol className="steps">
          {steps.map((step) => (
            <li key={step.number} className="step-card">
              <span className="step-card__number" aria-hidden="true">
                {step.number}
              </span>
              <div className="step-card__content">
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__desc">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default HowItWorks
