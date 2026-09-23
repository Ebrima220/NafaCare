import { useEffect, useRef, useState } from 'react'

const tips = [
  {
    id: 1,
    img: '/images/tip-hydration.jpg',
    alt: 'A glass of drinking water',
    tag: 'Hydration',
    title: 'Stay Hydrated Every Day',
    description:
      "Drinking enough water supports your body's vital functions and helps you feel your best.",
    link: 'https://www.who.int/westernpacific/news-room/fact-sheets/detail/drinking-water',
  },
  {
    id: 2,
    img: '/images/tip-diet.jpg',
    alt: 'A plate of vegetables, grains, and fish',
    tag: 'Nutrition',
    title: 'Eat a Balanced Diet',
    description:
      'Choose fruits, vegetables, whole grains, and lean proteins for better overall health.',
    link: 'https://www.who.int/health-topics/healthy-diet',
  },
  {
    id: 3,
    img: '/images/tip-sleep.jpg',
    alt: 'A person sleeping in a bed',
    tag: 'Wellness',
    title: 'Get Enough Sleep',
    description:
      'Quality sleep helps your body recover, improves focus, and supports your immune system.',
    link: 'https://www.who.int/europe/news-room/fact-sheets/item/everyday-actions-for-better-health-who-recommendations',
  },
  {
    id: 4,
    img: '/images/tip-mosquito-net.jpg',
    alt: 'A mosquito net over a bed',
    tag: 'Malaria',
    title: 'Sleep Under a Treated Net',
    description:
      'Use an insecticide-treated mosquito net every night, especially in the rainy season, to lower the risk of malaria.',
    link: 'https://www.who.int/news-room/fact-sheets/detail/malaria',
  },
  {
    id: 5,
    img: '/images/tip-handwashing.jpg',
    alt: 'Hands being washed with soap',
    tag: 'Hygiene',
    title: 'Wash Hands with Soap',
    description:
      'Wash your hands with soap and clean water before eating and after using the toilet to help stop illness from spreading.',
    link: 'https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease',
  },
  {
    id: 6,
    img: '/images/tip-vaccination.jpg',
    alt: 'A nurse giving a routine vaccine',
    tag: 'Immunization',
    title: 'Keep Vaccinations Up to Date',
    description:
      'Take children for their routine vaccines. Immunization protects against serious diseases that are still common in the region.',
    link: 'https://www.who.int/health-topics/vaccines-and-immunization',
  },
  {
    id: 7,
    img: '/images/tip-diabetes.jpg',
    alt: 'A person walking outdoors with fresh fruit and water',
    tag: 'Diabetes',
    title: 'How to Prevent Diabetes',
    description:
      'Stay active, keep a healthy weight, and cut down on sugary drinks and highly processed food to lower the risk of type 2 diabetes.',
    link: 'https://www.who.int/news-room/fact-sheets/detail/diabetes',
  },
  {
    id: 8,
    img: '/images/tip-hypertension.jpg',
    alt: 'A blood pressure check in a clinic',
    tag: 'Blood Pressure',
    title: 'How to Prevent Hypertension',
    description:
      'Use less salt, stay active, and keep a healthy weight. Regular blood pressure checks help you notice high blood pressure early.',
    link: 'https://www.who.int/news-room/fact-sheets/detail/hypertension',
  },
]

function TipCard({ tip }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShown(entry.isIntersecting),
      { threshold: 0.18 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <article
      ref={ref}
      className={`tip-card flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-slate-800 ${shown ? 'is-visible' : ''}`}
    >
      <div className="h-36 overflow-hidden">
        <img src={tip.img} alt={tip.alt} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="self-start rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
          {tip.tag}
        </span>
        <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{tip.title}</h3>
        <p className="mt-3 text-slate-600 dark:text-slate-400">{tip.description}</p>
        <a
          href={tip.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 self-start pt-6 font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          Read on WHO
          <ExternalIcon />
        </a>
      </div>
    </article>
  )
}

function ExternalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5ZM10 4.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V6.31l-6.22 6.22a.75.75 0 0 1-1.06-1.06L13.19 5.5h-2.44a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  )
}

export default function HealthTips() {
  return (
    <section id="health-tips" className="bg-white py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-6">
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

        <div className="mt-16 grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
          {tips.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      </div>
    </section>
  )
}
