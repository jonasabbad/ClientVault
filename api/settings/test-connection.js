// Vercel serverless function for testing Firebase connection
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    console.log("Starting Firebase connection test...");
    
    // Validate environment variables before attempting connection
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_APP_ID'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    console.log("Environment variables check:", {
      apiKey: !!process.env.VITE_FIREBASE_API_KEY,
      projectId: !!process.env.VITE_FIREBASE_PROJECT_ID,
      appId: !!process.env.VITE_FIREBASE_APP_ID,
      missingVars
    });
    
    if (missingVars.length > 0) {
      console.log("Missing environment variables:", missingVars);
      return res.status(400).json({
        success: false,
        message: "Missing required Firebase environment variables",
        details: {
          missingVariables: missingVars,
          configuredVariables: {
            apiKey: !!process.env.VITE_FIREBASE_API_KEY,
            projectId: !!process.env.VITE_FIREBASE_PROJECT_ID,
            appId: !!process.env.VITE_FIREBASE_APP_ID
          }
        }
      });
    }

    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: process.env.VITE_FIREBASE_APP_ID,
    };

    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("Testing Firestore connection...");
    // Test Firestore connection by attempting to read from a test collection
    const testDocRef = doc(db, "test", "connection");
    const docSnapshot = await getDoc(testDocRef);
    
    console.log("Firebase connection test completed successfully");
    
    const result = {
      success: true,
      message: "Firebase connection successful",
      details: {
        documentExists: docSnapshot.exists(),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      }
    };
    
    console.log("Firebase connection test result:", result);
    res.status(200).json(result);
    
  } catch (error) {
    console.error("Error in test-connection endpoint:", error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Firebase connection test failed",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
} 