import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BrainsPage } from './pages/BrainsPage'
import { BrainPage } from './pages/BrainPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/brains" replace />} />
        <Route path="/brains" element={<BrainsPage />} />
        <Route path="/brains/:brainId" element={<BrainPage />} />
      </Routes>
    </BrowserRouter>
  )
}
