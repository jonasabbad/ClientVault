// Vercel serverless function for client operations with Firebase
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
let app, db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/clients - Starting request`);
  console.log('Request query:', req.query);
  console.log('Request method:', req.method);
  
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
        const { id } = req.query;
        
        console.log('GET request - Query parameters:', req.query);
        console.log('GET request - ID parameter:', id);
        console.log('GET request - ID type:', typeof id);
        console.log('GET request - ID truthy check:', !!id);
        
        if (id) {
          // Get specific client by ID
          console.log('Getting specific client by ID:', id);
          
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
        } else {
          // Get all clients
          console.log('Getting all clients from Firebase...');
          try {
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

            console.log(`Retrieved ${clientsWithCodes.length} clients successfully from Firebase`);
            res.status(200).json(clientsWithCodes);
          } catch (error) {
            console.error('Error in GET clients:', error);
            throw error;
          }
        }
        break;

      case 'POST':
        console.log('Creating new client in Firebase with data:', req.body);
        
        // Create new client
        const { name, phone, paymentCodes: newPaymentCodes = [] } = req.body;
        
        if (!name || !phone) {
          console.log('Missing required fields:', { name: !!name, phone: !!phone });
          return res.status(400).json({ 
            message: "Name and phone are required" 
          });
        }

        console.log('Checking for duplicate client name in Firebase...');
        // Check for duplicate client name
        const existingClientQuery = query(
          collection(db, "clients"),
          where("name", "==", name),
          limit(1)
        );
        const existingClientSnapshot = await getDocs(existingClientQuery);
        
        if (!existingClientSnapshot.empty) {
          console.log('Duplicate client name found:', name);
          return res.status(400).json({ 
            message: `Client with name "${name}" already exists` 
          });
        }

        console.log('Creating client in Firebase...');
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
        console.log('Client created successfully in Firebase:', clientId);

        // Create payment codes if provided
        if (newPaymentCodes && newPaymentCodes.length > 0) {
          console.log('Creating payment codes in Firebase:', newPaymentCodes.length);
          for (const codeData of newPaymentCodes) {
            if (codeData.serviceId && codeData.code) {
              const codeId = randomUUID();
              await setDoc(doc(db, "paymentCodes", codeId), {
                id: codeId,
                clientId,
                serviceId: codeData.serviceId,
                code: codeData.code,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              console.log('Payment code created in Firebase:', codeId);
            }
          }
        }

        console.log('Client creation completed successfully in Firebase');
        res.status(201).json(clientData);
        break;

      case 'PUT':
        const { id: updateId, ...updateData } = req.body;
        
        if (!updateId) {
          return res.status(400).json({ 
            message: "Client ID is required" 
          });
        }

        console.log('Updating client in Firebase:', updateId);
        
        // Update client
        const { name: updateName, phone: updatePhone, paymentCodes: updatePaymentCodes = [] } = updateData;
        
        if (!updateName || !updatePhone) {
          return res.status(400).json({ 
            message: "Name and phone are required" 
          });
        }

        // Update client data
        await updateDoc(doc(db, "clients", updateId), {
          name: updateName,
          phone: updatePhone,
          updatedAt: new Date()
        });

        // Delete existing payment codes
        const existingCodesQuery = query(
          collection(db, "paymentCodes"),
          where("clientId", "==", updateId)
        );
        const existingCodesSnapshot = await getDocs(existingCodesQuery);
        
        for (const codeDoc of existingCodesSnapshot.docs) {
          await deleteDoc(codeDoc.ref);
        }

        // Create new payment codes
        for (const codeData of updatePaymentCodes) {
          const codeId = randomUUID();
          await setDoc(doc(db, "paymentCodes", codeId), {
            id: codeId,
            clientId: updateId,
            serviceId: codeData.serviceId,
            code: codeData.code,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        console.log('Client updated successfully in Firebase:', updateId);
        res.status(200).json({ message: "Client updated successfully" });
        break;

      case 'DELETE':
        const { id: deleteId } = req.query;
        
        if (!deleteId) {
          return res.status(400).json({ 
            message: "Client ID is required" 
          });
        }

        console.log('Deleting client from Firebase:', deleteId);
        
        // Delete client and associated payment codes
        const codesToDeleteQuery = query(
          collection(db, "paymentCodes"),
          where("clientId", "==", deleteId)
        );
        const codesToDeleteSnapshot = await getDocs(codesToDeleteQuery);
        
        for (const codeDoc of codesToDeleteSnapshot.docs) {
          await deleteDoc(codeDoc.ref);
        }

        await deleteDoc(doc(db, "clients", deleteId));
        console.log('Client deleted successfully from Firebase:', deleteId);
        res.status(200).json({ message: "Client deleted successfully" });
        break;

      default:
        res.status(405).json({ 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Error in clients API:', error);
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