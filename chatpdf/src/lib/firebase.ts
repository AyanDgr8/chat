// src/lib/firebase.ts

"use client";

import { useAuth } from "@clerk/nextjs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
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
const db = getFirestore(app);

export function useSignInWithClerk() {
  const { getToken } = useAuth();

  async function signInWithClerk() {
    const token = await getToken({ template: "integration_firebase" });
    await signInWithCustomToken(auth, token || "");
  }

  return signInWithClerk;
}

export async function uploadFileToFirebase(
  file: File,
  metadata: any,
  signInWithClerk?: () => Promise<void>
): Promise<{ file_key: string; file_name: string }> {
  return new Promise(async (resolve, reject) => {
    if (signInWithClerk) {
      try {
        await signInWithClerk(); // Call this only if it's provided
      } catch (error) {
        return reject(error); // Handle error if sign-in fails
      }
    }
    const userId = auth.currentUser?.uid; // Make sure to check if user is authenticated
    console.log("User ID:", userId);

    const file_key = `uploads/${userId}/${Date.now().toString()}-${file.name.replace(/ /g, "-")}`;
    const storageRef = ref(storage, file_key);
    
    
    
    // Create the upload task
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    // Listen for state changes, errors, and completion of the upload
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Get task progress
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
        // Handle unsuccessful uploads
        console.error('Upload failed', error);
        switch (error.code) {
          case 'storage/unauthorized':
            console.error('User doesn’t have permission to access the object');
            break;
          case 'storage/canceled':
            console.error('User canceled the upload');
            break;
          case 'storage/unknown':
            console.error('Unknown error occurred, inspect error.serverResponse');
            break;
        }
        reject(error);
      },

      async () => {
        // Upload completed successfully, now we can get the download URL
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log('File available at', downloadURL);

        // Save metadata to Firestore
        const metadataDoc = {
          file_key,
          file_name: file.name,
          ...metadata,
          downloadURL,
          uploadTime: new Date(),
        };

        // Extract the document ID from the file_key
        const docId = file_key.split('/').pop() || 'default_doc_id'; // Ensure default ID
          
        try {
          // Correctly create the document reference
          const uploadsCollectionRef = doc(db, "uploads", docId);
          await setDoc(uploadsCollectionRef, metadataDoc);
          console.log('Metadata saved to Firestore');
          resolve({
            file_key,
            file_name: file.name,
          });
        } catch (error) {
          console.error('Error saving metadata to Firestore:', error);
          reject(error);
        }
      }
    );
  });
}

export function getFirebaseUrl(file_key: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(file_key)}?alt=media`;
}

// ****************


export async function downloadFromFirebase(file_key: string): Promise<string> {
  try {
    const storageRef = ref(storage, file_key);
    return await getDownloadURL(storageRef);
  } catch (error) {
    throw error;
  }
}

export async function getMetadataFromFirestore(file_key: string): Promise<any> {
  try {
    const docRef = doc(db, "uploads", file_key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error("No such document!");
    }
  } catch (error) {
    throw error;
  }
}

