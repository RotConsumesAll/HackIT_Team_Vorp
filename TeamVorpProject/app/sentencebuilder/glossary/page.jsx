"use client";
import Navbar from "../../components/Navbar/Navbar";
import SlangGlossSearch from "../../components/SlangGlossSearch/SlangGlossSearch";

function PlaceholderView(){
    return(
        <h1>Hello I am a glossary lookup</h1>
    )
}

function App(){
    return(
        <>
            <Navbar/>
            <PlaceholderView/>
            <SlangGlossSearch variant={"standalone"}/>
        </>
    )
}

export default App