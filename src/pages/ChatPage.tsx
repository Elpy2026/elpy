import { useCallback, useEffect, useState } from 'react'
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

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ChatPage() {
  const { requestId } = useParams()
  const { user } = useAuth()

  const [request, setRequest] = useState<RequestData | null>(null)
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadMessages = useCallback(async (activeConversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
      return
    }

    setMessages(data ?? [])
  }, [])

  useEffect(() => {
    async function loadChat() {
      if (!requestId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('id, title, description, status, seeker_id, helper_id')
        .eq('id', requestId)
        .single()

      if (requestError || !requestData) {
        setError(requestError?.message ?? 'Richiesta non trovata.')
        setLoading(false)
        return
      }

      setRequest(requestData)

      let { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', requestId)
        .maybeSingle()

      if (conversationError) {
        setError(conversationError.message)
        setLoading(false)
        return
      }

      if (!conversation) {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            request_id: requestId,
            seeker_id: requestData.seeker_id,
            helper_id: requestData.helper_id,
          })
          .select('id')
          .single()

        if (createError || !newConversation) {
          setError(createError?.message ?? 'Impossibile creare la conversazione.')
          setLoading(false)
          return
        }

        conversation = newConversation
      }

      setConversationId(conversation.id)
      await loadMessages(conversation.id)
      setLoading(false)
    }

    void loadChat()
  }, [requestId, loadMessages])

  useEffect(() => {
    if (!conversationId) return

    const interval = window.setInterval(() => {
      void loadMessages(conversationId)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [conversationId, loadMessages])

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault()

    if (!user || !conversationId || !newMessage.trim() || sending) {
      return
    }

    setSending(true)
    setError('')

    const content = newMessage.trim()

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })

    if (error) {
      setError(error.message)
      setSending(false)
      return
    }

    setNewMessage('')
    await loadMessages(conversationId)
    setSending(false)
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
                  <h2 className="request-card__title">{request.title}</h2>
                  <p>{request.description}</p>
                  <p>
                    <strong>Stato:</strong> {request.status}
                  </p>
                </div>

                <div className="request-card">
                  <h2 className="request-card__title">Conversazione</h2>

                  {messages.length === 0 ? (
                    <p>Nessun messaggio ancora. Inizia tu la conversazione.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {messages.map((message) => {
                        const isMine = message.sender_id === user?.id

                        return (
                          <div
                            key={message.id}
                            style={{
                              alignSelf: isMine ? 'flex-end' : 'flex-start',
                              maxWidth: '85%',
                              padding: '0.75rem 1rem',
                              borderRadius: 14,
                              background: isMine ? 'var(--green-50)' : '#fff',
                              border: '1px solid var(--border)',
                              boxShadow: 'var(--shadow-sm)',
                            }}
                          >
                            <strong>{isMine ? 'Tu' : 'Altro utente'}</strong>
                            <p style={{ margin: '0.35rem 0' }}>{message.content}</p>
                            <small style={{ color: 'var(--text-muted)' }}>
                              {formatMessageTime(message.created_at)}
                            </small>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} style={{ marginTop: '1.25rem' }}>
                    <div className="form-field">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={4}
                        placeholder="Scrivi un messaggio..."
                        disabled={sending}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={sending || !newMessage.trim()}
                    >
                      {sending ? 'Invio…' : 'Invia messaggio'}
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