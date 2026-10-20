"use client"
import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";
import {useAuth} from "../AuthProvider/AuthProvider"
import {logout} from "../../../lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

const MENU_LINKS = [
    { label: "Home", href: "/", icon: <img src="/icons/house.png" width="30" height="30"></img> },
    { label: "Slang Lookup", href: "/glossary", icon: <img src="/icons/dictionary.png" width="30" height="30"></img>  },    
    { label: "Sentence Builder", href: "/sentencebuilder/builder", icon: <img src="/icons/tools.png" width="30" height="30"></img>  },
    { label: "Proverb Flashcards", href: "/proverbflashcards", icon:  <img src="/icons/cards.png" width="30" height="30"></img> },
    { label: "Image Learner", href: "/imagelearner", icon: <img src="/icons/image.png" alt="" width="24" height="24" /> },
    { label: "Context Guess", href: "/contextguess", icon: <img src="/icons/ContextG.png" alt="" width="24" height="24" /> },
    { label: "Ask Community", href: "/community", icon: <img src="/icons/people.png" width="30" height="30"></img> },
    { label: "Leaderboards", href: "/leaderboard", icon: <img src="/icons/trophy.png" width="24" height="24"></img> },
];

const ACCOUNT_LINKS = [
    { label: "Profile", href: "/profile", icon: null },
    { label: "Saved Phrases", href: "/phrases", icon: null },
    { label: "Progress", href: "/progress", icon: null },
]

export default function Navbar() {
    const [openSidebar, setOpenSidebar] = useState(false);
    const [openAccSidebar, setOpenAccSidebar] = useState(false);
    const anyOpen = openSidebar || openAccSidebar;
    const pathname = usePathname();
    const router = useRouter();
    const {user, loading} = useAuth();

    async function handleLogout(){
      try {
        await logout()
        router.push("/login");
      } 
      catch (error) {
        console.error(error.code);
      }
    }    

    // While the menu is open: Escape closes it, and the page behind can't scroll.
    useEffect(() => {
        if (!anyOpen) return;

        function onKeyDown(e) {
          if (e.key === "Escape") {
            setOpenSidebar(false);
            setOpenAccSidebar(false);
          }
        }
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
          document.removeEventListener("keydown", onKeyDown);
          document.body.style.overflow = "";
        };
    }, [anyOpen]);

    // Home only matches "/" exactly; other MENU_LINKS also match their sub-pages.
    function isActive(href) {
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(href + "/");
    }

    let backdropClass = styles.backdrop;
    let panelClass = styles.panel;
    let accPanelClass = styles.panel + " " + styles.panelRight;

    if (anyOpen) backdropClass += " " + styles.backdropOpen;
    if (openSidebar) panelClass += " " + styles.panelOpen;
    if (openAccSidebar) accPanelClass += " " + styles.panelOpen;

    return (
      <>
        <header className={styles.bar}>
          <button
            type="button"
            className={styles.burger}
            aria-label="Open menu"
            aria-expanded={openSidebar}
            aria-controls="side-menu"
            onClick={() => setOpenSidebar(true)}
          >
            <span />
            <span />
            <span />
          </button>
          {/* 
          loading is true: show neither logout nor login 
          loading is false, user exists: show logout
          loading is false, user is null: show login 
          */}
          <div className={styles.right}>
            {(loading===false && !user) &&(
              <button onClick={()=>(router.push("/login"))}>
                <p>Login</p>
              </button>
            )}
            {(loading===false && user) &&(
              <>
              {/* <button onClick={handleLogout}>
                <p>Logout</p>
              </button>*/}
              <button
                type="button"
                aria-label="Open account menu"
                aria-expanded={openAccSidebar}
                aria-controls="account-menu"
                onClick={() => setOpenAccSidebar(true)}
                className={styles.accountBtn}
              >
              <img className={styles.accountIcon} src="/icons/account.png" alt="" width="30" height="30" />
              </button>
              </>
            )}
          </div>
        </header>

        {/* Dark layer behind the panel. Clicking it closes the menu. */}
        <div
          className={backdropClass}
          onClick={() => {
            setOpenSidebar(false);
            setOpenAccSidebar(false);
          }}
        />

        {/* Feature sidebar */}
        <nav id="side-menu" aria-label="Main" className={panelClass}>
          <button
            type="button"
            className={styles.close}
            aria-label="Close menu"
            onClick={() => setOpenSidebar(false)}
          >
            ×
          </button>

          <ul className={styles.list}>
            {MENU_LINKS.map((link) => {
              const active = isActive(link.href);
              let itemClass = styles.item;
              let current;
              if (active) {
                itemClass += " " + styles.active;
                current = "page";
              }
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={itemClass}
                    aria-current={current}
                    onClick={() => setOpenSidebar(false)}
                  >
                    <span className={styles.icon} aria-hidden="true">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Account sidebar */}
        <nav id="account-menu" aria-label="Account" className={accPanelClass}>
          <button
            type="button"
            className={styles.close}
            aria-label="Close menu"
            onClick={() => setOpenAccSidebar(false)}
          >
            ×
          </button>

          <ul className={styles.list}>
            {ACCOUNT_LINKS.map((link) => {
              let itemClass = styles.item;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={itemClass}
                    onClick={() => setOpenAccSidebar(false)}
                  >
                    <span className={styles.icon} aria-hidden="true">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>          
              );
            })}
          </ul>
          {(loading===false && user) &&(
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <p className={styles.logoutBtnText}>Logout</p>
            </button>          
          )}          
        </nav>        
      </>
    );
}