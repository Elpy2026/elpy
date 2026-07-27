import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PageBackButton from '../components/PageBackButton'
import BackButton from '../components/BackButton'
import './ChatPage.css'

type RequestData = {
  id: string
  title: string
  description: string
  status: string | null
  seeker_id: string
  helper_id: string
}

type Conversation = {
  id: string
  seeker_id: string
  helper_id: string
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ChatPage() {
  const { requestId } = useParams()
  const location = useLocation()
const preferredConversationId =
  (location.state as { conversationId?: string } | null)?.conversationId ?? ''
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const [request, setRequest] = useState<RequestData | null>(null)
  const [conversationId, setConversationId] = useState('')
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  function scrollToBottom() {
    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  const markMessagesAsRead = useCallback(
    async (activeConversationId: string) => {
      if (!user) return
  

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', activeConversationId)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .select('id, read_at')

      if (error) {
        setError(error.message)
        return
      }


      setMessages((current) =>
        current.map((message) =>
          message.sender_id !== user.id && message.read_at === null
            ? { ...message, read_at: new Date().toISOString() }
            : message,
        ),
      )

      window.dispatchEvent(new Event('elpyo-badges-refresh'))

      window.setTimeout(() => {
        window.dispatchEvent(new Event('elpyo-badges-refresh'))
      }, 800)
    },
    [user],
  )

  const loadMessages = useCallback(
    async (activeConversationId: string) => {
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
      await markMessagesAsRead(activeConversationId)
      scrollToBottom()
    },
    [markMessagesAsRead],
  )

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

      const { data: conversationsData, error: conversationError } = await supabase
        .from('conversations')
        .select('id, seeker_id, helper_id')
        .eq('request_id', requestId)

      if (conversationError) {
        setError(conversationError.message)
        setLoading(false)
        return
      }

      const availableConversations = (conversationsData ?? []) as Conversation[]
      let conversation: Conversation | null =
  availableConversations.find((item) => item.id === preferredConversationId) ??
  availableConversations[0] ??
  null

      if (user && availableConversations.length > 1) {
        const conversationIds = availableConversations.map((item) => item.id)

        const { data: unreadRows } = await supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id)
          .is('read_at', null)

        const unreadConversationId = unreadRows?.[0]?.conversation_id

        if (unreadConversationId) {
          conversation =
            availableConversations.find((item) => item.id === unreadConversationId) ??
            conversation
        }
      }

      if (!conversation) {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            request_id: requestId,
            seeker_id: requestData.seeker_id,
            helper_id: requestData.helper_id,
          })
          .select('id, seeker_id, helper_id')
          .single()

        if (createError || !newConversation) {
          setError(createError?.message ?? 'Impossibile creare la conversazione.')
          setLoading(false)
          return
        }

        conversation = newConversation
      }

      setConversationId(conversation.id)
      setActiveConversation(conversation)
      await loadMessages(conversation.id)
      setLoading(false)
    }

    void loadChat()
  }, [requestId, loadMessages, user, preferredConversationId])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incomingMessage = payload.new as Message

          setMessages((current) => {
            const alreadyExists = current.some(
              (message) => message.id === incomingMessage.id,
            )

            if (alreadyExists) {
              return current
            }

            return [...current, incomingMessage].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            )
          })

          if (incomingMessage.sender_id !== user?.id) {
            void markMessagesAsRead(conversationId)
          }

          scrollToBottom()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message

          setMessages((current) =>
            current.map((message) =>
              message.id === updatedMessage.id ? updatedMessage : message,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, markMessagesAsRead, user?.id])

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault()

    if (!user || !conversationId || !newMessage.trim() || sending) {
      return
    }

    setSending(true)
    setError('')

    const content = newMessage.trim()
    setNewMessage('')

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })

    if (error) {
      setError(error.message)
      setNewMessage(content)
      setSending(false)
      return
    }

    const recipientId =
      user.id === activeConversation?.seeker_id
        ? activeConversation?.helper_id
        : activeConversation?.seeker_id

    if (recipientId && recipientId !== user.id && requestId) {
      const preview =
        content.length > 100
          ? `${content.slice(0, 97)}...`
          : content

      const { error: pushError } =
        await supabase.functions.invoke('send-push', {
          body: {
            userId: recipientId,
            requestId,
            payload: {
              title: 'Nuovo messaggio su ELPYO',
              body: preview,
              url: `/chat/${requestId}`,
            },
          },
        })

      if (pushError) {
        console.error(
          'Errore push nuovo messaggio:',
          pushError,
        )
      }
    }

    setSending(false)
  }

  return (
    <div className="landing">
      <Header />
      <PageBackButton />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <BackButton />

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

                <section className="chat-page__shell">
                  <header className="chat-page__header">
                    <span className="chat-page__eyebrow">Chat privata</span>
                    <h2>Conversazione</h2>
                  </header>

                  <div className="chat-page__messages">
                    {messages.length === 0 ? (
                      <div className="chat-page__empty">
                        <strong>Nessun messaggio ancora</strong>
                        <span>Inizia tu la conversazione.</span>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = message.sender_id === user?.id

                        return (
                          <article
                            key={message.id}
                            className={
                              isMine
                                ? 'chat-page__message chat-page__message--mine'
                                : 'chat-page__message chat-page__message--other'
                            }
                          >
                            <strong className="chat-page__author">
                              {isMine ? 'Tu' : 'Altro utente'}
                            </strong>
                            <p className="chat-page__text">{message.content}</p>
                            <small className="chat-page__meta">
                              {formatMessageTime(message.created_at)}
                              {isMine && message.read_at ? ' · letto' : ''}
                            </small>
                          </article>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form className="chat-page__composer" onSubmit={handleSendMessage}>
                    <textarea
                      className="chat-page__textarea"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      placeholder="Scrivi un messaggio..."
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      className="btn btn--primary chat-page__send"
                      disabled={sending || !newMessage.trim()}
                    >
                      {sending ? 'Invio…' : 'Invia messaggio'}
                    </button>
                  </form>
                </section>
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
