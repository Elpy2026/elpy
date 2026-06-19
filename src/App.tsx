import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequestsProvider } from './context/RequestsContext'
import HomePage from './pages/HomePage'
import CercoAiutoPage from './pages/CercoAiutoPage'
import OffroAiutoPage from './pages/OffroAiutoPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import IdentityVerificationPage from './pages/IdentityVerificationPage'
import AdminVerifichePage from './pages/AdminVerifichePage'
import './App.css'

function App() {
  return (
    <RequestsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cerco-aiuto" element={<CercoAiutoPage />} />
          <Route path="/offro-aiuto" element={<OffroAiutoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrazione" element={<RegisterPage />} />
          <Route path="/verifica-identita" element={<IdentityVerificationPage />} />
          <Route path="/admin/verifiche" element={<AdminVerifichePage />} />
        </Routes>
      </BrowserRouter>
    </RequestsProvider>
  )
}

export default App
