// Vercel serverless function for service operations with Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
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
  console.log('Firebase initialized successfully in services API');
} catch (error) {
  console.error('Firebase initialization error in services API:', error);
  throw error;
}

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/services - Starting request`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Validate environment variables
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    return res.status(500).json({
      message: "Missing required Firebase environment variables",
      details: { missingVariables: missingVars }
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        console.log('Getting all services from Firebase...');
        try {
          const servicesSnapshot = await getDocs(collection(db, "services"));
          const services = servicesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Retrieved ${services.length} services successfully from Firebase`);
          res.status(200).json(services);
        } catch (error) {
          console.error('Error in GET services:', error);
          throw error;
        }
        break;

      case 'POST':
        console.log('Creating new service in Firebase with data:', req.body);
        
        // Create new service
        const { name, color, icon } = req.body;
        
        if (!name || !color || !icon) {
          console.log('Missing required fields:', { name: !!name, color: !!color, icon: !!icon });
          return res.status(400).json({ 
            message: "Name, color, and icon are required" 
          });
        }

        // Check for duplicate service name
        const existingServiceQuery = query(
          collection(db, "services"),
          where("name", "==", name)
        );
        const existingServiceSnapshot = await getDocs(existingServiceQuery);
        
        if (!existingServiceSnapshot.empty) {
          console.log('Duplicate service name found:', name);
          return res.status(400).json({ 
            message: `Service with name "${name}" already exists` 
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
        console.log('Service created successfully in Firebase:', serviceId);
        res.status(201).json(serviceData);
        break;

      case 'PUT':
        console.log('Updating service in Firebase with data:', req.body);
        
        const { id, ...updateData } = req.body;
        
        if (!id) {
          return res.status(400).json({ 
            message: "Service ID is required" 
          });
        }

        const serviceRef = doc(db, "services", id);
        const serviceDoc = await getDoc(serviceRef);
        
        if (!serviceDoc.exists()) {
          return res.status(404).json({ 
            message: "Service not found" 
          });
        }

        await updateDoc(serviceRef, {
          ...updateData,
          updatedAt: new Date()
        });

        const updatedServiceDoc = await getDoc(serviceRef);
        const updatedService = { id: updatedServiceDoc.id, ...updatedServiceDoc.data() };
        
        console.log('Service updated successfully in Firebase:', id);
        res.status(200).json(updatedService);
        break;

      case 'DELETE':
        console.log('Deleting service from Firebase:', req.query.id);
        
        const deleteId = req.query.id;
        
        if (!deleteId) {
          return res.status(400).json({ 
            message: "Service ID is required" 
          });
        }

        // Check if service has associated payment codes
        const paymentCodesQuery = query(
          collection(db, "paymentCodes"),
          where("serviceId", "==", deleteId)
        );
        const paymentCodesSnapshot = await getDocs(paymentCodesQuery);
        
        if (!paymentCodesSnapshot.empty) {
          return res.status(400).json({ 
            message: "Cannot delete service with existing payment codes" 
          });
        }

        await deleteDoc(doc(db, "services", deleteId));
        console.log('Service deleted successfully from Firebase:', deleteId);
        res.status(200).json({ message: "Service deleted successfully" });
        break;

      default:
        res.status(405).json({ 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Error in services API:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Request method:', req.method);
    
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