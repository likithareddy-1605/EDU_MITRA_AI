import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/contexts/AuthContext'
import { FamilyDecisionProvider } from '@/contexts/FamilyDecisionContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { StudentDataProvider } from '@/contexts/StudentDataContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <StudentDataProvider>
          <FamilyDecisionProvider>
            <App />
          </FamilyDecisionProvider>
        </StudentDataProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
