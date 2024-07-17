// "use client";
// import { useAuth } from "@clerk/nextjs";
// import { initializeApp } from "firebase/app";
// import { getAuth, signInWithCustomToken } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { doc, getDoc } from "firebase/firestore";

// // Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyA2kwpn-4Jjx7L1v-3a5ereeyvswLdpM4Q",
//     authDomain: "chatpdf-a0b74.firebaseapp.com",
//     projectId: "chatpdf-a0b74",
//     storageBucket: "chatpdf-a0b74.appspot.com",
//     messagingSenderId: "658318777577",
//     appId: "1:658318777577:web:d068895a5c87dff99e2478",
//     measurementId: "G-41R6KRYQ0Q"
//   };

// // Connect to your Firebase app
// const app = initializeApp(firebaseConfig);
// // Connect to your Firestore database
// const db = getFirestore(app);
// // Connect to Firebase auth
// const auth = getAuth(app);

// // Remove this if you do not have Firestore set up
// // for your Firebase app
// const getFirestoreData = async () => {
//   const docRef = doc(db, "example", "example-document");
//   const docSnap = await getDoc(docRef);
//   if (docSnap.exists()) {
//     console.log("Document data:", docSnap.data());
//   } else {
//     // docSnap.data() will be undefined in this case
//     console.log("No such document!");
//   }
// };

// export default function FirebaseUI() {
//   const { getToken } = useAuth();
//   const signInWithClerk = async () => {
//     console.log("Sign in with clerk");
//     const token = await getToken({ template: "integration_firebase" });
//     const userCredentials = await signInWithCustomToken(auth, token || "");
//      // The userCredentials.user object can call the methods of
//      // the Firebase platform as an authenticated user.
//     console.log("User:", userCredentials.user);
//   };

  
// }