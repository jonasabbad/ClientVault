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

  const httpServer = createServer(app);
  return httpServer;
}
