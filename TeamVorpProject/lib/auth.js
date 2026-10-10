import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

export function login(email, password){
  try{
    return signInWithEmailAndPassword(auth, email, password); //returns either user cred or throws err.
  }
  catch(error){
    friendlyMessage(error.code);
  }
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
  else{
    errorMsgDisplay="Something went wrong. Please try again";
  }
  return errorMsgDisplay;
}