import { Route, Routes } from 'react-router-dom'
import AboutPage from './pages/AboutPage'
import HomePage from './HomePage'
import Notice from './Notice'
import Title from './Title'

export default function App({ locked }: { locked: boolean }) {
  if (locked) return <Notice />
  return (
    <>
      <Title />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </>
  )
}
