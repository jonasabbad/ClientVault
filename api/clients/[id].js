// Vercel serverless function for individual client operations
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
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
let app, db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully in client details API');
} catch (error) {
  console.error('Firebase initialization error in client details API:', error);
  throw error;
}

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/clients/[id] - Starting request`);
  console.log('Request query:', req.query);
  console.log('Request method:', req.method);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id) {
    console.log('No client ID provided');
    return res.status(400).json({ 
      message: 'Client ID is required' 
    });
  }

  console.log('Processing request for client ID:', id);

  try {
    switch (req.method) {
      case 'GET':
        console.log('Getting client details for ID:', id);
        
        // Get client with payment codes
        const clientDoc = await getDoc(doc(db, "clients", id));
        if (!clientDoc.exists()) {
          console.log('Client not found in Firebase:', id);
          return res.status(404).json({ message: "Client not found" });
        }

        const client = { id: clientDoc.id, ...clientDoc.data() };
        console.log('Client found:', { id: client.id, name: client.name });
        
        // Get payment codes for this client
        const paymentCodesQuery = query(
          collection(db, "paymentCodes"),
          where("clientId", "==", id)
        );
        const paymentCodesSnapshot = await getDocs(paymentCodesQuery);
        console.log('Found payment codes:', paymentCodesSnapshot.size);
        
        // Get all services
        const servicesSnapshot = await getDocs(collection(db, "services"));
        const services = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Found services:', services.length);

        // Combine payment codes with service information
        const paymentCodes = paymentCodesSnapshot.docs.map(doc => {
          const codeData = { id: doc.id, ...doc.data() };
          const service = services.find(s => s.id === codeData.serviceId);
          return {
            ...codeData,
            service: service || { id: "", name: "Unknown Service", color: "#gray", icon: "" }
          };
        });

        const clientWithCodes = {
          ...client,
          paymentCodes
        };

        console.log('Returning client with codes:', {
          id: clientWithCodes.id,
          name: clientWithCodes.name,
          paymentCodesCount: clientWithCodes.paymentCodes.length
        });

        res.status(200).json(clientWithCodes);
        break;

      case 'PUT':
        console.log('Updating client:', id);
        
        // Update client
        const { name, phone, paymentCodes = [] } = req.body;
        
        if (!name || !phone) {
          return res.status(400).json({ 
            message: "Name and phone are required" 
          });
        }

        // Update client data
        await updateDoc(doc(db, "clients", id), {
          name,
          phone,
          updatedAt: new Date()
        });

        // Delete existing payment codes
        const existingCodesQuery = query(
          collection(db, "paymentCodes"),
          where("clientId", "==", id)
        );
        const existingCodesSnapshot = await getDocs(existingCodesQuery);
        
        for (const codeDoc of existingCodesSnapshot.docs) {
          await deleteDoc(codeDoc.ref);
        }

        // Create new payment codes
        for (const codeData of paymentCodes) {
          const codeId = randomUUID();
          await setDoc(doc(db, "paymentCodes", codeId), {
            id: codeId,
            clientId: id,
            serviceId: codeData.serviceId,
            code: codeData.code,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        console.log('Client updated successfully:', id);
        res.status(200).json({ message: "Client updated successfully" });
        break;

      case 'DELETE':
        console.log('Deleting client:', id);
        
        // Delete client and associated payment codes
        const codesToDeleteQuery = query(
          collection(db, "paymentCodes"),
          where("clientId", "==", id)
        );
        const codesToDeleteSnapshot = await getDocs(codesToDeleteQuery);
        
        for (const codeDoc of codesToDeleteSnapshot.docs) {
          await deleteDoc(codeDoc.ref);
        }

        await deleteDoc(doc(db, "clients", id));
        console.log('Client deleted successfully:', id);
        res.status(200).json({ message: "Client deleted successfully" });
        break;

      default:
        console.log('Method not allowed:', req.method);
        res.status(405).json({ 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Error in client details API:', error);
    console.error('Error stack:', error.stack);
    console.error('Request query:', req.query);
    console.error('Request method:', req.method);
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      details: {
        timestamp: new Date().toISOString(),
        method: req.method,
        clientId: id
      }
    });
  }
} 