'use client'
import Navbar from "../../components/Navbar/Navbar"
import { useRouter } from 'next/navigation'

const CATEGORIES = ["Food", "Animals", "Places", "Countries", "Everyday Objects"]

function Main(){
    return(
        <main className="relative flex min-h-[calc(100vh-64px)] flex-col items-center bg-[#faf9f5] px-4 pb-14 pt-8">
            <h1 className="m-0 text-center text-3xl font-bold text-[#6479f5]">Image Learner</h1>
            <p className="mb-8 mt-1 text-center text-xs text-neutral-700">Choose a category</p>
            <div className="flex w-full max-w-xs flex-col gap-3.5">
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
        <button
            className="w-full cursor-pointer rounded-md border border-neutral-300 bg-white px-3.5 py-3 text-left text-sm text-neutral-800 hover:border-[#6479f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6479f5]"
            onClick={() => router.push(url)}
        >
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