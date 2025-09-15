import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  setDoc,
  limit 
} from "firebase/firestore";

// Helper function to convert Firestore timestamps to JavaScript Date objects
function convertTimestamps(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'object' && data.constructor === Object) {
    // Check if this is a Firestore timestamp
    if (data.type === 'firestore/timestamp/1.0' && typeof data.seconds === 'number') {
      return new Date(data.seconds * 1000 + (data.nanoseconds || 0) / 1000000);
    }
    
    // Recursively convert object properties
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertTimestamps(value);
    }
    return converted;
  }
  
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  
  return data;
}

// Helper function to serialize data with proper timestamp conversion for JSON response
function serializeForResponse(data: any): any {
  const converted = convertTimestamps(data);
  return JSON.parse(JSON.stringify(converted, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }));
}
import { db } from "./firebase-config";
import type { 
  Client, 
  Service, 
  PaymentCode, 
  ClientWithCodes, 
  InsertClient, 
  InsertService, 
  InsertPaymentCode,
  SearchHistory,
  InsertSearchHistory,
  DashboardStats
} from "../shared/schema";
import type { IStorage } from "./storage";
import { randomUUID } from "crypto";

export class FirebaseStorage implements IStorage {
  
  // Client operations
  async createClient(data: InsertClient): Promise<Client> {
    try {
      const id = randomUUID();
      const clientData = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, "clients", id), clientData);
      
