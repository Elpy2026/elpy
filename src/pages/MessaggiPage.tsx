import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Conversation = {
  id: string
  request_id: string
}

type RequestInfo = {
  id: string
  title: string
}

type MessageInfo = {
  content: string
  created_at: string
}

function MessaggiPage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [conversations, setConversations] = useState<
    Array<{
      conversationId: string
      requestId: string
      requestTitle: string
      lastMessage: string
      lastDate: string
    }>
  >([])

  useEffect(() => {
    async function loadConversations() {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from('conversations')
          .select('*')
          .or(`seeker_id.eq.${user.id},helper_id.eq.${user.id}`)

      if (conversationsError) {
        setError(conversationsError.message)
        setLoading(false)
        return
      }

      const result = []

      for (const conversation of (conversationsData ??
        []) as Conversation[]) {
        const { data: requestData } = await supabase
          .from('requests')
          .select('id,title')
          .eq('id', conversation.request_id)
          .maybeSingle()

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content,created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        result.push({
          conversationId: conversation.id,
          requestId: conversation.request_id,
          requestTitle:
            (requestData as RequestInfo | null)?.title ??
            'Richiesta',
          lastMessage:
            (lastMessage as MessageInfo | null)?.content ??
            'Nessun messaggio',
          lastDate:
            (lastMessage as MessageInfo | null)?.created_at ??
            '',
        })
      }

      result.sort((a, b) =>
        b.lastDate.localeCompare(a.lastDate),
      )

      setConversations(result)
      setLoading(false)
    }

    void loadConversations()
  }, [user])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Messaggi</p>

              <h1 className="page-title">
                Le tue conversazioni
              </h1>

              <p className="page-subtitle">
                Tutte le chat attive in un unico posto.
              </p>
            </div>

            {loading && <p>Caricamento conversazioni...</p>}

            {error && (
              <div className="alert alert--error">
                {error}
              </div>
            )}

            {!loading &&
              conversations.length === 0 && (
                <div className="empty-state">
                  <p>
                    Non hai ancora conversazioni.
                  </p>
                </div>
              )}

            {!loading &&
              conversations.length > 0 && (
                <ul className="requests-list">
                  {conversations.map(
                    (conversation) => (
                      <li
                        key={conversation.conversationId}
                        className="request-card"
                      >
                        <h2 className="request-card__title">
                          {
                            conversation.requestTitle
                          }
                        </h2>

                        <p>
                          Ultimo messaggio:
                        </p>

                        <p>
                          {
                            conversation.lastMessage
                          }
                        </p>

                        <div className="form-actions">
                          <Link
                            to={`/chat/${conversation.requestId}`}
                            className="btn btn--primary"
                          >
                            Apri chat
                          </Link>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default MessaggiPage