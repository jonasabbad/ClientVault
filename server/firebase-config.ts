import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Server-side Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebasestorage.app`,
  messagingSenderId: "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "demo-app-id",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test Firebase connection for server
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

export { app, db };