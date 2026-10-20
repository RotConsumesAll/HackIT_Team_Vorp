import Navbar from "../components/Navbar/Navbar"
import Link from "next/link"
import styles from "./homepage.module.css"

// TODO: check these hrefs match your actual routes
const CORE_FEATURES = [
    {
        title: "Sentence Builder",
        description: "Put words in the right order and build natural sentences.",
        href: "/sentencebuilder/builder",
        icon: "sentence",
    },
    {
        title: "Proverb Flashcards",
        description: "Flip through proverbs and idioms and learn what they really mean.",
        href: "/proverbflashcards",
        icon: "cards",
    },
    {
        title: "Image Learner",
        description: "See a picture, name it in Chinese, and check your answer.",
        href: "/imagelearner",
        icon: "image",
    },
    {
        title: "Context Guess",
        description: "Work out what a word means from the sentence around it.",
        href: "/contextguess",
        icon: "question",
    },
]

const SMALL_FEATURES = [
    {
        title: "Leaderboard",
        description: "See how you rank against other learners.",
        href: "/leaderboard",
        icon: "trophy",
    },
    {
        title: "Progress",
        description: "Track your scores and keep your streak going.",
        href: "/progress",
        icon: "progress",
    },
]

function Icon({ name }) {
    const common = {
        width: 40,
        height: 40,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    }
    switch (name) {
        case "sentence":
            return (
                <svg {...common}>
                    <rect x="3" y="5" width="18" height="12" rx="2.5" />
                    <path d="M8 21l3-4" />
                    <path d="M8 9.5h8M8 13h5" />
                </svg>
            )
        case "cards":
            return (
                <svg {...common}>
                    <rect x="3" y="7" width="13" height="13" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3" />
                </svg>
            )
        case "image":
            return (
                <svg {...common}>
                    <rect x="3" y="4" width="18" height="16" rx="2.5" />
                    <circle cx="9" cy="10" r="1.6" />
                    <path d="M4 18l5.5-5.5 4 4 2.5-2.5L21 18" />
                </svg>
            )
        case "question":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1.9-1.1 1.7" />
                    <path d="M12 17h.01" />
                </svg>
            )
        case "trophy":
            return (
                <svg {...common} width={28} height={28}>
                    <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
                    <path d="M8 6H4v1a3 3 0 0 0 4 2.8M16 6h4v1a3 3 0 0 1-4 2.8" />
                    <path d="M12 13v4M8.5 20h7M10 17h4" />
                </svg>
            )
        case "progress":
            return (
                <svg {...common} width={28} height={28}>
                    <path d="M3 20h18" />
                    <path d="M5 16l4-5 4 3 6-8" />
                    <path d="M15 6h4v4" />
                </svg>
            )
        default:
            return null
    }
}

function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroInner}>
                <p className={styles.eyebrow}>Welcome to</p>
                <h1 className={styles.brand}>Learnlah</h1>
                <p className={styles.tagline}>
                    Your one stop platform to improve and integrate your mother tongue into your daily lives.
                </p>
                <a className={styles.heroButton} href="#features">Start learning</a>
            </div>
        </section>
    )
}

function Features() {
    return (
        <section id="features" className={styles.features}>
            <h2 className={styles.sectionTitle}>Pick an activity</h2>

            <div className={styles.coreGrid}>
                {CORE_FEATURES.map((f) => (
                    <Link key={f.title} href={f.href} className={styles.coreCard}>
                        <span className={styles.coreIcon}><Icon name={f.icon} /></span>
                        <span className={styles.coreTitle}>{f.title}</span>
                        <span className={styles.coreDescription}>{f.description}</span>
                    </Link>
                ))}
            </div>

            <div className={styles.smallGrid}>
                {SMALL_FEATURES.map((f) => (
                    <Link key={f.title} href={f.href} className={styles.smallCard}>
                        <span className={styles.smallIcon}><Icon name={f.icon} /></span>
                        <span>
                            <span className={styles.smallTitle}>{f.title}</span>
                            <span className={styles.smallDescription}>{f.description}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    )
}

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerInner}>
                <h2 className={styles.footerTitle}>About us</h2>
                <p className={styles.footerText}>
                    Learnlah helps you keep your mother tongue alive through short, fun activities you can
                    fit into your day. Build sentences, learn proverbs, name the world around you and
                    guess words from context.
                </p>
                <Link href="/credits" className={styles.footerLink}>Credits and references</Link>
            </div>
        </footer>
    )
}

function App(){
  return(
    <>
        <Navbar/>
        <main className={styles.page}>
            <Hero />
            <Features />
        </main>
        <Footer />
    </>
  )
}

export default App