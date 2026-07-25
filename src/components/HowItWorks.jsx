const steps = [
  {
    number: '01',
    title: 'Describe Your Symptoms',
    description: "Tell us how you're feeling using simple language. No medical knowledge required.",
  },
  {
    number: '02',
    title: 'Get AI Guidance',
    description:
      'Receive general health guidance and suggestions based on the information you provide.',
  },
  {
    number: '03',
    title: 'Find the Right Care',
    description:
      'Locate nearby health centers or request to speak with a healthcare professional.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-14 dark:bg-slate-800">
      <div className="mx-auto max-w-5xl px-6">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
            How It Works
          </span>
          <h2 className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">
            Healthcare made simple in three easy steps
          </h2>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            NafaCare helps you understand your symptoms and find the right care quickly and
            privately.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-slate-900"
            >
              <span className="select-none text-5xl font-extrabold leading-none text-green-200 dark:text-green-900">
                {step.number}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
