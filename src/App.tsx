import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequestsProvider } from './context/RequestsContext'
import HomePage from './pages/HomePage'
import CercoAiutoPage from './pages/CercoAiutoPage'
import OffroAiutoPage from './pages/OffroAiutoPage'
import './App.css'

function App() {
  return (
    <RequestsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cerco-aiuto" element={<CercoAiutoPage />} />
          <Route path="/offro-aiuto" element={<OffroAiutoPage />} />
        </Routes>
      </BrowserRouter>
    </RequestsProvider>
  )
}

export default App
