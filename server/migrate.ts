import { db } from './db.js';
import { createAllTables, insertDefaultData } from './schema-setup.js';

export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // In production, always use self-contained schema setup
    if (process.env.NODE_ENV === 'production') {
      console.log('Production environment detected, using standalone schema setup...');
      const success = await createAllTables();
      if (!success) {
        throw new Error('Failed to create database schema');
      }
      return;
    }
    
    // In development, try drizzle-kit push first
    try {
      console.log('Creating schema using drizzle-kit push...');
      const { execSync } = await import('child_process');
      execSync('npx drizzle-kit push --force', { stdio: 'inherit' });
      console.log('Schema created successfully with drizzle-kit');
      return;
    } catch (drizzleError) {
      console.log('Drizzle-kit push failed, trying standalone schema setup...');
      const success = await createAllTables();
      if (!success) {
        throw new Error('All migration methods failed');
      }
      return;
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Initialize default data
export async function initializeDefaultData() {
  try {
    console.log('Initializing default data...');
    await insertDefaultData();
    console.log('Default data initialization completed');
  } catch (error) {
    console.error('Error initializing default data:', error);
    console.log('Continuing despite default data error...');
  }
}