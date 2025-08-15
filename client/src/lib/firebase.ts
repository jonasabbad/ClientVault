import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test Firebase connection
export const testFirebaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Test Firestore connection by attempting to read from a test collection
    const testDocRef = doc(db, "test", "connection");
    await getDoc(testDocRef);
    
    return {
      success: true,
      message: "Firebase connection successful"
    };
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown Firebase connection error"
    };
  }
};

export { app, auth, db };
