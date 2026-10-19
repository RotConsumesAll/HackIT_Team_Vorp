import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import styles from "./page.module.css";

// han = the character in the icon square, example = the sample line at the bottom of the card
const QUIZZES = [
  { href: "/quiz/naturalGuess", han: "话", title: "Natural Guess", desc: "Match phrases to where they are used.", example: "可以帮我打包吗？" },
  { href: "/quiz/naturalPhrase", han: "句", title: "Natural Phrase", desc: "Pick what a native speaker would say.", example: "不好意思 / 对不起" },
  { href: "/quiz/sound", han: "音", title: "Sound Guess", desc: "Same character, different sound.", example: "长: cháng / zhǎng" },
  { href: "/quiz/character", han: "字", title: "Character Guess", desc: "Same sound, different character.", example: "的 / 地 / 得" },
  { href: "/quiz/tone", han: "调", title: "Tone Guess", desc: "Which syllables take a neutral tone?", example: "椅子 / 觉得" },
  { href: "/quiz/measureword", han: "量", title: "Measure Word", desc: "Type the right measure word.", example: "一 __ 猫" },
];

function ContextGuess(){
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Context Guess</h1>
          <p className={styles.subtitle}>What do you want to practise today?</p>
        </header>

        <section className={styles.grid}>
          <Link href="/quiz/daily" className={`${styles.card} ${styles.wide}`}>
            <span className={styles.icon} aria-hidden="true">日</span>
            <h2 className={styles.cardTitle}>Quiz of the Day</h2>
            <p className={styles.cardDesc}>One new set every day.</p>
            <span className={styles.example}>New every day</span>
          </Link>

          <Link href="/quiz/mix" className={`${styles.card} ${styles.wide} ${styles.mix}`}>
            <span className={styles.icon} aria-hidden="true">混</span>
            <h2 className={styles.cardTitle}>Mix it up</h2>
            <p className={styles.cardDesc}>A random blend of every quiz.</p>
            <span className={styles.example}>All quiz types</span>
          </Link>

          {QUIZZES.map((q) => (
            <Link key={q.href} href={q.href} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">{q.han}</span>
              <h2 className={styles.cardTitle}>{q.title}</h2>
              <p className={styles.cardDesc}>{q.desc}</p>
              <span className={styles.example}>{q.example}</span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}

export default ContextGuess