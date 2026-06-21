import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequestsProvider } from './context/RequestsContext'

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
import AdminVerifichePage from './pages/AdminVerifichePage'

import AdminRoute from './components/AdminRoute'
import VerifiedRoute from './components/VerifiedRoute'

import './App.css'

function App() {
  return (
    <RequestsProvider>
      <BrowserRouter>
        <Routes>
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

          <Route
            path="/verifica-identita"
            element={<IdentityVerificationPage />}
          />

          <Route
            path="/admin/verifiche"
            element={
              <AdminRoute>
                <AdminVerifichePage />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </RequestsProvider>
  )
}

export default App