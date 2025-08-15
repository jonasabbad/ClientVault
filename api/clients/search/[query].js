// Vercel serverless function for client search
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { randomUUID } from 'crypto';

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

  const { query: searchQuery } = req.query;

  if (!searchQuery) {
    return res.status(400).json({ 
      message: 'Search query is required' 
    });
  }

  try {
    // Add to search history
    const searchId = randomUUID();
    await setDoc(doc(db, "searchHistory", searchId), {
      id: searchId,
      query: searchQuery,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Get all clients with their payment codes
    const [clientsSnapshot, paymentCodesSnapshot, servicesSnapshot] = await Promise.all([
      getDocs(collection(db, "clients")),
      getDocs(collection(db, "paymentCodes")),
      getDocs(collection(db, "services"))
    ]);

    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const paymentCodes = paymentCodesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combine clients with their payment codes and services
    const clientsWithCodes = clients.map(client => ({
      ...client,
      paymentCodes: paymentCodes
        .filter(code => code.clientId === client.id)
        .map(code => {
          const service = services.find(s => s.id === code.serviceId);
          return {
            ...code,
            service: service || { id: "", name: "Unknown Service", color: "#gray", icon: "" }
          };
        })
    }));

    // Perform search
    const searchTerm = decodeURIComponent(searchQuery).toLowerCase();
    const results = clientsWithCodes.filter(client => 
      client.name.toLowerCase().includes(searchTerm) || 
      client.phone.includes(searchTerm) || 
      client.paymentCodes?.some(code => code.code.toLowerCase().includes(searchTerm))
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in client search API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 