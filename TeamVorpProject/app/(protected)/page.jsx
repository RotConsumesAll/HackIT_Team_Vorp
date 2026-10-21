import Navbar from "../components/Navbar/Navbar"
import Link from "next/link"
import styles from "./homepage.module.css"

// icon = path to an image in the public folder (.svg or .png), e.g. public/icons/image-learner.svg
// TODO: check these hrefs match your actual routes
const CORE_FEATURES = [
    {
        title: "Chinese Adapter",
        description: "Type anything and get Chinese with pinyin, instantly.",
        href: "/translate",
        icon: "/icons/Communication.png",
    },
    {
        title: "Sentence Builder",
        description: "Put words in the right order and build natural sentences.",
        href: "/sentencebuilder/builder",
        icon: "/icons/tools.png",
    },
    {
        title: "Proverb Flashcards",
        description: "Flip through proverbs and idioms and learn what they really mean.",
        href: "/proverbflashcards",
        icon: "/icons/cards.png",
    },
    {
        title: "Image Learner",
        description: "See a picture, name it in Chinese, and check your answer.",
        href: "/imagelearner",
        icon: "/icons/image.png",
    },
    {
        title: "Context Guess",
        description: "Work out what a word means from the sentence around it.",
        href: "/contextguess",
        icon: "/icons/ContextG.png",
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
                        <span className={styles.coreIcon}><img src={f.icon} alt="" width={40} height={40} /></span>
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