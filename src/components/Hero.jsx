export default function Hero({ onCheckSymptoms, onFindCenters }) {
  return (
    <section
      id="home"
      className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 pb-28 lg:flex lg:items-center lg:justify-between">
        {/* Left Content */}
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
            AI Assisted Healthcare
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-tight text-gray-900 dark:text-white">
            Your Private{' '}
            <span className="text-green-600">AI Health</span>{' '}
            Assistant
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-slate-400">
            Check your symptoms, find nearby health centers, and request to speak with a
            healthcare professional all in one simple place.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={onCheckSymptoms}
              className="rounded-xl bg-green-600 px-7 py-4 font-semibold text-white transition hover:bg-green-700 active:scale-[0.98]"
            >
              Check Symptoms
            </button>
            <button
              onClick={onFindCenters}
              className="rounded-xl border border-gray-300 px-7 py-4 font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-[0.98] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Find Health Centers
            </button>
          </div>

          {/* Privacy note */}
          <div className="mt-8 flex items-center gap-2 text-gray-500 dark:text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-5 w-5 text-green-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-1.5 0h12a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-12A1.5 1.5 0 014.5 19.5V12A1.5 1.5 0 016 10.5z"
              />
            </svg>
            <span>Private. Secure. Always here for you.</span>
          </div>
        </div>

        {/* Right Side — image + ECG */}
        <div className="relative mt-16 flex items-center justify-center lg:mt-0">
          {/* Glow */}
          <div className="absolute h-80 w-80 rounded-full bg-green-200 opacity-40 blur-3xl dark:bg-green-900" />

          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-green-300 opacity-30 blur-3xl dark:bg-green-800" />

            <img
              src="/images/stethoscope-image.jpg"
              alt="Stethoscope"
              className="relative w-[420px] object-contain mix-blend-multiply dark:invert dark:mix-blend-multiply"
              style={{ filter: 'saturate(1.1)' }}
            />

            {/* Heartbeat line */}
            <div className="relative w-full px-4 -mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 400 60"
                className="w-full"
                aria-label="Heartbeat line"
              >
                <line x1="10" y1="30" x2="390" y2="30" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
                <polyline
                  points="10,30 70,30 92,6 112,56 130,14 150,30 200,30 218,18 228,44 238,30 390,30"
                  stroke="#059669"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="600"
                  strokeDashoffset="600"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="600"
                    to="-600"
                    dur="2.2s"
                    repeatCount="indefinite"
                    calcMode="linear"
                  />
                </polyline>
                <circle r="5" fill="#059669">
                  <animateMotion
                    dur="2.2s"
                    repeatCount="indefinite"
                    path="M10,30 L70,30 L92,6 L112,56 L130,14 L150,30 L200,30 L218,18 L228,44 L238,30 L390,30"
                    calcMode="linear"
                  />
                </circle>
                <circle r="10" fill="#059669" opacity="0.25">
                  <animateMotion
                    dur="2.2s"
                    repeatCount="indefinite"
                    path="M10,30 L70,30 L92,6 L112,56 L130,14 L150,30 L200,30 L218,18 L228,44 L238,30 L390,30"
                    calcMode="linear"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.1;0.35;0.1"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="block h-14 w-full"
        >
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#ffffff" className="dark:fill-slate-900" />
        </svg>
      </div>
    </section>
  )
}
