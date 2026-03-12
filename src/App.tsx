import { Component, type ReactNode } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useTelegram } from './hooks/useTelegram'
import { useUser } from './hooks/useUser'
import { BottomNav } from './components/BottomNav'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ToastProvider } from './components/Toast'
import { DashboardPage } from './pages/DashboardPage'
import { StudyPage } from './pages/StudyPage'
import { SetsPage } from './pages/SetsPage'
import { SetDetailPage } from './pages/SetDetailPage'
import { CreateSetPage } from './pages/CreateSetPage'
import { AddCardPage } from './pages/AddCardPage'
import { SettingsPage } from './pages/SettingsPage'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#d32f2f', fontFamily: 'monospace', fontSize: 14, whiteSpace: 'pre-wrap' }}>
          <h2 style={{ marginBottom: 12 }}>App Error</h2>
          <p>{this.state.error.message}</p>
          <p style={{ marginTop: 8, opacity: 0.7 }}>{this.state.error.stack}</p>
        </div>
      )
    }
    return this.props.children
  }
}

const TAB_ROUTES = ['/', '/sets', '/settings']

export default function App() {
  const { user, ready } = useTelegram()
  const { loading } = useUser(user)

  if (!ready || loading) return <LoadingSpinner />

  return (
    <ErrorBoundary>
      <HashRouter>
        <AppLayout userId={user?.id} userName={user?.first_name} />
      </HashRouter>
    </ErrorBoundary>
  )
}

function AppLayout({ userId, userName }: { userId?: number; userName?: string }) {
  const location = useLocation()
  const showNav = TAB_ROUTES.includes(location.pathname)

  return (
    <div className={`app-layout ${!showNav ? 'app-layout--no-nav' : ''}`}>
      <main className="app-layout__content">
        <Routes>
          <Route path="/" element={<DashboardPage userId={userId} userName={userName} />} />
          <Route path="/study" element={<StudyPage userId={userId} />} />
          <Route path="/study/:setId" element={<StudyPage userId={userId} />} />
          <Route path="/sets" element={<SetsPage userId={userId} />} />
          <Route path="/sets/new" element={<CreateSetPage userId={userId} />} />
          <Route path="/sets/:setId" element={<SetDetailPage userId={userId} />} />
          <Route path="/sets/:setId/add" element={<AddCardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      {showNav && <BottomNav />}
      <ToastProvider />
    </div>
  )
}
