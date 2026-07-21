import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CLATPredictor from './CLATPredictor.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CLATPredictor />
  </StrictMode>,
)
