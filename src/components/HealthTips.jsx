const tips = [
  {
    id: 1,
    img: '/images/water.jpg',
    alt: 'Drink Water',
    tag: 'Hydration',
    title: 'Stay Hydrated Every Day',
    description:
      "Drinking enough water supports your body's vital functions and helps you feel your best.",
    link: 'https://www.who.int/westernpacific/news-room/fact-sheets/detail/drinking-water',
  },
  {
    id: 2,
    img: '/images/healthy-food.jpg',
    alt: 'Healthy Food',
    tag: 'Nutrition',
    title: 'Eat a Balanced Diet',
    description:
      'Choose fruits, vegetables, whole grains, and lean proteins for better overall health.',
    link: 'https://www.who.int/health-topics/healthy-diet',
  },
  {
    id: 3,
    img: '/images/sleep.jpg',
    alt: 'Sleep',
    tag: 'Wellness',
    title: 'Get Enough Sleep',
    description:
      'Quality sleep helps your body recover, improves focus, and supports your immune system.',
    link: 'https://www.who.int/europe/news-room/fact-sheets/item/everyday-actions-for-better-health-who-recommendations',
  },
]

const ExternalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5ZM10 4.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V6.31l-6.22 6.22a.75.75 0 0 1-1.06-1.06L13.19 5.5h-2.44a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
)

export default function HealthTips() {
  return (
    <section id="health-tips" className="bg-white py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
            Health Tips
          </span>
          <h2 className="mt-6 text-4xl font-bold text-slate-900 dark:text-white">
            Simple tips for a healthier lifestyle
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Explore practical health advice to help you stay healthy every day.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <article
              key={tip.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <img src={tip.img} alt={tip.alt} className="h-36 w-full object-cover" />
              <div className="flex flex-col flex-1 p-4">
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 self-start dark:bg-green-900/40 dark:text-green-400">
                  {tip.tag}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">{tip.title}</h3>
                <p className="mt-3 text-slate-600 dark:text-slate-400">{tip.description}</p>
                <a
                  href={tip.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto pt-6 inline-flex items-center gap-2 font-semibold text-green-600 hover:text-green-700 self-start dark:text-green-400 dark:hover:text-green-300"
                >
                  Read on WHO
                  <ExternalIcon />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
