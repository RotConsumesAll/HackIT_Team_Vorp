"use client";
import { login } from "../../lib/auth";
import {friendlyMessage} from "../../lib/auth";
import styles from "./login.module.css";
import {useState} from "react";
import { useRouter } from "next/navigation";

export default function LoginInterface(){
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [submitting, setSubmitting] = useState(false);

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

    return(
        <>
        <p>Login page</p>
        <form className = {styles.form} onSubmit={handleLogin} noValidate={true}>
            <input type = "email" value={email} onChange={changeEmailField} placeholder="Email"></input>
            <input type = "password" value={password} onChange={changePasswordField} placeholder="Password"></input>
            <button type="submit" disabled={submitting}>Login</button>
        </form>

        {/* Error message display */}
        {err && (
            <div>
                <h2>{err}</h2>
            </div>
        )}
        </>
    )
}