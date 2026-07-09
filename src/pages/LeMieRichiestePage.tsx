import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { cancelAcceptedRequest } from '../lib/cancellations'
import { createAdminNotification } from '../lib/adminNotifications'
import { useAuth } from '../context/AuthContext'
import SafetyPanel from '../components/SafetyPanel'

type HelperProfile = {
  id: string
  full_name: string | null
  phone: string | null
  verified: boolean | null
}

type Application = {
  id: string
  request_id: string
  helper_id: string
  message: string | null
  status: string
  created_at: string | null
  accepted_at: string | null
  seeker_id: string | null
}

type MyRequest = {
  id: string
  category: string
  title: string
  description: string
  city: string
  request_date: string
  reward: number | string
  status: string | null
  created_at: string | null
  accepted_at: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  cancellation_fee_status: string | null
  cancellation_fee_amount: number | string | null
  seeker_id: string | null
  helper_id: string | null
  payment_status: string | null
  expense_status: string | null
  paid_at: string | null
  platform_fee: number | string | null
  helper_amount: number | string | null
}

type RequestExpense = {
  id: string
  request_id: string
  helper_id: string
  receipt_image_path: string | null
  receipt_amount: number | string
  status: string
  notes: string | null
  created_at: string | null
}

const PLATFORM_FEE_PERCENTAGE = 15
const MIN_PLATFORM_FEE = 2
const PLATFORM_FEE_THRESHOLD = 20

function calculatePaymentAmounts(reward: number | string, approvedExpenses = 0) {
  const helperAmount = Number(reward)
  const safeHelperAmount = Number.isNaN(helperAmount) ? 0 : helperAmount

  const platformFee =
    safeHelperAmount > 0
      ? safeHelperAmount <= PLATFORM_FEE_THRESHOLD
        ? MIN_PLATFORM_FEE
        : Number(((safeHelperAmount * PLATFORM_FEE_PERCENTAGE) / 100).toFixed(2))
      : 0

  const total = Number((safeHelperAmount + approvedExpenses + platformFee).toFixed(2))

  return {
    total,
    platformFee,
    helperAmount: safeHelperAmount,
    approvedExpenses,
  }
}

