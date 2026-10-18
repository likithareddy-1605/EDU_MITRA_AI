import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DemoAuthProvider } from '@/contexts/DemoAuthContext'
import { FamilyDecisionProvider } from '@/contexts/FamilyDecisionContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { StudentDataProvider } from '@/contexts/StudentDataContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <DemoAuthProvider>
        <StudentDataProvider>
          <FamilyDecisionProvider>
            <App />
          </FamilyDecisionProvider>
        </StudentDataProvider>
      </DemoAuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
