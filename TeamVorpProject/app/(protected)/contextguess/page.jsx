import Link from "next/link"
import Navbar from "../../components/Navbar/Navbar"

function ContextGuess(){
  return(
    <>
      <Navbar/>
      <h1>Context Guess</h1>
      <p>Pick a quiz, or mix it up.</p>
      <ul>
        <li><Link href="/quiz/mix">Mix it up</Link></li>
        <li><Link href="/quiz/naturalGuess">Natural Guess</Link></li>
        <li><Link href="/quiz/sound">Sound Guess</Link></li>
        <li><Link href="/quiz/character">Character Guess</Link></li>
        <li><Link href="/quiz/tone">Tone Guess</Link></li>
        <li><Link href="/quiz/measureword">Measure Word</Link></li>
      </ul>
    </>
  )
}

export default ContextGuess