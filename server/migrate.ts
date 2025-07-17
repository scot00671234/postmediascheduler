import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db } from './db';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Check if migrations directory exists
    const migrationsPath = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      console.log('No migrations directory found. Creating schema using drizzle-kit push...');
      
      // Use drizzle-kit push to create schema
      execSync('npx drizzle-kit push', { stdio: 'inherit' });
      
      console.log('Schema created successfully');
      return;
    }
    
    // Run migrations if they exist
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    
    // Fallback to creating schema directly
    console.log('Falling back to schema creation...');
    try {
      execSync('npx drizzle-kit push', { stdio: 'inherit' });
      console.log('Schema created successfully via fallback');
    } catch (fallbackError) {
      console.error('Fallback schema creation failed:', fallbackError);
      throw fallbackError;
    }
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