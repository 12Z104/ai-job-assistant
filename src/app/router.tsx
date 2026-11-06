/* oxlint-disable react/only-export-components -- 本文件是路由表配置而非组件文件，fast-refresh 规则不适用 */
import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Spinner } from '../components/ui'
import { ErrorBoundary } from './ErrorBoundary'

const HomePage = lazy(() => import('../pages/HomePage'))
const MatchPage = lazy(() => import('../pages/MatchPage'))
const RewritePage = lazy(() => import('../pages/RewritePage'))
const AgentPage = lazy(() => import('../pages/AgentPage'))
const InterviewPage = lazy(() => import('../pages/InterviewPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

function Page({ component: PageComponent }: { component: ComponentType }) {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <Spinner />
        </div>
      }
    >
      <PageComponent />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  // 登录页独立于 AppShell：不显示主导航，整屏居中（issue #44）
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <Page component={LoginPage} />
      </ErrorBoundary>
    ),
  },
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <Page component={HomePage} /> },
      { path: 'match', element: <Page component={MatchPage} /> },
      { path: 'rewrite', element: <Page component={RewritePage} /> },
      { path: 'agent', element: <Page component={AgentPage} /> },
      { path: 'interview', element: <Page component={InterviewPage} /> },
      { path: 'settings', element: <Page component={SettingsPage} /> },
      { path: 'analyze', element: <Navigate to="/match" replace /> },
      { path: '*', element: <Page component={NotFoundPage} /> },
    ],
  },
])
