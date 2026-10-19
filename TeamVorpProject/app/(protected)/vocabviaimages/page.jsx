'use client'
import Navbar from "../../components/Navbar/Navbar"
import { useRouter } from 'next/navigation'
import styles from "./imageLearner.module.css"

const CATEGORIES = ["Food", "Animals", "Places", "Countries", "Everyday Objects"]

function Main(){
    return(
        <main className={styles.main}>
            <h1 className={styles.title}>Image Learner</h1>
            <p className={styles.subtitle}>Choose a category</p>
            <div className={styles.categoryList}>
                {CATEGORIES.map((name) => (
                    <Category key={name} name={name}/>
                ))}
            </div>
        </main>
    )
}

function Category(props){
    const router = useRouter()
    // replaceAll so multi-word names like "Everyday Objects" always work
    const urlName = props.name.toLowerCase().replaceAll(" ", "-")
    const url = `/vocabviaimages/${urlName}`
    return (
        <button className={styles.categoryButton} onClick={() => router.push(url)}>
            {props.name}
        </button>
    )
}

function App(){
    return(
        <>
            <Navbar />
            <Main />
        </>
    )
}

export default App