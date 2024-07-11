// src/context/AuthContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getAuth, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA2kwpn-4Jjx7L1v-3a5ereeyvswLdpM4Q",
  authDomain: "chatpdf-a0b74.firebaseapp.com",
  projectId: "chatpdf-a0b74",
  storageBucket: "chatpdf-a0b74.appspot.com",
  messagingSenderId: "658318777577",
  appId: "1:658318777577:web:d068895a5c87dff99e2478",
  measurementId: "G-41R6KRYQ0Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext({});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    const signInWithClerk = async () => {
      try {
        const token = await getToken({ template: "integration_firebase" });
        await signInWithCustomToken(auth, token || "");
      } catch (error) {
        console.error("Error signing in with Clerk:", error);
      }
    };

    signInWithClerk();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });

    return () => unsubscribe();
  }, [getToken]);

  return (
    <AuthContext.Provider value={{ firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = () => useContext(AuthContext);
