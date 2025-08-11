import { 
  type Client, 
  type InsertClient, 
  type Service, 
  type InsertService,
  type PaymentCode,
  type InsertPaymentCode,
  type SearchHistory,
  type InsertSearchHistory,
  type ClientWithCodes,
  type DashboardStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Client operations
  getClient(id: string): Promise<Client | undefined>;
  getClientWithCodes(id: string): Promise<ClientWithCodes | undefined>;
  getAllClients(): Promise<ClientWithCodes[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  searchClients(query: string): Promise<ClientWithCodes[]>;

  // Service operations
  getAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

  // Payment code operations
  getPaymentCodesByClient(clientId: string): Promise<(PaymentCode & { service: Service })[]>;
  createPaymentCode(paymentCode: InsertPaymentCode): Promise<PaymentCode>;
  updatePaymentCode(id: string, paymentCode: Partial<InsertPaymentCode>): Promise<PaymentCode | undefined>;
  deletePaymentCode(id: string): Promise<boolean>;
  validateUniqueCode(serviceId: string, code: string, excludeId?: string): Promise<boolean>;

  // Search history
  addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistory(limit?: number): Promise<SearchHistory[]>;

  // Dashboard stats
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client>;
  private services: Map<string, Service>;
  private paymentCodes: Map<string, PaymentCode>;
  private searchHistory: SearchHistory[];

  constructor() {
    this.clients = new Map();
    this.services = new Map();
    this.paymentCodes = new Map();
    this.searchHistory = [];

    // Initialize default services
    this.initializeDefaultServices();
  }

  private initializeDefaultServices() {
    const defaultServices = [
      { name: "Inwi", color: "#8E24AA", icon: "smartphone" },
      { name: "Orange", color: "#FF5722", icon: "smartphone" },
      { name: "Maroc Telecom", color: "#2196F3", icon: "smartphone" },
      { name: "Water", color: "#00BCD4", icon: "droplet" },
      { name: "Gas", color: "#FFC107", icon: "flame" },
      { name: "Electricity", color: "#4CAF50", icon: "zap" },
      { name: "Internet", color: "#9C27B0", icon: "wifi" },
      { name: "TV", color: "#607D8B", icon: "tv" },
    ];

    defaultServices.forEach(service => {
      const id = randomUUID();
      this.services.set(id, {
        id,
        ...service,
        createdAt: new Date(),
      });
    });
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientWithCodes(id: string): Promise<ClientWithCodes | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const paymentCodes = await this.getPaymentCodesByClient(id);
    return { ...client, paymentCodes };
  }

  async getAllClients(): Promise<ClientWithCodes[]> {
    const clients = Array.from(this.clients.values());
    const clientsWithCodes = await Promise.all(
      clients.map(async (client) => {
        const paymentCodes = await this.getPaymentCodesByClient(client.id);
        return { ...client, paymentCodes };
      })
    );
    return clientsWithCodes.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const now = new Date();
    const client: Client = { 
      ...insertClient, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const updatedClient = { 
      ...client, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    // Delete associated payment codes
    const codes = Array.from(this.paymentCodes.values()).filter(code => code.clientId === id);
    codes.forEach(code => this.paymentCodes.delete(code.id));
    
    return this.clients.delete(id);
  }

  async searchClients(query: string): Promise<ClientWithCodes[]> {
    const lowerQuery = query.toLowerCase();
    const allClients = await this.getAllClients();
    
    return allClients.filter(client => {
      // Search in client name
      if (client.name.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in phone number
      if (client.phone.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in payment codes
      return client.paymentCodes.some(code => 
        code.code.toLowerCase().includes(lowerQuery) ||
        code.service.name.toLowerCase().includes(lowerQuery)
      );
    });
  }

  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = { 
      ...insertService, 
      id, 
      createdAt: new Date() 
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;

    const updatedService = { ...service, ...updateData };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: string): Promise<boolean> {
    // Delete associated payment codes
    const codes = Array.from(this.paymentCodes.values()).filter(code => code.serviceId === id);
    codes.forEach(code => this.paymentCodes.delete(code.id));
    
    return this.services.delete(id);
  }

  async getPaymentCodesByClient(clientId: string): Promise<(PaymentCode & { service: Service })[]> {
    const codes = Array.from(this.paymentCodes.values()).filter(code => code.clientId === clientId);
    return codes.map(code => {
      const service = this.services.get(code.serviceId);
      return { ...code, service: service! };
    }).filter(code => code.service);
  }

  async createPaymentCode(insertPaymentCode: InsertPaymentCode): Promise<PaymentCode> {
    const id = randomUUID();
    const paymentCode: PaymentCode = { 
      ...insertPaymentCode, 
      id, 
      createdAt: new Date() 
    };
    this.paymentCodes.set(id, paymentCode);
    return paymentCode;
  }

  async updatePaymentCode(id: string, updateData: Partial<InsertPaymentCode>): Promise<PaymentCode | undefined> {
    const paymentCode = this.paymentCodes.get(id);
    if (!paymentCode) return undefined;

    const updatedCode = { ...paymentCode, ...updateData };
    this.paymentCodes.set(id, updatedCode);
    return updatedCode;
  }

  async deletePaymentCode(id: string): Promise<boolean> {
    return this.paymentCodes.delete(id);
  }

  async validateUniqueCode(serviceId: string, code: string, excludeId?: string): Promise<boolean> {
    const existingCode = Array.from(this.paymentCodes.values()).find(pc => 
      pc.serviceId === serviceId && 
      pc.code === code && 
      pc.id !== excludeId
    );
    return !existingCode;
  }

  async addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory> {
    const id = randomUUID();
    const searchEntry: SearchHistory = { 
      ...search, 
      id, 
      timestamp: new Date() 
    };
    this.searchHistory.unshift(searchEntry);
    
    // Keep only last 100 searches
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(0, 100);
    }
    
    return searchEntry;
  }

  async getSearchHistory(limit = 10): Promise<SearchHistory[]> {
    return this.searchHistory.slice(0, limit);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailySearches = this.searchHistory.filter(search => 
      search.timestamp && search.timestamp >= today
    ).length;

    return {
      totalClients: this.clients.size,
      totalCodes: this.paymentCodes.size,
      activeServices: this.services.size,
      dailySearches,
    };
  }
}

export const storage = new MemStorage();
