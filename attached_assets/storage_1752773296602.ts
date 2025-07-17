import {
  users,
  items,
  type User,
  type UpsertUser,
  type Item,
  type InsertItem,
  type UpdateItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
  updateUserSubscription(userId: string, status: string, endsAt?: Date): Promise<User>;
  updatePasswordResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  
  // Item operations
  createItem(item: InsertItem): Promise<Item>;
  getUserItems(userId: string): Promise<Item[]>;
  getItem(id: number, userId: string): Promise<Item | undefined>;
  updateItem(id: number, userId: string, updates: UpdateItem): Promise<Item | undefined>;
  deleteItem(id: number, userId: string): Promise<boolean>;
  getUserItemCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, status: string, endsAt?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        subscriptionEndsAt: endsAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Item operations
  async createItem(itemData: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values(itemData)
      .returning();
    return item;
  }

  async getUserItems(userId: string): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .where(and(eq(items.userId, userId), eq(items.isActive, true)))
      .orderBy(desc(items.createdAt));
  }

  async getItem(id: number, userId: string): Promise<Item | undefined> {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, id), eq(items.userId, userId), eq(items.isActive, true)));
    return item;
  }

  async updateItem(id: number, userId: string, updates: UpdateItem): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning();
    return item;
  }

  async deleteItem(id: number, userId: string): Promise<boolean> {
    const [result] = await db
      .update(items)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning();
    return !!result;
  }

  async getUserItemCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: items.id })
      .from(items)
      .where(and(eq(items.userId, userId), eq(items.isActive, true)));
    return result.length;
  }

  async updatePasswordResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordResetToken: token, 
        passwordResetExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Hard delete user and cascade delete their QR codes
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
