// src/lib/firebase.ts

"use client";

import { useAuth } from "@clerk/nextjs";
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, getDoc, onSnapshot, query } from "firebase/firestore";
import { getAuth, signInWithCustomToken } from "firebase/auth";
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

// Initialize Firestore with multi-tab persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Sign-in function with Clerk
export function useSignInWithClerk() {
  const { getToken } = useAuth();

  async function signInWithClerk() {
    const token = await getToken({ template: "integration_firebase" });
    await signInWithCustomToken(auth, token || "");
  }

  return signInWithClerk;
}

// Function to upload file to Firebase Storage
export async function uploadFileToFirebase(
  file: File,
  metadata: any,
  signInWithClerk?: () => Promise<void>
): Promise<{ file_key: string; file_name: string, url: string }> {
  return new Promise(async (resolve, reject) => {
    if (signInWithClerk) {
      try {
        await signInWithClerk();
      } catch (error) {
        console.error("Error signing in with Clerk:", error);
        return reject(error);
      }
    }

    const file_key = `uploads/${Date.now().toString()}`;
    const storageRef = ref(storage, file_key);
    const userId = auth.currentUser?.uid;
    console.log("User ID:", userId);

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');

        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      },
      (error) => {
        console.error('Upload failed', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('File available at', downloadURL);
          resolve({ file_key, file_name: file.name, url:downloadURL });

          // const metadataDoc = {
          //   file_key,
          //   file_name: file.name,
          //   ...metadata,
          //   downloadURL,
          //   uploadTime: new Date(),
          // };

          // const docId = file_key.split('/').pop() || 'default_doc_id';
          // console.log('Document ID:', docId);

          // const uploadsCollectionRef = doc(db, "uploads", "user_2j0a35xN7Oe8uikeH3udR0uM0wd");
          // await setDoc(uploadsCollectionRef, metadataDoc);

          // console.log('Metadata saved to Firestore');
          // resolve({ file_key, file_name: file.name });
        } catch (error) {
          console.error('Error saving metadata to Firestore:', error);
          reject(error);
        }
      }
    );
  });
}

// Function to get Firebase URL
export function getFirebaseUrl(file_key: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(file_key)}?alt=media`;
}

// Function to download file from Firebase
export async function downloadFromFirebase(file_key: string): Promise<string> {
  try {
    const storageRef = ref(storage, file_key);
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error downloading file from Firebase:', error);
    throw error;
  }
}

// Function to get metadata from Firestore
export async function getMetadataFromFirestore(file_key: string): Promise<any> {
  try {
    const docRef = doc(db, "uploads", file_key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('Document data:', docSnap.data());
      return docSnap.data();
    } else {
      throw new Error("No such document!");
    }
  } catch (error) {
    console.error('Error getting metadata from Firestore:', error);
    throw error;
  }
}

// Function to set up a real-time listener with onSnapshot
export function setUpRealtimeListener(collectionName: string, callback: (snapshot: any) => void) {
  const colRef = collection(db, collectionName);
  const q = query(colRef);
  
  onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
    callback(snapshot);
  });
}
