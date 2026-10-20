"use client";
import styles from "./page.module.css";
import Navbar from "../../components/Navbar/Navbar";
import SlangGlossSearch from "../../components/SlangGlossSearch/SlangGlossSearch";

function App(){
    return(
        <>
            <Navbar/>
            <main className={styles.main}>
                <h1 className={styles.title}>Slang Lookup</h1>
                <SlangGlossSearch variant={"standalone"}/>
            </main>
        </>
    )
}

export default App
