// Vercel serverless function for settings operations
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get settings
        const settingsDoc = await getDoc(doc(db, "settings", "app"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const { createdAt, updatedAt, ...settings } = data;
          res.status(200).json(settings);
        } else {
          res.status(200).json({});
        }
        break;

      case 'POST':
        // Save settings
        await setDoc(doc(db, "settings", "app"), {
          ...req.body,
          updatedAt: new Date()
        }, { merge: true });
        
        res.status(200).json({ message: "Settings saved successfully" });
        break;

      default:
        res.status(405).json({ 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Error in settings API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 