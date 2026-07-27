// ── DoctorsPanel ──────────────────────────────────────────────────────────────
// Mobile: professional bottom sheet — 92dvh, rounded top corners, drag handle
// Desktop: right sidebar sliding in from the right

const DOCTORS = [
  {
    id: 1,
    name: 'Dr. Aminata Touray',
    specialty: 'General Practitioner',
    phone: '+220 772 1234',
    whatsapp: '2207721234',
    email: 'a.touray@nafacare.gm',
    location: 'Banjul, The Gambia',
    avatar: 'AT',
    color: 'bg-emerald-500',
    bio: 'Over 10 years of experience in primary healthcare and community medicine.',
  },
  {
    id: 2,
    name: 'Dr. Ousman Jallow',
    specialty: 'Paediatrician',
    phone: '+220 990 5678',
    whatsapp: '2209905678',
    email: 'o.jallow@nafacare.gm',
    location: 'Serrekunda, The Gambia',
    avatar: 'OJ',
    color: 'bg-blue-500',
    bio: 'Specialist in child health, nutrition, and neonatal care.',
  },
  {
    id: 3,
    name: 'Dr. Fatou Ceesay',
    specialty: 'Gynaecologist & Obstetrician',
    phone: '+220 667 9012',
    whatsapp: '2206679012',
    email: 'f.ceesay@nafacare.gm',
    location: 'Brikama, The Gambia',
    avatar: 'FC',
    color: 'bg-rose-500',
    bio: "Dedicated to women's reproductive health, prenatal and postnatal care.",
  },
  {
    id: 4,
    name: 'Dr. Lamin Sanneh',
    specialty: 'Internal Medicine',
    phone: '+220 748 3456',
    whatsapp: '2207483456',
    email: 'l.sanneh@nafacare.gm',
    location: 'Banjul, The Gambia',
    avatar: 'LS',
    color: 'bg-violet-500',
    bio: 'Expert in chronic disease management, diabetes, and hypertension.',
  },
  {
    id: 5,
    name: 'Dr. Mariama Bah',
    specialty: 'Dermatologist',
    phone: '+220 559 7890',
    whatsapp: '2205597890',
    email: 'm.bah@nafacare.gm',
    location: 'Kanifing, The Gambia',
    avatar: 'MB',
    color: 'bg-amber-500',
    bio: 'Specialises in skin conditions, cosmetic dermatology, and wound care.',
  },
  {
    id: 6,
    name: 'Dr. Ebrima Baldeh',
    specialty: 'Dentist',
    phone: '+220 334 2109',
    whatsapp: '2203342109',
    email: 'e.baldeh@nafacare.gm',
    location: 'Banjul, The Gambia',
    avatar: 'EB',
    color: 'bg-teal-500',
    bio: 'General and cosmetic dentistry with a focus on preventive oral health.',
  },
]

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

// ── Doctor card ───────────────────────────────────────────────────────────────
function DoctorCard({ doctor }) {
  const waUrl = `https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent(
    `Hello Dr. ${doctor.name.split(' ')[1]}, I found you on NafaCare and would like to book a consultation.`
  )}`

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800 max-w-xs mx-auto">
      <div className="p-3">
        {/* Top: avatar + info */}
        <div className="flex items-start gap-2.5">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${doctor.color} text-xs font-extrabold text-white shadow-sm`}>
            {doctor.avatar}
          </div>

          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-bold text-slate-800 leading-tight dark:text-white">{doctor.name}</h3>
              <p className="mt-0.5 text-[11px] font-semibold text-green-600 dark:text-green-400">{doctor.specialty}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5 flex-shrink-0">
                  <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .19.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
                </svg>
                {doctor.location}
              </p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500 border-t border-slate-50 pt-2.5 dark:text-slate-400 dark:border-slate-700">{doctor.bio}</p>

        {/* Contact row — plain icon + text, no card */}
        <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2.5 dark:border-slate-700">
          <a href={`tel:${doctor.phone}`} className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-green-600 transition-colors dark:text-slate-400 dark:hover:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 flex-shrink-0 text-slate-400 dark:text-slate-500">
              <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
            </svg>
            {doctor.phone}
          </a>
          <a href={`mailto:${doctor.email}`} className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-green-600 transition-colors dark:text-slate-400 dark:hover:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 flex-shrink-0 text-slate-400 dark:text-slate-500">
              <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
              <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
            </svg>
            {doctor.email}
          </a>
        </div>

        {/* WhatsApp — icon only */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex items-center justify-center rounded-lg bg-[#25D366] p-2 shadow-sm transition hover:bg-[#1fbd5c] active:scale-[0.98]"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon />
        </a>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function DoctorsPanel({ open, onClose }) {
  // Lock body scroll when open
  if (typeof window !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE  — bottom sheet: 92dvh, rounded top corners, drag handle
          DESKTOP — right sidebar: slides in from right, full height below navbar
         ════════════════════════════════════════════════════════════════════ */}
      <div
        className={`
          fixed z-50 flex flex-col bg-slate-50 dark:bg-slate-900 shadow-2xl
          transition-all duration-300 ease-out
          inset-x-0 bottom-0 h-[92dvh] rounded-t-3xl
          ${open ? 'translate-y-0' : 'translate-y-full'}
          md:inset-x-auto md:right-0 md:top-[64px] md:bottom-0
          md:h-auto md:w-[420px] md:rounded-l-2xl md:rounded-tr-none
          md:border-l md:border-gray-200 dark:md:border-slate-700
          ${open ? 'md:translate-x-0 md:translate-y-0' : 'md:translate-x-full md:translate-y-0'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Talk to a Healthcare Professional"
      >
        {/* ── Drag handle (mobile only) ── */}
        <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 md:rounded-tl-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white leading-tight">Healthcare Professionals</p>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
              </div>
              <p className="text-[11px] text-green-100">The Gambia — Available Now</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-green-100 hover:bg-white/20 transition" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Disclaimer ── */}
        <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 dark:border-blue-900/40 dark:bg-blue-900/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 flex-shrink-0 text-blue-500">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
          </svg>
          <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-snug">
            Please verify health personnel credentials before sharing personal information.
          </p>
        </div>

        {/* ── Subtitle ── */}
        <div className="border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Tap <span className="font-semibold text-[#25D366]">Chat on WhatsApp</span> to start a consultation instantly.
          </p>
        </div>

        {/* ── Doctor cards ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
          {DOCTORS.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
          <p className="pb-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
            More professionals joining soon · NafaCare © 2026
          </p>
        </div>
      </div>
    </>
  )
}
