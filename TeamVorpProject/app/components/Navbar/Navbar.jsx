"use client"
import styles from "./Navbar.module.css";
import {useAuth} from "../AuthProvider/AuthProvider"
import {logout} from "../../../lib/auth"
import { useRouter } from "next/navigation";


function Navbar(){
  const router = useRouter();
  const {user, loading} = useAuth();

  async function handleLogout(){
    try {
      await logout()
      router.push("/login");
    } 
    catch (error) {
      console.error(error.code);
    }
  }

  return(
    <>
    <nav className ={styles.nav}>
      <button className={styles["nav-btn"]} onClick={()=>(router.push("/idiomFlashcards"))}>
        <p>Idiom Flashcards</p>
      </button>
      <button className={styles["nav-btn"]} onClick={()=>(router.push("/sentencebuilder"))}>
        <p>Sentence Builder</p>
      </button>
      <button className={styles["nav-btn"]} onClick={()=>(router.push("/vocabviaimages"))}>
        <p>Vocab Via Images</p>
      </button>
      <button className={styles["nav-btn"]} onClick={()=>(router.push("/contextguess"))}>
        <p>Context Guess</p>
      </button>
      <button className={styles["nav-btn"]} onClick={()=>(router.push("/progress"))}>
        <p>Progress</p>
      </button>
      <button className={styles["nav-btn"]} onClick={()=>(router.push("/leaderboard"))}>
        <p>Leaderboard</p>
      </button>
      <button className={styles["nav-btn"]} onClick={()=>(router.push("/phrases"))}>
        <p>Saved Phrases</p>
      </button>
      {/* 
      loading is true: show neither logout nor login 
      loading is false, user exists: show logout
      loading is false, user is null: show login 
      */}
      {(loading===false && !user) &&(
        <button onClick={()=>(router.push("/login"))}>
          <p>Login</p>
        </button>
      )}
      {(loading===false && user) &&(
        <button onClick={handleLogout}>
          <p>Logout</p>
        </button>
      )}
    </nav>
    </>
  )
}

export default Navbar