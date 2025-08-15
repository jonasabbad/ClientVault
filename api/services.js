// Vercel serverless function for service operations
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
        // Get all services
        const servicesSnapshot = await getDocs(collection(db, "services"));
        const services = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        res.status(200).json(services);
        break;

      case 'POST':
        // Create new service
        const { name, color, icon } = req.body;
        
        if (!name || !color || !icon) {
          return res.status(400).json({ 
            message: "Name, color, and icon are required" 
          });
        }

        const serviceId = randomUUID();
        const serviceData = {
          id: serviceId,
          name,
          color,
          icon,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(doc(db, "services", serviceId), serviceData);
        res.status(201).json(serviceData);
        break;

      default:
        res.status(405).json({ 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Error in services API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 