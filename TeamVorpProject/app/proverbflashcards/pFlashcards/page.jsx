import Link from "next/link"
import Navbar from "../../components/Navbar/Navbar"

function PlaceholderView(){
    return(
        <>
            <h1>Hello I am a flashcard</h1>
            <div class="flex gap-10">
                <Link 
                    href="/proverbflashcards/pMixnmatch" 
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                > 
                    Mix and Match 
                </Link>

                <Link 
                    href="/proverbflashcards/pQuiz" 
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                > 
                    Quiz
                </Link>
            </div>
        </>
    )
}

export default function PFlashcards(){
    return(
        <>
            <Navbar/>
            <PlaceholderView/>
        </>
    )
}   
