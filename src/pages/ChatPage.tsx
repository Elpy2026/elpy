import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type RequestData = {
  id: string
  title: string
  description: string
  status: string | null
  seeker_id: string
  helper_id: string
}

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

function ChatPage() {
  const { requestId } = useParams()
  const { user } = useAuth()

  const [request, setRequest] = useState<RequestData | null>(null)
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadChat() {
      if (!requestId) return

      const { data: requestData } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (!requestData) {
        setLoading(false)
        return
      }

      setRequest(requestData)

      let { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle()

      if (!conversation) {
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({
            request_id: requestId,
            seeker_id: requestData.seeker_id,
            helper_id: requestData.helper_id,
          })
          .select()
          .single()

        conversation = newConversation
      }

      if (!conversation) {
        setLoading(false)
        return
      }

      setConversationId(conversation.id)

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      setMessages(messagesData ?? [])
      setLoading(false)
    }

    void loadChat()
  }, [requestId])

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault()

    if (!user || !conversationId || !newMessage.trim()) {
      return
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim(),
      })

    if (error) {
      setError(error.message)
      return
    }

    const message: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, message])
    setNewMessage('')
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Chat</p>
              <h1 className="page-title">Messaggi</h1>
            </div>

            {loading && <p>Caricamento...</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && request && (
              <>
                <div className="request-card">
                  <h2 className="request-card__title">
                    {request.title}
                  </h2>

                  <p>{request.description}</p>
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">
                    Conversazione
                  </h2>

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        padding: '12px',
                        marginBottom: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                      }}
                    >
                      <strong>
                        {message.sender_id === user?.id
                          ? 'Tu'
                          : 'Altro utente'}
                      </strong>

                      <p>{message.content}</p>
                    </div>
                  ))}

                  <form onSubmit={handleSendMessage}>
                    <div className="form-field">
                      <textarea
                        value={newMessage}
                        onChange={(e) =>
                          setNewMessage(e.target.value)
                        }
                        rows={4}
                        placeholder="Scrivi un messaggio..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn--primary"
                    >
                      Invia messaggio
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ChatPage