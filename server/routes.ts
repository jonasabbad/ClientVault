import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  insertServiceSchema, 
  insertPaymentCodeSchema,
  insertSearchHistorySchema,
  clientFormSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClientWithCodes(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validation = clientFormSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid client data", 
          errors: validation.error.errors 
        });
      }

      const { paymentCodes, ...clientData } = validation.data;
      
      // Check for duplicate client name
      const existingClient = await storage.getClientByName(clientData.name);
      if (existingClient) {
        return res.status(400).json({ 
          message: `Client with name "${clientData.name}" already exists` 
        });
      }
      
      // Create client
      const client = await storage.createClient(clientData);
      
      // Create payment codes
      for (const codeData of paymentCodes) {
        // Validate unique code
        const isUnique = await storage.validateUniqueCode(codeData.serviceId, codeData.code);
        if (!isUnique) {
          return res.status(400).json({ 
            message: `Payment code ${codeData.code} already exists for this service` 
          });
        }
        
        await storage.createPaymentCode({
          clientId: client.id,
          serviceId: codeData.serviceId,
          code: codeData.code,
        });
      }

      const clientWithCodes = await storage.getClientWithCodes(client.id);
      res.status(201).json(clientWithCodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const validation = clientFormSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid client data", 
          errors: validation.error.errors 
        });
      }

      const { paymentCodes, ...clientData } = validation.data;
      
      // Check for duplicate client name (excluding current client)
      const existingClient = await storage.getClientByName(clientData.name);
      if (existingClient && existingClient.id !== req.params.id) {
        return res.status(400).json({ 
          message: `Client with name "${clientData.name}" already exists` 
        });
      }
      
      // Update client
      const client = await storage.updateClient(req.params.id, clientData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Delete existing payment codes
      const existingCodes = await storage.getPaymentCodesByClient(req.params.id);
      for (const code of existingCodes) {
        await storage.deletePaymentCode(code.id);
      }

      // Create new payment codes
      for (const codeData of paymentCodes) {
        const isUnique = await storage.validateUniqueCode(codeData.serviceId, codeData.code);
        if (!isUnique) {
          return res.status(400).json({ 
            message: `Payment code ${codeData.code} already exists for this service` 
          });
        }
        
        await storage.createPaymentCode({
          clientId: client.id,
          serviceId: codeData.serviceId,
          code: codeData.code,
        });
      }

      const clientWithCodes = await storage.getClientWithCodes(client.id);
      res.json(clientWithCodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Search clients
  app.get("/api/clients/search/:query", async (req, res) => {
    try {
      const query = decodeURIComponent(req.params.query);
      
      // Add to search history
      await storage.addSearchHistory({ query });
      
      const results = await storage.searchClients(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search clients" });
    }
  });

  // Service routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const validation = insertServiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid service data", 
          errors: validation.error.errors 
        });
      }

      const service = await storage.createService(validation.data);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const validation = insertServiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid service data", 
          errors: validation.error.errors 
        });
      }

      const service = await storage.updateService(req.params.id, validation.data);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteService(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Payment codes CRUD
  app.post("/api/payment-codes", async (req, res) => {
    try {
      const validation = insertPaymentCodeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payment code data", 
          errors: validation.error.errors 
        });
      }

      // Check if code is unique for the service
      const isUnique = await storage.validateUniqueCode(validation.data.serviceId, validation.data.code);
      if (!isUnique) {
        return res.status(400).json({ 
          message: `Payment code ${validation.data.code} already exists for this service` 
        });
      }

      const paymentCode = await storage.createPaymentCode(validation.data);
      res.status(201).json(paymentCode);
    } catch (error) {
      console.error("Error creating payment code:", error);
      res.status(500).json({ message: "Failed to create payment code" });
    }
  });

  app.delete("/api/payment-codes/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePaymentCode(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Payment code not found" });
      }
      res.json({ message: "Payment code deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment code" });
    }
  });

  // Payment code validation
  app.post("/api/payment-codes/validate", async (req, res) => {
    try {
      const { serviceId, code, excludeId } = req.body;
      const isUnique = await storage.validateUniqueCode(serviceId, code, excludeId);
      res.json({ isUnique });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate payment code" });
    }
  });

  // Search history
  app.get("/api/search-history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const history = await storage.getSearchHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });

  // Export endpoints
  app.get("/api/export/csv", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      
      // Create CSV content
      const headers = ["Name", "Phone", "Service", "Payment Code"];
      const rows = [headers.join(",")];
      
      for (const client of clients) {
        for (const code of client.paymentCodes) {
          rows.push([
            `"${client.name}"`,
            `"${client.phone}"`,
            `"${code.service.name}"`,
            `"${code.code}"`
          ].join(","));
        }
      }
      
      const csvContent = rows.join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=clients-export.csv");
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ 
        message: "Failed to fetch settings",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      await storage.saveSettings(req.body);
      res.json({ message: "Settings saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // Firebase connection test
  app.post("/api/settings/test-connection", async (req, res) => {
    try {
      // Validate environment variables before attempting connection
      const requiredEnvVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID'
      ];
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Missing required Firebase environment variables",
          details: {
            missingVariables: missingVars,
            configuredVariables: {
              apiKey: !!process.env.VITE_FIREBASE_API_KEY,
              projectId: !!process.env.VITE_FIREBASE_PROJECT_ID,
              appId: !!process.env.VITE_FIREBASE_APP_ID
            }
          }
        });
      }

      const { testFirebaseConnection } = await import("./firebase-config");
      const result = await testFirebaseConnection();
      
      // Log the test result for debugging
      console.log("Firebase connection test result:", result);
      
      res.json(result);
    } catch (error) {
      console.error("Error in test-connection endpoint:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Firebase connection test failed",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
