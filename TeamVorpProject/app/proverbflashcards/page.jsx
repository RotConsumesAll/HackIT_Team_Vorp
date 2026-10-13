import Link from 'next/link'
import Navbar from "../components/Navbar/Navbar"
import { useEffect, useState } from 'react'

function Body(){
    const [chineseProverb, setProverb] = useState("")

    useEffect(() =>
        fetch("https://chinese-proverbs.onrender.com/")
            .then((res) => res.json())
            .then((data) => {
                setProverb(data.chinese);
        }, [])
    )

    return( 
        <>
        <h1>Chinese Proverb Learning</h1>
            <Link 
                href="/idiomflashcards/pFlashcards" 
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            > 
                More info 
            </Link>
        </>
    )
}

export default function IMain(){
    return(
        <>
            <Navbar/>
            <Body/>
        </>
    )
}