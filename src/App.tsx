import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import AnalyzePage from './pages/AnalyzePage'
import RewritePage from './pages/RewritePage'
import AgentPage from './pages/AgentPage'
import InterviewPage from './pages/InterviewPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/rewrite" element={<RewritePage />} />
        <Route path="/agent" element={<AgentPage />} />
        <Route path="/interview" element={<InterviewPage />} />
      </Routes>
    </Layout>
  )
}

export default App
