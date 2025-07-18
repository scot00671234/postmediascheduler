import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Try drizzle-kit push first (most reliable for Railway)
    try {
      console.log('Creating schema using drizzle-kit push...');
      execSync('npx drizzle-kit push --force', { stdio: 'inherit' });
      console.log('Schema created successfully with drizzle-kit');
      return;
    } catch (drizzleError) {
      console.log('Drizzle-kit push failed, trying direct table creation...');
      
      // Import and use direct table creation as fallback
      const { createTablesDirectly } = await import('./createTables');
      const success = await createTablesDirectly();
      
      if (success) {
        console.log('Schema created successfully via direct SQL');
        return;
      } else {
        throw new Error('All migration methods failed');
      }
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
    
    // Check if platforms already exist
    const { db } = await import('./db');
    const { platforms } = await import('../shared/schema');
    
    const existingPlatforms = await db.select().from(platforms);
    
    if (existingPlatforms.length === 0) {
      console.log('Creating default platforms...');
      
      await db.insert(platforms).values([
        {
          name: 'twitter',
          displayName: 'X (Twitter)',
          icon: 'SiX',
          color: '#000000',
          isActive: true,
        },
        {
          name: 'linkedin',
          displayName: 'LinkedIn',
          icon: 'SiLinkedin',
          color: '#0077B5',
          isActive: true,
        },
      ]);
      
      console.log('Default platforms created successfully');
    } else {
      console.log('Platforms already exist, skipping initialization');
    }
    
    console.log('Default data initialization completed');
  } catch (error) {
    console.error('Error initializing default data:', error);
    // Don't throw here - app should still start even if default data fails
  }
}