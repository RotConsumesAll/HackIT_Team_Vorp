import Link from "next/link"
import Navbar from "../../components/Navbar/Navbar"
import styles from "./imageLearner.module.css"

// han = the character in the icon square, example = the sample line at the bottom of the card
const CATEGORIES = [
    { name: "Food", han: "食", desc: "Name common foods in Chinese.", example: "苹果 / 米饭" },
    { name: "Animals", han: "动", desc: "Name the animals you know.", example: "猫 / 狗" },
    { name: "Places", han: "地", desc: "Name places around town.", example: "学校 / 公园" },
    { name: "Countries", han: "国", desc: "Name countries around the world.", example: "新加坡 / 中国" },
    { name: "Everyday Objects", han: "物", desc: "Name things you use every day.", example: "椅子 / 书" },
]

function ImageLearner(){
    return (
        <div className={styles.shell}>
            <Navbar />
            <main className={styles.page}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Image Learner</h1>
                    <p className={styles.subtitle}>Choose a category</p>
                </header>

                <section className={styles.grid}>
                    {CATEGORIES.map((c, i) => (
                        <Link
                            key={c.name}
                            // replaceAll so multi-word names like "Everyday Objects" always work
                            href={`/imagelearner/${c.name.toLowerCase().replaceAll(" ", "-")}`}
                            // first three cards are narrow, the last two are wide
                            className={`${styles.card} ${i >= 3 ? styles.wide : ""}`}
                        >
                            <span className={styles.icon} aria-hidden="true">{c.han}</span>
                            <h2 className={styles.cardTitle}>{c.name}</h2>
                            <p className={styles.cardDesc}>{c.desc}</p>
                            <span className={styles.example}>{c.example}</span>
                        </Link>
                    ))}
                </section>
            </main>
        </div>
    )
}

export default ImageLearner