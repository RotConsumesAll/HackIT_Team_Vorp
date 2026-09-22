import Link from "next/link"
import styles from "./Navbar.module.css"

function Navbar(){
  return(
    <nav>
      <ul className={styles["nav-ul"]}>
        <li className="li"><Link href="/">Home</Link></li>
        <li className="li"><Link href="/idiomflashcards">Idiom Flashcards</Link></li>
        <li className="li"><Link href="/sentencebuilder">Sentence Builder</Link></li>
        <li className="li"><Link href="/vocabviaimages">Vocab Via Images</Link></li>
      </ul>      
    </nav>
  )
}

export default Navbar