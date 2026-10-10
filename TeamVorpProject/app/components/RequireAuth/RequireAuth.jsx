"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider/AuthProvider";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user){
      router.replace("/login");
    }
  }, [user, loading, router]); //reruns when user or loading changes

  if (loading || !user){
    return null;
  }
  return children; //Only render when loading is false and user exists
}

//Client side gate. Data secured by Firebase.