      return clientData;
    } catch (error) {
      console.error("Error creating client:", error);
      throw new Error("Failed to create client in Firebase");
    }
  }

  async getAllClients(): Promise<ClientWithCodes[]> {
    try {
      const [clientsSnapshot, paymentCodesSnapshot, servicesSnapshot] = await Promise.all([
        getDocs(collection(db, "clients")),
        getDocs(collection(db, "paymentCodes")),
        getDocs(collection(db, "services"))
      ]);

      const clients = clientsSnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() })
      ) as Client[];

      const paymentCodes = paymentCodesSnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() })
      ) as PaymentCode[];

      const services = servicesSnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() })
      ) as Service[];

      return clients.map(client => ({
        ...client,
        paymentCodes: paymentCodes.filter(code => code.clientId === client.id).map(code => {
          const service = services.find(s => s.id === code.serviceId);
          return {
            ...code,
            service: service || { id: '', name: 'Unknown Service', color: '#gray', icon: '', createdAt: null }
          };
        })
      }));
    } catch (error) {
      console.error("Error getting clients:", error);
      throw new Error("Failed to get clients from Firebase");
    }
  }

  async getClient(id: string): Promise<Client | undefined> {
    try {
      const clientDoc = await getDoc(doc(db, "clients", id));
      
      if (!clientDoc.exists()) {
        return undefined;
      }

      return { id: clientDoc.id, ...clientDoc.data() } as Client;
    } catch (error) {
      console.error("Error getting client:", error);
      throw new Error("Failed to get client from Firebase");
    }
  }

  async getClientByName(name: string): Promise<Client | undefined> {
    try {
      const clientsQuery = query(
        collection(db, "clients"),
        where("name", "==", name),
        limit(1)
      );
      const snapshot = await getDocs(clientsQuery);
      
      if (snapshot.empty) {
        return undefined;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Client;
    } catch (error) {
      console.error("Error getting client by name:", error);
      throw new Error("Failed to get client by name from Firebase");
    }
  }

  async getClientWithCodes(id: string): Promise<ClientWithCodes | undefined> {
    try {
      const clientDoc = await getDoc(doc(db, "clients", id));
      
      if (!clientDoc.exists()) {
        return undefined;
      }

      const client = convertTimestamps({ id: clientDoc.id, ...clientDoc.data() }) as Client;
      
      const [paymentCodesSnapshot, servicesSnapshot] = await Promise.all([
        getDocs(query(collection(db, "paymentCodes"), where("clientId", "==", id))),
        getDocs(collection(db, "services"))
      ]);
      
      const services = servicesSnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() })
      ) as Service[];

      const paymentCodes = paymentCodesSnapshot.docs.map(doc => {
        const codeData = convertTimestamps({ id: doc.id, ...doc.data() }) as PaymentCode;
        const service = services.find(s => s.id === codeData.serviceId);
        return {
          ...codeData,
          service: service || { id: '', name: 'Unknown Service', color: '#gray', icon: '', createdAt: null }
        };
      });

      return {
        ...client,
        paymentCodes
      };
    } catch (error) {
      console.error("Error getting client by ID:", error);
      throw new Error("Failed to get client from Firebase");
    }
  }

  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    try {
      const clientRef = doc(db, "clients", id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(clientRef, updateData);
      
      const updatedDoc = await getDoc(clientRef);
      if (!updatedDoc.exists()) {
        return undefined;
      }
      return { id: updatedDoc.id, ...updatedDoc.data() } as Client;
    } catch (error) {
      console.error("Error updating client:", error);
      throw new Error("Failed to update client in Firebase");
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      // Delete associated payment codes first
      const paymentCodesQuery = query(
        collection(db, "paymentCodes"),
        where("clientId", "==", id)
      );
      const paymentCodesSnapshot = await getDocs(paymentCodesQuery);
      
      const deletePromises = paymentCodesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      
      // Delete the client
      await deleteDoc(doc(db, "clients", id));
      return true;
    } catch (error) {
      console.error("Error deleting client:", error);
      return false;
    }
  }

  async searchClients(query: string): Promise<ClientWithCodes[]> {
    try {
      const clients = await this.getAllClients();
      const searchTerm = query.toLowerCase();
      
      return clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm) ||
        client.phone.includes(searchTerm) ||
        client.paymentCodes?.some(code => 
          code.code.toLowerCase().includes(searchTerm)
        )
      );
    } catch (error) {
      console.error("Error searching clients:", error);
      throw new Error("Failed to search clients in Firebase");
    }
  }

  // Service operations  
  async createService(data: InsertService): Promise<Service> {
    try {
      const id = randomUUID();
      const serviceData = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, "services", id), serviceData);
      
      return serviceData;
    } catch (error) {
      console.error("Error creating service:", error);
      throw new Error("Failed to create service in Firebase");
    }
  }

  async getService(id: string): Promise<Service | undefined> {
    try {
      const serviceDoc = await getDoc(doc(db, "services", id));
      
      if (!serviceDoc.exists()) {
        return undefined;
      }

      return { id: serviceDoc.id, ...serviceDoc.data() } as Service;
    } catch (error) {
      console.error("Error getting service:", error);
      throw new Error("Failed to get service from Firebase");
    }
  }

  async getAllServices(): Promise<Service[]> {
    try {
      const snapshot = await getDocs(collection(db, "services"));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
    } catch (error) {
      console.error("Error getting services:", error);
      throw new Error("Failed to get services from Firebase");
    }
  }

  async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
    try {
      const serviceRef = doc(db, "services", id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(serviceRef, updateData);
      
      const updatedDoc = await getDoc(serviceRef);
      if (!updatedDoc.exists()) {
        return undefined;
      }
      return { id: updatedDoc.id, ...updatedDoc.data() } as Service;
    } catch (error) {
      console.error("Error updating service:", error);
      throw new Error("Failed to update service in Firebase");
    }
  }

  async deleteService(id: string): Promise<boolean> {
    try {
      // Check if service has associated payment codes
      const paymentCodesQuery = query(
        collection(db, "paymentCodes"),
        where("serviceId", "==", id)
      );
      const paymentCodesSnapshot = await getDocs(paymentCodesQuery);
      
      if (!paymentCodesSnapshot.empty) {
        throw new Error("Cannot delete service with existing payment codes");
      }
      
      await deleteDoc(doc(db, "services", id));
      return true;
    } catch (error) {
      console.error("Error deleting service:", error);
      return false;
    }
  }

  // Payment code operations
  async getPaymentCodesByClient(clientId: string): Promise<(PaymentCode & { service: Service })[]> {
    try {
      const paymentCodesQuery = query(
        collection(db, "paymentCodes"),
        where("clientId", "==", clientId)
      );
      const paymentCodesSnapshot = await getDocs(paymentCodesQuery);
      const servicesSnapshot = await getDocs(collection(db, "services"));
      
      const services = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      return paymentCodesSnapshot.docs.map(doc => {
        const paymentCode = { id: doc.id, ...doc.data() } as PaymentCode;
        const service = services.find(s => s.id === paymentCode.serviceId) || {
          id: '', name: '', color: '', icon: '', createdAt: null
        };
        return { ...paymentCode, service };
      });
    } catch (error) {
      console.error("Error getting payment codes by client:", error);
      throw new Error("Failed to get payment codes from Firebase");
    }
  }

  async validateUniqueCode(serviceId: string, code: string, excludeId?: string): Promise<boolean> {
    try {
      const duplicateQuery = query(
        collection(db, "paymentCodes"),
        where("serviceId", "==", serviceId),
        where("code", "==", code)
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);
      
      if (excludeId) {
        return duplicateSnapshot.docs.every(doc => doc.id === excludeId);
      }
      
      return duplicateSnapshot.empty;
    } catch (error) {
      console.error("Error validating unique code:", error);
      return false;
    }
  }

  async createPaymentCode(data: InsertPaymentCode): Promise<PaymentCode> {
    try {
      const id = randomUUID();
      const paymentCodeData = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, "paymentCodes", id), paymentCodeData);
      
      return paymentCodeData;
    } catch (error) {
      console.error("Error creating payment code:", error);
      throw new Error("Failed to create payment code in Firebase");
    }
  }

  async updatePaymentCode(id: string, data: Partial<InsertPaymentCode>): Promise<PaymentCode | undefined> {
    try {
      const paymentCodeRef = doc(db, "paymentCodes", id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(paymentCodeRef, updateData);
      
      const updatedDoc = await getDoc(paymentCodeRef);
      if (!updatedDoc.exists()) {
        return undefined;
      }
      return { id: updatedDoc.id, ...updatedDoc.data() } as PaymentCode;
    } catch (error) {
      console.error("Error updating payment code:", error);
      throw new Error("Failed to update payment code in Firebase");
    }
  }

  async deletePaymentCode(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "paymentCodes", id));
      return true;
    } catch (error) {
      console.error("Error deleting payment code:", error);
      return false;
    }
  }

  // Search history  
  async addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory> {
    try {
      const id = randomUUID();
      const searchData = {
        ...search,
        id,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, "searchHistory", id), searchData);
      
      return searchData;
    } catch (error) {
      console.error("Error adding search history:", error);
      throw new Error("Failed to add search history to Firebase");
    }
  }

  async getSearchHistory(limit: number = 10): Promise<SearchHistory[]> {
    try {
      const searchQuery = query(
        collection(db, "searchHistory"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(searchQuery);
      
      return snapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SearchHistory[];
    } catch (error) {
      console.error("Error getting search history:", error);
      throw new Error("Failed to get search history from Firebase");
    }
  }

  // Settings operations
  async saveSettings(settings: Record<string, any>): Promise<void> {
    try {
      const settingsRef = doc(db, "settings", "app");
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving settings:", error);
      throw new Error("Failed to save settings to Firebase");
    }
  }

  async getSettings(): Promise<Record<string, any>> {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "app"));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        // Remove Firebase timestamps for client consumption
        const { createdAt, updatedAt, ...settings } = data;
        return settings;
      }
      
      return {};
    } catch (error) {
      console.error("Error getting settings:", error);
      throw new Error("Failed to get settings from Firebase");
    }
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [clientsSnapshot, paymentCodesSnapshot, servicesSnapshot, searchSnapshot] = await Promise.all([
        getDocs(collection(db, "clients")),
        getDocs(collection(db, "paymentCodes")),
        getDocs(collection(db, "services")),
        getDocs(collection(db, "searchHistory"))
      ]);

      // Count searches from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailySearches = searchSnapshot.docs.filter(doc => {
        const searchDate = doc.data().createdAt?.toDate();
        return searchDate && searchDate >= today;
      }).length;

      return {
        totalClients: clientsSnapshot.size,
        totalCodes: paymentCodesSnapshot.size,
        activeServices: servicesSnapshot.size,
        dailySearches
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw new Error("Failed to get dashboard stats from Firebase");
    }
  }
}