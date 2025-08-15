// Vercel serverless function for client operations
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, limit } from 'firebase/firestore';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all clients
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        const clients = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        res.status(200).json(clients);
        break;

      case 'POST':
        // Create new client
        const { name, phone, paymentCodes = [] } = req.body;
        
        if (!name || !phone) {
          return res.status(400).json({ 
            message: "Name and phone are required" 
          });
        }

        // Check for duplicate client name
        const existingClientQuery = query(
          collection(db, "clients"),
          where("name", "==", name),
          limit(1)
        );
        const existingClientSnapshot = await getDocs(existingClientQuery);
        
        if (!existingClientSnapshot.empty) {
          return res.status(400).json({ 
            message: `Client with name "${name}" already exists` 
          });
        }

        // Create client
        const clientId = randomUUID();
        const clientData = {
          id: clientId,
          name,
          phone,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(doc(db, "clients", clientId), clientData);

        // Create payment codes if provided
        for (const codeData of paymentCodes) {
          const codeId = randomUUID();
          await setDoc(doc(db, "paymentCodes", codeId), {
            id: codeId,
            clientId,
            serviceId: codeData.serviceId,
            code: codeData.code,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        res.status(201).json(clientData);
        break;

      default:
        res.status(405).json({ 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Error in clients API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 