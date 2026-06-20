import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequestsProvider } from './context/RequestsContext'
import HomePage from './pages/HomePage'
import CercoAiutoPage from './pages/CercoAiutoPage'
import OffroAiutoPage from './pages/OffroAiutoPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import IdentityVerificationPage from './pages/IdentityVerificationPage'
import LeMieRichiestePage from './pages/LeMieRichiestePage'
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
          <Route path="/cerco-aiuto" element={<VerifiedRoute><CercoAiutoPage /></VerifiedRoute>} />
          <Route path="/offro-aiuto" element={<VerifiedRoute><OffroAiutoPage /></VerifiedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrazione" element={<RegisterPage />} />
          <Route path="/verifica-identita" element={<IdentityVerificationPage />} />
          <Route path="/le-mie-richieste" element={<LeMieRichiestePage />} />
          <Route path="/admin/verifiche" element={<AdminRoute><AdminVerifichePage /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </RequestsProvider>
  )
}

export default App
