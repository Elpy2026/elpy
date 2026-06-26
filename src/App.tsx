import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequestsProvider } from './context/RequestsContext'
import ComeFunzionaPage from './pages/ComeFunzionaPage'
import PrivacyPage from './pages/PrivacyPage'
import TerminiPage from './pages/TerminiPage'
import CookiePolicyPage from './pages/CookiePolicyPage'
import HomePage from './pages/HomePage'
import CercoAiutoPage from './pages/CercoAiutoPage'
import OffroAiutoPage from './pages/OffroAiutoPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import IdentityVerificationPage from './pages/IdentityVerificationPage'
import LeMieRichiestePage from './pages/LeMieRichiestePage'
import LeMieAttivitaPage from './pages/LeMieAttivitaPage'
import LasciaRecensionePage from './pages/LasciaRecensionePage'
import ProfiloPage from './pages/ProfiloPage'
import ProfiloHelperPage from './pages/ProfiloHelperPage'
import NotifichePage from './pages/NotifichePage'
import ChatPage from './pages/ChatPage'
import MessaggiPage from './pages/MessaggiPage'
import SegnalaUtentePage from './pages/SegnalaUtentePage'
import PenaliPage from './pages/PenaliPage'
import AdminVerifichePage from './pages/AdminVerifichePage'
import AdminSegnalazioniPage from './pages/AdminSegnalazioniPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import PagamentoSuccessoPage from './pages/PagamentoSuccessoPage'
import PagamentoAnnullatoPage from './pages/PagamentoAnnullatoPage'

import AdminRoute from './components/AdminRoute'
import VerifiedRoute from './components/VerifiedRoute'
import CookieBanner from './components/CookieBanner'
import TrackingConsent from './components/TrackingConsent'

import './App.css'

function App() {
  return (
    <RequestsProvider>
      <BrowserRouter>
        <Routes>
        <Route
  path="/come-funziona"
  element={<ComeFunzionaPage />}
/>
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/termini" element={<TerminiPage />} />
<Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/" element={<HomePage />} />

          <Route
            path="/cerco-aiuto"
            element={
              <VerifiedRoute>
                <CercoAiutoPage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/offro-aiuto"
            element={
              <VerifiedRoute>
                <OffroAiutoPage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/profilo"
            element={
              <VerifiedRoute>
                <ProfiloPage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/penali"
            element={
              <VerifiedRoute>
                <PenaliPage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/notifiche"
            element={
              <VerifiedRoute>
                <NotifichePage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/messaggi"
            element={
              <VerifiedRoute>
                <MessaggiPage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/segnala-utente"
            element={
              <VerifiedRoute>
                <SegnalaUtentePage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/le-mie-richieste"
            element={
              <VerifiedRoute>
                <LeMieRichiestePage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/le-mie-attivita"
            element={
              <VerifiedRoute>
                <LeMieAttivitaPage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/recensione/:requestId"
            element={
              <VerifiedRoute>
                <LasciaRecensionePage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/profilo-helper/:helperId"
            element={
              <VerifiedRoute>
                <ProfiloHelperPage />
              </VerifiedRoute>
            }
          />

          <Route
            path="/chat/:requestId"
            element={
              <VerifiedRoute>
                <ChatPage />
              </VerifiedRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrazione" element={<RegisterPage />} />
          <Route path="/pagamento-successo" element={<PagamentoSuccessoPage />} />
<Route path="/pagamento-annullato" element={<PagamentoAnnullatoPage />} />

          <Route
            path="/verifica-identita"
            element={<IdentityVerificationPage />}
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/verifiche"
            element={
              <AdminRoute>
                <AdminVerifichePage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/segnalazioni"
            element={
              <AdminRoute>
                <AdminSegnalazioniPage />
              </AdminRoute>
            }
          />
        </Routes>
        <CookieBanner />
        <TrackingConsent />
      </BrowserRouter>
    </RequestsProvider>
  )
}

export default App
