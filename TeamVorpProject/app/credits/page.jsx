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
                    <li className="list-group-item">
                        <a href="https://www.flaticon.com/free-icons/user">User icon created by Phoenix Group - Flaticon</a>
                    </li>
                    <li className="list-group-item">
                        <a href="https://www.flaticon.com/free-icons/dictionary">Dictionary icons created by Erix - Flaticon</a>    
                    </li>
                    <li className="list-group-item">
                        <a href="https://www.flaticon.com/free-icons/picture" title="picture icons">Picture icons created by Pixel perfect - Flaticon</a>
                    </li>
                    <li className="list-group-item">
                        <a href="https://www.flaticon.com/free-icons/hardware" title="hardware icons">Hardware icons created by Smashicons - Flaticon</a> 
                    </li>
                    <li className="list-group-item">
                        <a href="https://www.flaticon.com/free-icons/flash-cards" title="flash cards icons">Flash cards icons created by manshagraphics - Flaticon</a>
                    </li>
                    <li className="list-group-item">
                        <a href="https://www.flaticon.com/free-icons/conversation" title="conversation icons">Conversation icons created by winnievinzence - Flaticon</a>
                    </li>                                                                 
                </ul>
            </section>
            
            <section>
                <h2>Proverb Flashcards</h2>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://github.com/praxeds/chinese-proverbs-api">Chinese proverbs api</a>
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
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://claude.ai/share/9434e8d9-c9b8-4e88-a0b0-a695cfee5993">Claude chat 1</a>
                    </li>
                </ul>                
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://claude.ai/share/2444726d-79f0-47ca-aea0-18efa30afb28">Claude chat 2</a>
                    </li>
                </ul>                 
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://claude.ai/share/4b4063c7-6c6a-46f3-b920-2708df74f937">Claude chat 3</a>
                    </li>
                </ul>
                <ul className="list-group">
                    <li className="list-group-item">
                        <a href="https://chat.deepseek.com/share/2g9vhcpjkugxbi6glu">DeepSeek chat</a>
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