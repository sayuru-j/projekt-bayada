import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { LocaleProvider } from '@/contexts/locale-context'
import { UiSoundBridge } from '@/components/audio/ui-sound-bridge'
import { HomePage } from '@/pages/home-page'
import { AuthCallbackPage } from '@/pages/auth-callback-page'
import { AdminPage } from '@/pages/admin-page'
import { MySubmissionsPage } from '@/pages/my-submissions-page'
import { LeaderboardPage } from '@/pages/leaderboard-page'
import { ConsentGate } from '@/components/consent/consent-gate'
import { cn } from '@/lib/utils'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

/**
 * Keep HomePage (and HolmanMap) mounted while visiting other routes.
 * Returning remounts the MapLibre instance so the canvas does not stay black.
 */
function AppShell() {
  const location = useLocation()
  const onMap = location.pathname === '/'
  const wasAway = useRef(false)

  useEffect(() => {
    if (!onMap) {
      wasAway.current = true
      return
    }
    // Fresh MapLibre instance after leaving admin/leaderboard/etc.
    const remount = wasAway.current
    wasAway.current = false
    const id = window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('bayada:map-resume', { detail: { remount } }),
      )
    }, 40)
    return () => window.clearTimeout(id)
  }, [onMap])

  return (
    <div className="relative h-full min-h-0 w-full">
      {/* Keep full viewport size while hidden so WebGL canvas is not zeroed */}
      <div
        className={cn(
          'h-full w-full',
          !onMap &&
            'pointer-events-none fixed inset-0 z-0 opacity-0 [contain:strict]',
        )}
        aria-hidden={!onMap}
      >
        <HomePage />
      </div>

      <Routes>
        <Route path="/" element={null} />
        <Route
          path="/auth/callback"
          element={
            <div className="fixed inset-0 z-20 h-full w-full bg-canvas">
              <AuthCallbackPage />
            </div>
          }
        />
        <Route
          path="/admin"
          element={
            <div className="fixed inset-0 z-20 h-full w-full bg-canvas">
              <AdminPage />
            </div>
          }
        />
        <Route
          path="/my-submissions"
          element={
            <div className="fixed inset-0 z-20 h-full w-full bg-canvas">
              <MySubmissionsPage />
            </div>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <div className="fixed inset-0 z-20 h-full w-full bg-canvas">
              <LeaderboardPage />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <BrowserRouter>
            <UiSoundBridge />
            <ConsentGate>
              <AppShell />
            </ConsentGate>
          </BrowserRouter>
          <Toaster theme="dark" position="top-center" richColors />
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  )
}
