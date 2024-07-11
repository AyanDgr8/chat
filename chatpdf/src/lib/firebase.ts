// src/lib/firebase.ts


"use client";

import { useAuth } from "@clerk/nextjs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Firebase configuration
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
const storage = getStorage(app);
const auth = getAuth(app);

export function useSignInWithClerk() {
  const { getToken } = useAuth();

  async function signInWithClerk() {
    const token = await getToken({ template: "integration_firebase" });
    await signInWithCustomToken(auth, token || "");
  }

  return signInWithClerk;
}

export async function uploadToFirebase(file: File, metadata: any, signInWithClerk: () => Promise<void>): Promise<{ file_key: string; file_name: string }> {
  await signInWithClerk(); // Ensure Firebase is authenticated
  return new Promise((resolve, reject) => {
    const file_key = `uploads/${Date.now().toString()}-${file.name.replace(/ /g, "-")}`;
    const storageRef = ref(storage, file_key);

    uploadBytesResumable(storageRef, file, metadata)
      .then((snapshot) => {
        console.log('Uploaded', snapshot.totalBytes, 'bytes.');
        console.log('File metadata:', snapshot.metadata);
        getDownloadURL(snapshot.ref).then((url) => {
          console.log('File available at', url);
          resolve({
            file_key,
            file_name: file.name,
          });
        });
      })
      .catch((error) => {
        console.error('Upload failed', error);
        reject(error);
      });
  });
}

/**
 * Download a file from Firebase Storage
 * @param file_key - The key of the file to download
 * @returns A URL to the downloaded file
 */
export async function downloadFromFirebase(file_key: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const storageRef = ref(storage, file_key);
      const url = await getDownloadURL(storageRef);
      resolve(url);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get a URL to a file stored in Firebase Storage
 * @param file_key - The key of the file
 * @returns The URL to the file
 */
export function getFirebaseUrl(file_key: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(file_key)}?alt=media`;
}