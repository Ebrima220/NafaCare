export default function CTA({ onOpenChat, onOpenMap }) {
  return (
    <section className="bg-white py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-emerald-500 px-8 py-10 text-center text-white lg:px-20">
          <span className="inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
            Get Started Today
          </span>

          <h2 className="mt-6 text-4xl font-bold leading-tight lg:text-5xl">
            Take the first step toward better health.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-green-50">
            Check your symptoms, discover nearby healthcare facilities, and access reliable health
            guidance — all in one place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => onOpenChat?.()}
              className="rounded-full bg-white px-8 py-4 font-semibold text-green-700 transition hover:bg-green-50"
            >
              Check Symptoms
            </button>
            <button
              onClick={() => onOpenMap?.()}
              className="rounded-full border border-white px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-green-700"
            >
              Find Health Centers
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
