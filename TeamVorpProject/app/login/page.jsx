"use client";
import { login } from "../../lib/auth";
import {friendlyMessage} from "../../lib/auth";
import styles from "./login.module.css";
import {useState} from "react";
import { useRouter } from "next/navigation";
import { signUp } from "../../lib/auth";

export default function LoginInterface(){
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showSignUp, setShowSignUp] = useState(false);
    const [suName, setSuName] = useState("");
    const [suEmail, setSuEmail] = useState("");
    const [suPassword, setSuPassword] = useState("");
    const [suConfirm, setSuConfirm] = useState("");

    function changeEmailField(e){
        setEmail(e.target.value);
    }

    function changePasswordField(e){
        setPassword(e.target.value);
    }    

    async function handleLogin(e){
        e.preventDefault();
        setErr("");
        if (!email.trim() || !password){
            setErr("Please enter your email and password.");
            return;
        }

        try{
            setSubmitting(true);
            await login(email, password); //returns either user cred or throws err, no need if cond
            router.push("/");            
        }
        catch(error){
            console.error(error.code);
            setErr(friendlyMessage(error.code)); //returns custom string for user feedback
        }
        finally{
            setSubmitting(false);
        }
    }

    async function handleSignUp(e){
    e.preventDefault();
    setErr("");
    if (!suName.trim() || !suEmail.trim() || !suPassword){
        setErr("Please fill in all fields.");
        return;
    }
    if (suPassword !== suConfirm){
        setErr("Passwords don't match.");
        return;
    }

    try{
        setSubmitting(true);
        await signUp(suName, suEmail, suPassword);
        router.push("/");
    }
    catch(error){
        console.error(error.code);
        setErr(friendlyMessage(error.code));
    }
    finally{
        setSubmitting(false);
    }
}

return(
        <div className={styles.shell}>
            <div className={styles.card}>
                <p className={styles.title}>Login page</p>

                <form className = {styles.form} onSubmit={handleLogin} noValidate={true}>
                    <input className={styles.input} type = "email" value={email} onChange={changeEmailField} placeholder="Email"></input>
                    <input className={styles.input} type = "password" value={password} onChange={changePasswordField} placeholder="Password"></input>
                    <button className={styles.submit} type="submit" disabled={submitting}>Login</button>
                </form>

                <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => { setShowSignUp(!showSignUp); setErr(""); }}
                >
                    {showSignUp ? "Cancel" : "Create an account"}
                </button>

                {showSignUp && (
                    <form className={styles.form} onSubmit={handleSignUp} noValidate={true}>
                        <input className={styles.input} type="text" value={suName} onChange={(e) => setSuName(e.target.value)} placeholder="Username"></input>
                        <input className={styles.input} type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="Email"></input>
                        <input className={styles.input} type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} placeholder="Password"></input>
                        <input className={styles.input} type="password" value={suConfirm} onChange={(e) => setSuConfirm(e.target.value)} placeholder="Confirm password"></input>
                        <button className={styles.submit} type="submit" disabled={submitting}>Sign up</button>
                    </form>
                )}

                {/* Error message display */}
                {err && (
                    <div className={styles.error}>
                        <h2>{err}</h2>
                    </div>
                )}
            </div>
        </div>
    )
}