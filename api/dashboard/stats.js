// Vercel serverless function for dashboard stats
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      message: 'Method not allowed' 
    });
  }

  try {
    // Get all collections
    const [clientsSnapshot, paymentCodesSnapshot, servicesSnapshot, searchSnapshot] = await Promise.all([
      getDocs(collection(db, "clients")),
      getDocs(collection(db, "paymentCodes")),
      getDocs(collection(db, "services")),
      getDocs(collection(db, "searchHistory"))
    ]);

    // Calculate daily searches
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailySearches = searchSnapshot.docs.filter(doc => {
      const searchDate = doc.data().createdAt?.toDate();
      return searchDate && searchDate >= today;
    }).length;

    const stats = {
      totalClients: clientsSnapshot.size,
      totalCodes: paymentCodesSnapshot.size,
      activeServices: servicesSnapshot.size,
      dailySearches
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error in dashboard stats API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 