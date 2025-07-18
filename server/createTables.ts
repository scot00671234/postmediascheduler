import { db } from './db';
import { users, platforms, userPlatformConnections, posts, mediaFiles, jobQueue } from '../shared/schema';

export async function createTablesDirectly() {
  try {
    console.log('Creating database tables directly...');
    
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" varchar(50) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password" varchar(255) NOT NULL,
        "first_name" varchar(100),
        "last_name" varchar(100),
        "is_email_verified" boolean DEFAULT false NOT NULL,
        "email_verification_token" varchar(255),
        "email_verification_expires" timestamp,
        "password_reset_token" varchar(255),
        "password_reset_expires" timestamp,
        "subscription_status" varchar(20) DEFAULT 'free' NOT NULL,
        "subscription_ends_at" timestamp,
        "stripe_customer_id" varchar(255),
        "stripe_subscription_id" varchar(255),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_username_unique" UNIQUE("username"),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );
    `);

    // Create platforms table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "platforms" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(50) NOT NULL,
        "display_name" varchar(100) NOT NULL,
        "icon" varchar(100),
        "color" varchar(7),
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "platforms_name_unique" UNIQUE("name")
      );
    `);

    // Create user_platform_connections table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "user_platform_connections" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "platform_id" integer NOT NULL,
        "platform_user_id" varchar(255),
        "username" varchar(255),
        "access_token" text NOT NULL,
        "refresh_token" text,
        "token_expires_at" timestamp,
        "scopes" text[],
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "user_platform_connections_user_id_platform_id_unique" UNIQUE("user_id","platform_id")
      );
    `);

    // Create posts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "posts" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "content" text NOT NULL,
        "media_file_ids" integer[],
        "platform_ids" integer[] NOT NULL,
        "scheduled_for" timestamp,
        "status" varchar(20) DEFAULT 'draft' NOT NULL,
        "published_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create media_files table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "media_files" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "filename" varchar(255) NOT NULL,
        "original_filename" varchar(255) NOT NULL,
        "file_path" varchar(500) NOT NULL,
        "file_size" integer NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "width" integer,
        "height" integer,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create job_queue table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "job_queue" (
        "id" serial PRIMARY KEY NOT NULL,
        "job_type" varchar(50) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "attempts" integer DEFAULT 0 NOT NULL,
        "max_attempts" integer DEFAULT 3 NOT NULL,
        "scheduled_for" timestamp DEFAULT now() NOT NULL,
        "processed_at" timestamp,
        "error_message" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Add foreign key constraints
    await db.execute(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'user_platform_connections_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "user_platform_connections" ADD CONSTRAINT "user_platform_connections_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await db.execute(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'user_platform_connections_platform_id_platforms_id_fk'
        ) THEN
          ALTER TABLE "user_platform_connections" ADD CONSTRAINT "user_platform_connections_platform_id_platforms_id_fk" 
          FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await db.execute(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'posts_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await db.execute(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'media_files_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "media_files" ADD CONSTRAINT "media_files_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    console.log('Database tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}