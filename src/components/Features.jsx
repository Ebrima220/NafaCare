// Features now receives panel-open callbacks from App.jsx
// so all three panels are controlled at the top level.

const features = [
  {
    id: 'symptoms',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor" className="h-7 w-7 text-green-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75a6 6 0 0 1 6 6v.75a.75.75 0 0 0 .75.75h.75a2.25 2.25 0 0 1 0 4.5h-.75a.75.75 0 0 0-.75.75v.75a6 6 0 0 1-12 0v-.75a.75.75 0 0 0-.75-.75H2.25a2.25 2.25 0 0 1 0-4.5H3a.75.75 0 0 0 .75-.75V9.75a6 6 0 0 1 6-6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75h.008v.008H9.75v-.008ZM12 12.75h.008v.008H12v-.008ZM14.25 12.75h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    title: 'AI Symptom Checker',
    description: 'Describe your symptoms and receive general health guidance in a private and easy-to-understand conversation.',
    action: 'chat',
    btnLabel: 'Start Chat',
  },
  {
    id: 'health-centers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor" className="h-7 w-7 text-green-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    title: 'Find Health Centers',
    description: 'Quickly discover nearby hospitals, clinics, pharmacies, and healthcare services in your area.',
    action: 'map',
    btnLabel: 'Find Near Me',
  },
  {
    id: 'professionals',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor" className="h-7 w-7 text-green-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 0 1 0 9h-.75a4.5 4.5 0 0 1-4.5-4.5v-3" />
        <circle cx="19.5" cy="21" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: 'Talk to a Professional',
    description: 'Request to speak with a qualified healthcare professional when you need additional support or advice.',
    action: 'doctors',
    btnLabel: 'Book Now',
  },
]

const btnIcons = {
  chat: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  ),
  map: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  doctors: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  ),
}

export default function Features({ onOpenChat, onOpenMap, onOpenDoctors }) {
  function handleAction(action) {
    if (action === 'chat')    onOpenChat?.()
    if (action === 'map')     onOpenMap?.()
    if (action === 'doctors') onOpenDoctors?.()
  }

  return (
    <section id="features" className="bg-white py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-6">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
            Features
          </span>
          <h2 className="mt-6 text-4xl font-bold text-slate-900 dark:text-white">
            Everything you need to manage your health
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            NafaCare provides simple tools to help you understand your health and connect with the care you need.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.id}
              id={f.id}
              className="relative flex flex-col overflow-hidden rounded-3xl bg-white p-8 shadow-sm dark:bg-slate-800"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 ring-1 ring-green-100 dark:bg-green-900/30 dark:ring-green-800">
                {f.icon}
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>

              <div className="mt-auto pt-6">
                <button
                  onClick={() => handleAction(f.action)}
                  className="inline-flex w-fit items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 active:scale-[0.98]"
                >
                  {btnIcons[f.action]}
                  {f.btnLabel}
                  {f.action === 'chat' && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
