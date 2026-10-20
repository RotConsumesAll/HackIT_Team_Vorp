import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { db } from "./firebase";

export function login(email, password){
  try{
    return signInWithEmailAndPassword(auth, email, password); //returns either user cred or throws err.
  }
  catch(error){
    friendlyMessage(error.code);
  }
}

export async function signUp(userName, email, password){
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(cred.user, { displayName: userName.trim() });

  await set(ref(db, `users/${cred.user.uid}`), {
    userName: userName.trim(),
    masteryLevel: 1,
    totalScore: 0,
  });

  return cred;
}

export function logout(){
  return signOut(auth);
}

export function friendlyMessage(code){
  let errorMsgDisplay;
  if(code=="auth/invalid-credential"){
    errorMsgDisplay="Incorrect email or password";
  }
  else if(code=="auth/invalid-email"){
    errorMsgDisplay="Please enter a valid email address";
  }
  else if(code=="auth/too-many-requests"){
    errorMsgDisplay="Too many attempts. Please try again later.";
  }
  else if(code=="auth/network-request-failed"){
    errorMsgDisplay="Network error. Check your connection";
  }
  else if(code=="auth/email-already-in-use"){
    errorMsgDisplay="An account with this email already exists";
  }
  else if(code=="auth/weak-password"){
    errorMsgDisplay="Password must be at least 6 characters";
  }
  else{
    errorMsgDisplay="Something went wrong. Please try again";
  }
  return errorMsgDisplay;
}