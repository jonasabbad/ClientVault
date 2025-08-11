import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentCodes = pgTable("payment_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  serviceId: varchar("service_id").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Zod schemas
export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentCodeSchema = createInsertSchema(paymentCodes).omit({
  id: true,
  createdAt: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  timestamp: true,
});

// Extended schemas for frontend forms
export const clientFormSchema = insertClientSchema.extend({
  paymentCodes: z.array(z.object({
    serviceId: z.string().min(1, "Service is required"),
    code: z.string().min(1, "Payment code is required"),
  })),
});

// Types
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type PaymentCode = typeof paymentCodes.$inferSelect;
export type InsertPaymentCode = z.infer<typeof insertPaymentCodeSchema>;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;

export type ClientForm = z.infer<typeof clientFormSchema>;

// Extended types for API responses
export type ClientWithCodes = Client & {
  paymentCodes: (PaymentCode & { service: Service })[];
};

export type DashboardStats = {
  totalClients: number;
  totalCodes: number;
  activeServices: number;
  dailySearches: number;
};
