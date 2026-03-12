import { HashRouter, Routes, Route } from 'react-router-dom'
import { useTelegram } from './hooks/useTelegram'
import { useUser } from './hooks/useUser'
import { TopNav } from './components/TopNav'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ToastProvider } from './components/Toast'
import { DashboardPage } from './pages/DashboardPage'
import { StudyPage } from './pages/StudyPage'
import { SetsPage } from './pages/SetsPage'
import { SetDetailPage } from './pages/SetDetailPage'
import { CreateSetPage } from './pages/CreateSetPage'
import { AddCardPage } from './pages/AddCardPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const { user, ready } = useTelegram()
  const { loading } = useUser(user)

  if (!ready || loading) return <LoadingSpinner />

  const userId = user?.id

  return (
    <HashRouter>
      <div className="app-layout">
        <TopNav />
        <main className="app-layout__content">
          <Routes>
            <Route path="/" element={<DashboardPage userId={userId} />} />
            <Route path="/study" element={<StudyPage userId={userId} />} />
            <Route path="/study/:setId" element={<StudyPage userId={userId} />} />
            <Route path="/sets" element={<SetsPage userId={userId} />} />
            <Route path="/sets/new" element={<CreateSetPage userId={userId} />} />
            <Route path="/sets/:setId" element={<SetDetailPage userId={userId} />} />
            <Route path="/sets/:setId/add" element={<AddCardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <ToastProvider />
      </div>
    </HashRouter>
  )
}
