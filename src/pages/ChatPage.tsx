import Header from '../components/Header'
import Footer from '../components/Footer'

function ChatPage() {
  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Chat</p>
              <h1 className="page-title">Messaggi</h1>
              <p className="page-subtitle">
                Sistema chat ELPY in preparazione.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ChatPage