import { useState } from 'react'
import { useDarkMode } from './hooks/useDarkMode'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import HealthTips from './components/HealthTips'
import CTA from './components/CTA'
import Footer from './components/Footer'
import AiChat from './components/AiChat'
import HealthCentersMap from './components/HealthCentersMap'
import DoctorsPanel from './components/DoctorsPanel'

export default function App() {
  const [chatOpen,    setChatOpen]    = useState(false)
  const [mapOpen,     setMapOpen]     = useState(false)
  const [doctorsOpen, setDoctorsOpen] = useState(false)

  // Initialize dark mode
  useDarkMode()

  return (
    <>
      <Navbar onOpenDoctors={() => setDoctorsOpen(true)} />

      <main>
        <Hero
          onCheckSymptoms={() => setChatOpen(true)}
          onFindCenters={() => setMapOpen(true)}
        />
        <HowItWorks />
        <Features
          onOpenChat={() => setChatOpen(true)}
          onOpenMap={() => setMapOpen(true)}
          onOpenDoctors={() => setDoctorsOpen(true)}
        />
        <HealthTips />
        <CTA onOpenChat={() => setChatOpen(true)} onOpenMap={() => setMapOpen(true)} />
      </main>

      <Footer />

      {/* Global panels — controlled from App so any component can open them */}
      <AiChat          open={chatOpen}    onClose={() => setChatOpen(false)} />
      <HealthCentersMap open={mapOpen}    onClose={() => setMapOpen(false)} />
      <DoctorsPanel    open={doctorsOpen} onClose={() => setDoctorsOpen(false)} />
    </>
  )
}
