import Link from "next/link";
import styles from "./page.module.css"

export default function SentenceBuilderCrossroad() {
  return(
    <>
    <h1>Select one:</h1>
    <nav>
      <ul className={styles["builder-ul"]}>
        <li className="li"><Link href="/">Home</Link></li>
        <li className="li"><Link href="/sentencebuilder/builder">Build a Sentence</Link></li>
        <li className="li"><Link href="/sentencebuilder/glossary">Slang Glossary</Link></li>
        <li className="li"><Link href="/sentencebuilder/structure">Sentence Structure</Link></li>
      </ul>      
    </nav>    
    </>
  )  
}
