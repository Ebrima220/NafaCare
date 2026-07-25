const quickLinks = [
  { label: 'Home', href: '#home' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Health Tips', href: '#health-tips' },
]

const services = [
  'AI Symptom Guide',
  'Find Health Centers',
  'Talk to Professionals',
  'Health Resources',
]

const whyNafa = [
  'Private & Secure',
  'Fast Guidance',
  'Nearby Healthcare',
  'Human-Centered Care',
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 py-12 text-gray-300 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-white">
              Nafa<span className="text-green-500">Care</span>
            </h2>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              Your trusted AI health companion helping you understand symptoms, find nearby care,
              and connect with healthcare professionals.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-green-500">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Services</h3>
            <ul className="space-y-3 text-sm">
              {services.map((s) => (
                <li key={s} className="text-gray-400">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Why NafaCare */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Why NafaCare</h3>
            <ul className="space-y-3 text-sm">
              {whyNafa.map((item) => (
                <li key={item} className="text-gray-400">
                  ✓ {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between border-t border-gray-700 pt-6 text-sm text-gray-400 md:flex-row dark:border-slate-800">
          <p>© 2026 NafaCare. All rights reserved.</p>
          <div className="mt-4 flex gap-5 md:mt-0">
            <a href="#" className="hover:text-green-500">Privacy Policy</a>
            <a href="#" className="hover:text-green-500">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
