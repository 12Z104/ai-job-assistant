import { RouterProvider } from 'react-router-dom'
import { Providers } from './providers'
import { router } from './router'

/** 应用根：Provider 装配 + 路由注入。逻辑一律下沉到 app/ 与 features/。 */
export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
