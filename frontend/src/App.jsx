import { useContext } from 'react'
import { AppContext } from './context/AppContext'
import Header from './components/Header'
import Home from './pages/Home'
import Workspace from './pages/Workspace'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Footer from './components/Footer'

function App() {
  const { view } = useContext(AppContext)

  return (
    <div className="relative overflow-hidden">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-4">
        {view === 'workspace' && <Workspace />}
        {view === 'landing' && <Home />}
        {view === 'aboutUs' && <AboutUs />}
        {view === 'contactUs' && <ContactUs />}
      </main>

      <Footer />
    </div>
  )
}

export default App
