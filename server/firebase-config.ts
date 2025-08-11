import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Server-side Firebase configuration using environment variables
const getFirebaseConfig = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
  }

  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY!,
    authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID!,
    storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.VITE_FIREBASE_APP_ID!,
  };
};

let app: ReturnType<typeof initializeApp>;
let db: ReturnType<typeof getFirestore>;

try {
  const firebaseConfig = getFirebaseConfig();
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  throw error;
}

// Test Firebase connection for server
export const testFirebaseConnection = async (): Promise<{ 
  success: boolean; 
  message: string; 
  details?: any 
}> => {
  try {
    console.log("Testing Firebase connection...");
    
    // Check if Firebase is properly initialized
    if (!app || !db) {
      return {
        success: false,
        message: "Firebase not properly initialized",
        details: { app: !!app, db: !!db }
      };
    }

    // Test Firestore connection by attempting to read from a test collection
    const testDocRef = doc(db, "test", "connection");
    const docSnapshot = await getDoc(testDocRef);
    
    console.log("Firebase connection test completed successfully");
    
    return {
      success: true,
      message: "Firebase connection successful",
      details: {
        documentExists: docSnapshot.exists(),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      }
    };
  } catch (error) {
    console.error("Firebase connection test failed:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown Firebase connection error",
      details: {
        error: error instanceof Error ? error.message : error,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        apiKeyConfigured: !!process.env.VITE_FIREBASE_API_KEY,
        projectIdConfigured: !!process.env.VITE_FIREBASE_PROJECT_ID,
        appIdConfigured: !!process.env.VITE_FIREBASE_APP_ID
      }
    };
  }
};

export { app, db };
