import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';

export async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // For Railway deployment, create tables directly from schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id varchar PRIMARY KEY NOT NULL,
        email varchar UNIQUE NOT NULL,
        password varchar,
        first_name varchar,
        last_name varchar,
        profile_image_url varchar,
        stripe_customer_id varchar,
        stripe_subscription_id varchar,
        subscription_status varchar DEFAULT 'free',
        subscription_ends_at timestamp,
        password_reset_token varchar,
        password_reset_expiry timestamp,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id serial PRIMARY KEY,
        user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        content text NOT NULL,
        color varchar DEFAULT '#000000',
        size integer DEFAULT 200,
        format varchar DEFAULT 'png',
        customization jsonb,
        scans integer DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}