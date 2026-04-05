import { useContext } from 'react'
import { AppContext } from './context/AppContext'
import Header from './components/Header'
import Home from './pages/Home'
import Workspace from './pages/Workspace'
import ProfileSettings from './pages/ProfileSettings'
import AccountInfo from './pages/AccountInfo'
import Security from './pages/Security'
import Preferences from './pages/Preferences'
import Usage from './pages/Usage'
import SettingsPage from './pages/SettingsPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Footer from './components/Footer'
import { NotificationProvider } from './context/NotificationContext'
import ToastContainer from './components/ToastContainer'

function App() {
  const { view, currentUser } = useContext(AppContext)

  if (!currentUser) {
    return (
      <NotificationProvider>
        <div className="relative min-h-screen overflow-hidden">
          {view === 'register' ? <Register /> : view === 'forgot-password' ? <ForgotPassword /> : <Login />}
          <Footer />
          <ToastContainer />
        </div>
      </NotificationProvider>
    )
  }

  return (
    <NotificationProvider>
      <div className="relative min-h-screen overflow-hidden">
        <Header />

        <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-16 px-14 pb-20 pt-4">
          {view === 'workspace' && <Workspace />}
          {view === 'landing' && <Home />}
          {view === 'profile-settings' && <ProfileSettings />}
          {view === 'account-info' && <AccountInfo />}
          {view === 'security' && <Security />}
          {view === 'preferences' && <Preferences />}
          {view === 'usage' && <Usage />}
          {view === 'settings' && <SettingsPage />}
        </main>

        <Footer />
        <ToastContainer />
      </div>
    </NotificationProvider>
  )
}

export default App
