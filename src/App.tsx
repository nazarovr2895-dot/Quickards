import { Component, type ReactNode, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { useTelegram } from './hooks/useTelegram'
import { useUser } from './hooks/useUser'
import { BottomNav } from './components/BottomNav'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ToastProvider } from './components/Toast'
import { DashboardPage } from './pages/DashboardPage'

// Lazy-loaded pages for code splitting
const StudyPage = lazy(() => import('./pages/StudyPage').then(m => ({ default: m.StudyPage })))
const SetsPage = lazy(() => import('./pages/SetsPage').then(m => ({ default: m.SetsPage })))
const SetDetailPage = lazy(() => import('./pages/SetDetailPage').then(m => ({ default: m.SetDetailPage })))
const CreateSetPage = lazy(() => import('./pages/CreateSetPage').then(m => ({ default: m.CreateSetPage })))
const ManageCardsPage = lazy(() => import('./pages/ManageCardsPage').then(m => ({ default: m.ManageCardsPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))

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
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <AppLayout userId={user?.id} userName={user?.first_name} />
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

function AppLayout({ userId, userName }: { userId?: number; userName?: string }) {
  const location = useLocation()
  const showNav = TAB_ROUTES.includes(location.pathname)

  return (
    <div className={`app-layout ${!showNav ? 'app-layout--no-nav' : ''}`}>
      <main className="app-layout__content">
        <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<DashboardPage userId={userId} userName={userName} />} />
          <Route path="/study" element={<StudyPage userId={userId} />} />
          <Route path="/study/:setId" element={<StudyPage userId={userId} />} />
          <Route path="/sets" element={<SetsPage userId={userId} />} />
          <Route path="/sets/new" element={<CreateSetPage userId={userId} />} />
          <Route path="/sets/:setId" element={<SetDetailPage userId={userId} />} />
          <Route path="/sets/:setId/manage" element={<ManageCardsPage userId={userId} />} />
          <Route path="/settings" element={<SettingsPage userId={userId} />} />
          <Route path="/analytics" element={<AnalyticsPage userId={userId} />} />
        </Routes>
        </Suspense>
      </main>
      {showNav && <BottomNav />}
      <ToastProvider />
    </div>
  )
}
