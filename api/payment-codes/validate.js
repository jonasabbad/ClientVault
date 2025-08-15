// Vercel serverless function for payment code validation
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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
let app, db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully in payment codes validation API');
} catch (error) {
  console.error('Firebase initialization error in payment codes validation API:', error);
  throw error;
}

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/payment-codes/validate - Starting request`);
  
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
      message: 'Method not allowed' 
    });
  }

  try {
    const { serviceId, code, excludeId } = req.body;
    
    if (!serviceId || !code) {
      return res.status(400).json({ 
        message: 'Service ID and code are required' 
      });
    }

    console.log('Validating payment code:', { serviceId, code, excludeId });

    // Check for duplicate code in the same service
    const duplicateQuery = query(
      collection(db, "paymentCodes"),
      where("serviceId", "==", serviceId),
      where("code", "==", code)
    );
    
    const duplicateSnapshot = await getDocs(duplicateQuery);
    
    let isUnique = true;
    
    if (excludeId) {
      // If excluding an ID (for updates), check if any other codes match
      isUnique = duplicateSnapshot.docs.every(doc => doc.id === excludeId);
    } else {
      // For new codes, check if any codes match
      isUnique = duplicateSnapshot.empty;
    }

    console.log('Payment code validation result:', { isUnique, code, serviceId });
    
    res.status(200).json({ isUnique });
  } catch (error) {
    console.error('Error in payment code validation API:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      details: {
        timestamp: new Date().toISOString(),
        method: req.method,
        hasBody: !!req.body
      }
    });
  }
} 