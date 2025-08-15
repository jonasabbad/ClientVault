// Simplified Vercel serverless function for client operations (without Firebase)
import { randomUUID } from 'crypto';

// Temporary in-memory storage for testing
let clients = [];
let paymentCodes = [];
let services = [];

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/clients - Starting request`);
  
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
        console.log('Getting all clients...');
        // Return clients with payment codes
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

        console.log(`Retrieved ${clientsWithCodes.length} clients successfully`);
        res.status(200).json(clientsWithCodes);
        break;

      case 'POST':
        console.log('Creating new client with data:', req.body);
        
        // Create new client
        const { name, phone, paymentCodes: newPaymentCodes = [] } = req.body;
        
        if (!name || !phone) {
          console.log('Missing required fields:', { name: !!name, phone: !!phone });
          return res.status(400).json({ 
            message: "Name and phone are required" 
          });
        }

        console.log('Checking for duplicate client name...');
        // Check for duplicate client name
        const existingClient = clients.find(c => c.name === name);
        
        if (existingClient) {
          console.log('Duplicate client name found:', name);
          return res.status(400).json({ 
            message: `Client with name "${name}" already exists` 
          });
        }

        console.log('Creating client...');
        // Create client
        const clientId = randomUUID();
        const clientData = {
          id: clientId,
          name,
          phone,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        clients.push(clientData);
        console.log('Client created successfully:', clientId);

        // Create payment codes if provided
        if (newPaymentCodes && newPaymentCodes.length > 0) {
          console.log('Creating payment codes:', newPaymentCodes.length);
          for (const codeData of newPaymentCodes) {
            if (codeData.serviceId && codeData.code) {
              const codeId = randomUUID();
              const paymentCode = {
                id: codeId,
                clientId,
                serviceId: codeData.serviceId,
                code: codeData.code,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              paymentCodes.push(paymentCode);
              console.log('Payment code created:', codeId);
            }
          }
        }

        console.log('Client creation completed successfully');
        res.status(201).json(clientData);
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