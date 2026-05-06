import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './SynthRisk.jsx'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_QKao16jBM',
      userPoolClientId: '386h4fga4hqjp9l6nmfd35kqu9',
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)