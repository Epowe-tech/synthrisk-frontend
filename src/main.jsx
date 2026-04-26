import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import awsExports from './aws-exports.js'
import './index.css'
import App from './SynthRisk.jsx'

Amplify.configure(awsExports)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)