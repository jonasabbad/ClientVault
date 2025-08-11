import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Firebase config - ensure environment variables are set before running this script
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_PROJECT_ID + ".firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_PROJECT_ID + ".firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTestConnectionDoc() {
  try {
    const testDocRef = doc(db, "test", "connection");
    const docSnap = await getDoc(testDocRef);

    if (docSnap.exists()) {
      console.log("Document 'test/connection' exists:", docSnap.data());
    } else {
      console.log("Document 'test/connection' does NOT exist.");
    }
  } catch (error) {
    console.error("Error checking 'test/connection' document:", error);
  }
}

checkTestConnectionDoc();
