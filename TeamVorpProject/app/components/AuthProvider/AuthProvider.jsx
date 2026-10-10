"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";

const AuthContext = createContext({ user: null, loading: true }); //default state

export function AuthProvider({ children }) { //children is whatever component is wrapped around
  const [user, setUser] = useState(null); //holds Firebase's user obj when logged in, null if not
  const [loading, setLoading] = useState(true); //Seperates "logged out" from "still checking"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { //registers callback, user obj or null, from firebase
      setUser(u);
      setLoading(false);
    });
    return unsubscribe; //return obj to React, called on unmount
  }, []);

  //AuthContext.Provider makes {user, loading} available to everything rendered inside <AuthContext.Provider> tags
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/*
At runtime:
1. Page loads. AuthProvider mounts user=null, loading=true
2. Effect subscribes to Firebase. 
3. Firebase responds callback with a user or null.
4. Statue updates. AuthProvider re-renders with new value
*/