function LeMieRichiestePage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MyRequest[]>([])
  const [applications, setApplications] = useState<Record<string, Application[]>>({})
  const [expenses, setExpenses] = useState<Record<string, RequestExpense[]>>({})
  const [expenseUrls, setExpenseUrls] = useState<Record<string, string>>({})
  const [helpers, setHelpers] = useState<Record<string, HelperProfile>>({})
  const [loading, setLoading] = useState(true)
  const [acceptingApplicationId, setAcceptingApplicationId] = useState('')
  const [rejectingApplicationId, setRejectingApplicationId] = useState('')
  const [completingRequestId, setCompletingRequestId] = useState('')
  const [approvingExpenseId, setApprovingExpenseId] = useState('')
  const [contestingExpenseId, setContestingExpenseId] = useState('')
  const [payingRequestId, setPayingRequestId] = useState('')
  const [cancellingRequestId, setCancellingRequestId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [openReceiptUrl, setOpenReceiptUrl] = useState('')

  async function loadMyRequests() {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('seeker_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const myRequests = data ?? []
    setRequests(myRequests)

    const requestIds = myRequests.map((request) => request.id)

    if (requestIds.length > 0) {
      const { data: expensesData, error: expensesError } = await supabase
        .from('request_expenses')
        .select('*')
        .in('request_id', requestIds)
        .order('created_at', { ascending: false })

      if (expensesError) {
        setError(expensesError.message)
      } else {
        const groupedExpenses: Record<string, RequestExpense[]> = {}
        const urls: Record<string, string> = {}

        for (const expense of expensesData ?? []) {
          if (!groupedExpenses[expense.request_id]) {
            groupedExpenses[expense.request_id] = []
          }

          groupedExpenses[expense.request_id].push(expense)

          if (expense.receipt_image_path) {
            const { data: signedUrlData } = await supabase.storage
              .from('receipts')
              .createSignedUrl(expense.receipt_image_path, 60 * 10)

            if (signedUrlData?.signedUrl) {
              urls[expense.id] = signedUrlData.signedUrl
            }
          }
        }

        setExpenses(groupedExpenses)
        setExpenseUrls(urls)
      }
    } else {
      setExpenses({})
      setExpenseUrls({})
    }

    const helperIdsFromRequests = myRequests
      .map((request) => request.helper_id)
      .filter((id): id is string => Boolean(id))

    let helperIdsFromApplications: string[] = []

    if (requestIds.length > 0) {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('request_applications')
        .select('*')
        .in('request_id', requestIds)
        .order('created_at', { ascending: false })

      if (applicationsError) {
        setError(applicationsError.message)
      } else {
        const grouped: Record<string, Application[]> = {}

        for (const application of applicationsData ?? []) {
          if (!grouped[application.request_id]) {
            grouped[application.request_id] = []
          }

          grouped[application.request_id].push(application)
        }

        setApplications(grouped)

        helperIdsFromApplications = (applicationsData ?? [])
          .map((application) => application.helper_id)
          .filter((id): id is string => Boolean(id))
      }
    }

    const helperIds = Array.from(
      new Set([...helperIdsFromRequests, ...helperIdsFromApplications]),
    )

    if (helperIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, verified')
        .in('id', helperIds)

      const profilesMap: Record<string, HelperProfile> = {}

      for (const profile of profilesData ?? []) {
        profilesMap[profile.id] = profile
      }

      setHelpers(profilesMap)
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadMyRequests()
  }, [user])

  async function handleAcceptApplication(application: Application) {
    setError('')
    setMessage('')
    setAcceptingApplicationId(application.id)

    const { error: requestError } = await supabase
      .from('requests')
      .update({
        status: 'accettata',
        helper_id: application.helper_id,
        payment_status: 'not_required',
        expense_status: 'none',
        accepted_at: new Date().toISOString(),
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        cancellation_fee_status: 'none',
        cancellation_fee_amount: 0,
      })
      .eq('id', application.request_id)
      .eq('status', 'aperta')

    if (requestError) {
      setError(requestError.message)
      setAcceptingApplicationId('')
      return
    }

    const { error: acceptedError } = await supabase
      .from('request_applications')
      .update({ status: 'accepted' })
      .eq('id', application.id)

    if (acceptedError) {
      setError(acceptedError.message)
      setAcceptingApplicationId('')
      return
    }

    const { data: requestData } = await supabase
      .from('requests')
      .select('id, seeker_id, helper_id')
      .eq('id', application.request_id)
      .single()

    if (requestData?.seeker_id && requestData?.helper_id) {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', application.request_id)
        .eq('seeker_id', requestData.seeker_id)
        .eq('helper_id', requestData.helper_id)
        .maybeSingle()

      if (!existingConversation) {
        await supabase.from('conversations').insert({
          request_id: application.request_id,
          seeker_id: requestData.seeker_id,
          helper_id: requestData.helper_id,
        })
      }
    }

    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: application.helper_id,
      type: 'application_accepted',
      title: 'Candidatura accettata',
      body: 'La tua candidatura è stata accettata.',
      is_read: false,
      link: `/chat/${application.request_id}`,
    })

    if (notificationError) {
      setError(notificationError.message)
      setAcceptingApplicationId('')
      return
    }

    await supabase
      .from('request_applications')
      .update({ status: 'rejected' })
      .eq('request_id', application.request_id)
      .neq('id', application.id)

    setMessage('Candidatura accettata con successo.')
    setAcceptingApplicationId('')
    await loadMyRequests()
  }

  async function handleRejectApplication(application: Application) {
    setError('')
    setMessage('')
    setRejectingApplicationId(application.id)

    const { error } = await supabase
      .from('request_applications')
      .update({ status: 'rejected' })
      .eq('id', application.id)

    if (error) {
      setError(error.message)
      setRejectingApplicationId('')
      return
    }

    await supabase.from('notifications').insert({
      user_id: application.helper_id,
      type: 'application_rejected',
      title: 'Candidatura non selezionata',
      body: 'Per questa richiesta è stato scelto un altro helper.',
      link: '/offro-aiuto',
      is_read: false,
    })

    setMessage('Candidatura rifiutata.')
    setRejectingApplicationId('')
    await loadMyRequests()
  }

  async function handleCancelRequest(request: MyRequest) {
    if (!user) return

    setError('')
    setMessage('')
    setCancellingRequestId(request.id)

    const result = await cancelAcceptedRequest({
      requestId: request.id,
      reward: request.reward,
      acceptedAt: request.accepted_at,
      cancelledBy: user.id,
      reason: 'seeker_cancelled_after_acceptance',
    })

    if (result.error) {
      setError(result.error)
      setCancellingRequestId('')
      return
    }

    setMessage(
      result.feeAmount > 0
        ? `Accordo annullato. Commissione ELPYO registrata: €${result.feeAmount}. La richiesta è tornata aperta.`
        : 'Accordo annullato entro 15 minuti senza commissione. La richiesta è tornata aperta.',
    )

    setCancellingRequestId('')
    await loadMyRequests()
  }

  async function handleCompleteRequest(requestId: string) {
    setError('')
    setMessage('')
    setCompletingRequestId(requestId)

    const completedAt = new Date().toISOString()

    const { error } = await supabase
      .from('requests')
      .update({
        status: 'completata',
        payment_status: 'pending',
        completed_at: completedAt,
      })
      .eq('id', requestId)
      .eq('status', 'accettata')

    if (error) {
      setError(error.message)
      setCompletingRequestId('')
      return
    }

    const completedRequest = requests.find((request) => request.id === requestId)

    await createAdminNotification({
      type: 'request_completed',
      title: 'Richiesta completata',
      message: `La richiesta "${completedRequest?.title ?? 'senza titolo'}" è stata segnata come completata.`,
      metadata: {
        request_id: requestId,
        request_title: completedRequest?.title ?? null,
        seeker_id: user?.id ?? null,
        helper_id: completedRequest?.helper_id ?? null,
        reward: completedRequest?.reward ?? null,
        completed_at: completedAt,
      },
    })

    setMessage('Richiesta completata. Ora puoi procedere con il pagamento.')
    setCompletingRequestId('')
    await loadMyRequests()
  }

  async function handleApproveExpense(request: MyRequest, expense: RequestExpense) {
    if (!user) return

    setError('')
    setMessage('')
    setApprovingExpenseId(expense.id)

    const { error: expenseError } = await supabase
      .from('request_expenses')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', expense.id)

    if (expenseError) {
      setError(expenseError.message)
      setApprovingExpenseId('')
      return
    }

    const { error: requestError } = await supabase
      .from('requests')
      .update({ expense_status: 'approved' })
      .eq('id', request.id)

    if (requestError) {
      setError(requestError.message)
      setApprovingExpenseId('')
      return
    }

    setMessage('Spesa approvata. Ora puoi procedere con il pagamento.')
    setApprovingExpenseId('')
    await loadMyRequests()
  }

  async function handleContestExpense(request: MyRequest, expense: RequestExpense) {
    const reason = window.prompt('Inserisci il motivo della contestazione:')

    if (!reason || reason.trim().length < 3) {
      setError('Inserisci un motivo valido per contestare la spesa.')
      return
    }

    setError('')
    setMessage('')
    setContestingExpenseId(expense.id)

    const { error: expenseError } = await supabase
      .from('request_expenses')
      .update({
        status: 'contested',
        contest_reason: reason.trim(),
        contested_at: new Date().toISOString(),
      })
      .eq('id', expense.id)

    if (expenseError) {
      setError(expenseError.message)
      setContestingExpenseId('')
      return
    }

    const { error: requestError } = await supabase
      .from('requests')
      .update({ expense_status: 'contested' })
      .eq('id', request.id)

    if (requestError) {
      setError(requestError.message)
      setContestingExpenseId('')
      return
    }

    setMessage('Spesa contestata. La richiesta resta bloccata finché non viene risolta.')
    setContestingExpenseId('')
    await loadMyRequests()
  }

  async function handleStripePayment(request: MyRequest, approvedExpensesTotal: number) {
    setError('')
    setMessage('')
    setPayingRequestId(request.id)

    const amounts = calculatePaymentAmounts(request.reward, approvedExpensesTotal)

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            requestId: request.id,
            amount: amounts.total,
            description: `Pagamento richiesta ELPYO - ${request.title}`,
          },
        },
      )

      if (error) throw error

      if (!data?.url) {
        throw new Error('Stripe non ha restituito il link di pagamento.')
      }

      window.location.href = data.url
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Errore durante il pagamento.',
      )
      setPayingRequestId('')
    }
  }

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <div className="page-header">
              <p className="hero__badge">Area personale</p>
              <h1 className="page-title">Le mie richieste</h1>
              <p className="page-subtitle">
                Qui trovi tutte le richieste che hai pubblicato su ELPYO.
              </p>
            </div>

            {message && <div className="alert alert--success">{message}</div>}
            {loading && <p>Caricamento richieste…</p>}
            {error && <div className="alert alert--error">{error}</div>}

            {!loading && requests.length === 0 && (
              <div className="empty-state">
                <p>Non hai ancora pubblicato richieste.</p>
                <Link to="/cerco-aiuto" className="btn btn--primary">
                  Pubblica una richiesta
                </Link>
              </div>
            )}

            {requests.length > 0 && (
              <ul className="requests-list">
                {requests.map((request) => {
                  const helper = request.helper_id ? helpers[request.helper_id] : null
                  const requestApplications = applications[request.id] ?? []
                  const requestExpenses = expenses[request.id] ?? []
                  const pendingExpenses = requestExpenses.filter(
                    (expense) => expense.status === 'pending',
                  )
                  const approvedExpensesTotal = requestExpenses
                    .filter((expense) => expense.status === 'approved')
                    .reduce((sum, expense) => sum + Number(expense.receipt_amount), 0)

                  const amounts = calculatePaymentAmounts(
                    request.reward,
                    approvedExpensesTotal,
                  )
                  const paymentStatus = request.payment_status ?? 'not_required'
                  const canPay =
                    request.status === 'completata' &&
                    paymentStatus !== 'paid' &&
                    request.expense_status !== 'pending' &&
                    request.expense_status !== 'contested'

                  return (
                    <li key={request.id} className="request-card">
                      <div className="request-card__header">
                        <span className="request-card__category">
                          {request.category}
                        </span>
                        <span className="badge badge--accepted">
                          {request.status ?? 'aperta'}
                        </span>
                      </div>

                      <h2 className="request-card__title">{request.title}</h2>
                      <p className="request-card__desc">{request.description}</p>

                      <dl className="request-card__meta">
                        <div>
                          <dt>Città</dt>
                          <dd>{request.city}</dd>
                        </div>
                        <div>
                          <dt>Data</dt>
                          <dd>{request.request_date}</dd>
                        </div>
                        <div>
                          <dt>Compenso</dt>
                          <dd className="request-card__compenso">
                            €{request.reward}
                          </dd>
                        </div>
                      </dl>

                      {request.cancellation_fee_status === 'pending' && (
                        <div className="alert alert--error">
                          Commissione ELPYO da gestire per annullamento: €
                          {request.cancellation_fee_amount ?? 0}
                        </div>
                      )}

                      {request.status === 'aperta' && (
                        <div className="request-card">
                          <h3>Candidature ricevute</h3>

                          {requestApplications.length === 0 ? (
                            <p>Nessuna candidatura ricevuta.</p>
                          ) : (
                            <ul className="requests-list">
                              {requestApplications.map((application) => {
                                const applicant = helpers[application.helper_id]

                                return (
                                  <li key={application.id} className="request-card">
                                    <p>
                                      <strong>Helper:</strong>{' '}
                                      {applicant?.full_name ?? 'Helper ELPYO'}
                                      {applicant?.verified && ' · Identità verificata'}
                                    </p>

                                    <p>
                                      <strong>Messaggio:</strong>{' '}
                                      {application.message || 'Nessun messaggio.'}
                                    </p>

                                    <p>
                                      <strong>Stato candidatura:</strong>{' '}
                                      {application.status}
                                    </p>

                                    <div className="form-actions">
                                      <Link
                                        to={`/profilo-helper/${application.helper_id}`}
                                        className="btn btn--secondary"
                                      >
                                        Vedi profilo helper
                                      </Link>

                                      {application.status === 'pending' && (
                                        <>
                                          <button
                                            type="button"
                                            className="btn btn--primary"
                                            onClick={() =>
                                              void handleAcceptApplication(application)
                                            }
                                            disabled={
                                              acceptingApplicationId === application.id ||
                                              rejectingApplicationId === application.id
                                            }
                                          >
                                            {acceptingApplicationId === application.id
                                              ? 'Accettazione…'
                                              : 'Accetta candidatura'}
                                          </button>

                                          <button
                                            type="button"
                                            className="btn btn--secondary"
                                            onClick={() =>
                                              void handleRejectApplication(application)
                                            }
                                            disabled={
                                              acceptingApplicationId === application.id ||
                                              rejectingApplicationId === application.id
                                            }
                                          >
                                            {rejectingApplicationId === application.id
                                              ? 'Rifiuto…'
                                              : 'Rifiuta candidatura'}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      )}

                      {(request.status === 'accettata' ||
                        request.status === 'completata') &&
                        request.helper_id && (
                          <>
                            <div className="alert alert--success">
                              <p>
                                <strong>
                                  {request.status === 'completata'
                                    ? 'Completata da:'
                                    : 'Accettata da:'}
                                </strong>{' '}
                                {helper?.full_name ?? 'Helper verificato'}
                                {helper?.verified && ' · Identità verificata'}
                              </p>

                              {helper?.phone ? (
                                <p>
                                  <strong>Telefono helper:</strong>{' '}
                                  <a href={`tel:${helper.phone}`}>{helper.phone}</a>
                                </p>
                              ) : (
                                <p>Telefono helper non disponibile.</p>
                              )}

                              <div className="form-actions">
                                <Link
                                  to={`/profilo-helper/${request.helper_id}`}
                                  className="btn btn--secondary"
                                >
                                  Vedi profilo helper
                                </Link>

                                <Link
                                  to={`/chat/${request.id}`}
                                  className="btn btn--primary"
                                >
                                  Apri chat
                                </Link>

                                {helper?.phone && (
                                  <a
                                    className="btn btn--primary"
                                    href={`https://wa.me/${helper.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Contatta su WhatsApp
                                  </a>
                                )}
                              </div>
                            </div>

                            <SafetyPanel
                              requestId={request.id}
                              otherUserId={request.helper_id}
                              otherUserName={helper?.full_name}
                              requestStatus={request.status}
                            />
                          </>
                        )}

                      {pendingExpenses.length > 0 && (
                        <div className="request-card">
                          <h3>📷 Scontrino in attesa di approvazione</h3>

                          {pendingExpenses.map((expense) => (
                            <div key={expense.id} className="request-card">
                              <p>
                                <strong>Importo dichiarato:</strong> €
                                {expense.receipt_amount}
                              </p>

                              {expense.notes && (
                                <p>
                                  <strong>Note helper:</strong> {expense.notes}
                                </p>
                              )}

                              {expenseUrls[expense.id] && (
                                <p>
                                  <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={() => setOpenReceiptUrl(expenseUrls[expense.id])}
                                  >
                                    Visualizza scontrino
                                  </button>
                                </p>
                              )}

                              <div className="form-actions">
                                <button
                                  type="button"
                                  className="btn btn--primary"
                                  onClick={() =>
                                    void handleApproveExpense(request, expense)
                                  }
                                  disabled={approvingExpenseId === expense.id}
                                >
                                  {approvingExpenseId === expense.id
                                    ? 'Approvazione…'
                                    : 'Approva spesa'}
                                </button>

                                <button
                                  type="button"
                                  className="btn btn--secondary"
                                  onClick={() =>
                                    void handleContestExpense(request, expense)
                                  }
                                  disabled={contestingExpenseId === expense.id}
                                >
                                  {contestingExpenseId === expense.id
                                    ? 'Contestazione…'
                                    : 'Contesta'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {request.expense_status === 'contested' && (
                        <div className="alert alert--error">
                          Spesa contestata. Il pagamento resta bloccato finché la
                          contestazione non viene risolta.
                        </div>
                      )}

                      {request.status === 'accettata' && (
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => void handleCompleteRequest(request.id)}
                            disabled={completingRequestId === request.id}
                          >
                            {completingRequestId === request.id
                              ? 'Completamento…'
                              : 'Segna come completata'}
                          </button>

                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => void handleCancelRequest(request)}
                            disabled={cancellingRequestId === request.id}
                          >
                            {cancellingRequestId === request.id
                              ? 'Annullamento…'
                              : 'Annulla accordo'}
                          </button>
                        </div>
                      )}

                      {request.status === 'completata' && (
                        <>
                          {request.expense_status === 'approved' && (
                            <div className="alert alert--success">
                              <strong>✅ Spesa approvata</strong>
                              <br />
                              Lo scontrino è stato approvato e verrà aggiunto al pagamento finale.
                            </div>
                          )}

                          <div className="request-card">
                          <h3>Pagamento</h3>

                          <p>
                            <strong>Stato pagamento:</strong>{' '}
                            {paymentStatus === 'paid'
                              ? 'pagato'
                              : 'in attesa di pagamento'}
                          </p>

                          <p>
                            <strong>Servizio helper:</strong> €
                            {amounts.helperAmount}
                          </p>

                          {amounts.approvedExpenses > 0 && (
                            <p>
                              <strong>Spese approvate:</strong> €
                              {amounts.approvedExpenses.toFixed(2).replace('.', ',')}
                            </p>
                          )}

                          <p>
                            <strong>
                              Commissione di servizio ELPYO:
                            </strong>{' '}
                            €{amounts.platformFee.toFixed(2).replace('.', ',')}
                          </p>

                          <p>
                            <strong>Totale:</strong> €{amounts.total.toFixed(2).replace('.', ',')}
                          </p>

                          {request.expense_status === 'pending' && (
                            <div className="alert alert--error">
                              Prima di pagare devi approvare o contestare lo scontrino.
                            </div>
                          )}

                          {canPay ? (
                            <div className="form-actions">
                              <button
                                type="button"
                                className="btn btn--primary"
                                onClick={() =>
                                  void handleStripePayment(
                                    request,
                                    approvedExpensesTotal,
                                  )
                                }
                                disabled={payingRequestId === request.id}
                              >
                                {payingRequestId === request.id
                                  ? 'Pagamento…'
                                  : 'Paga richiesta'}
                              </button>
                            </div>
                          ) : paymentStatus === 'paid' ? (
                            <div className="alert alert--success">
                              Pagamento registrato correttamente.
                            </div>
                          ) : null}
                          </div>
                        </>
                      )}

                      {request.status === 'completata' && paymentStatus === 'paid' && (
                        <div className="form-actions">
                          <Link
                            to={`/recensione/${request.id}`}
                            className="btn btn--primary"
                          >
                            Lascia recensione
                          </Link>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      {openReceiptUrl && (
        <div
          className="receipt-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Scontrino"
        >
          <div className="receipt-modal__content">
            <button
              type="button"
              className="receipt-modal__close"
              onClick={() => setOpenReceiptUrl('')}
            >
              Chiudi
            </button>

            <img
              src={openReceiptUrl}
              alt="Scontrino caricato dall'helper"
              className="receipt-modal__image"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default LeMieRichiestePage
