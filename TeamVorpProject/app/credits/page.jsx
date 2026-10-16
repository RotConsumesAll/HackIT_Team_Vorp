import Link from "next/link"

export default function App(){
    return(
        <>
        <Link href="/">Home</Link>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" 
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossOrigin="anonymous"></link>

        <main className = "container">
            <section>
                <h2>General</h2>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://nextjs.org/docs/pages/api-reference/components/link">Navigation between pages</a>
                    </li>
                    <li className="list-group-item">
                        <a href="https://getbootstrap.com/docs/5.3/getting-started/download/">Compiled bootstrap 5 CSS jsDelivr CDN</a>
                    </li>
                    <li className="list-group-item">
                        <a href="https://nextjs.org/docs/app/api-reference/directives/use-client">Use client</a>
                    </li>
                    <li className="list-group-item">
                        <a href="https://nextjs.org/docs/pages/api-reference/functions/use-router">Use router</a>
                    </li>                                                  
                </ul>
            </section>
            
            <section>
                <h2>Idiom Flashcards</h2>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href=""></a>
                    </li>
                </ul>
            </section>

            <section>
                <h2>Sentence Builder</h2>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://www.w3schools.com/react/react_forms.asp">React Forms and useState hook</a>
                    </li>
                </ul>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://www.w3schools.com/howto/howto_js_filter_dropdown.asp">Filter dropdown</a>
                    </li>
                </ul>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://www.w3schools.com/python/python_virtualenv.asp">Virtual environment</a>
                    </li>
                </ul>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://stanfordnlp.github.io/stanza/pipeline.html">Stanza pipeline for part-of-speech tagging</a>
                    </li>
                </ul>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://github.com/fxsjy/jieba">Jie ba for tokenizing Chinese words</a>
                    </li>
                </ul>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://react-bootstrap.netlify.app/docs/components/overlays#tooltips">React Bootstrap tooltips</a>
                    </li>
                </ul>                                                        
            </section>

            <section>
                <h2>Vocab Via Images</h2>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href=""></a>
                    </li>
                </ul>
            </section>

            <section>
                <h2>Name here</h2>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href=""></a>
                    </li>
                </ul>
            </section>         

            <section>
                <h2>Name here</h2>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href=""></a>
                    </li>
                </ul>
            </section>         
        </main>                   
        </>
    )
}