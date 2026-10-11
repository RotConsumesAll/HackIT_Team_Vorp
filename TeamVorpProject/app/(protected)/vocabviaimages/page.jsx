'use client'
import Navbar from "../../components/Navbar/Navbar"
import { useRouter } from 'next/navigation'

function Main(){
    return(
        <>
            <h1>Image Learner</h1>
            <p>Choose a category</p>
            <Category name={"Food"}/>
            <Category name={"Animals"}/>
            <Category name={"Places"}/>
            <Category name={"Countries"}/>
            <Category name={"Everyday Objects"}/>
        </>
    )
}

function Category(props){
    const router = useRouter()
    const urlName = props.name.toLowerCase().replace(" ","-")
    const url = `/vocabviaimages/${urlName}`
    return (
        <button onClick={() => router.push(url)}>
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