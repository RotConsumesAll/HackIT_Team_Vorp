import Navbar from "./components/Navbar/Navbar"
import Link from "next/link"

function App(){
  return(
    <>
        <Navbar/>
        <h1>Hi my name is homepage</h1>
        <Link href="/credits">credits</Link>
    </>
  )
}

export default App