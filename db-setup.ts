import { Pool } from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

async function setup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Clearing entire public schema...");
    await pool.query('DROP SCHEMA public CASCADE;');
    await pool.query('CREATE SCHEMA public;');
    
    console.log("Creating vector extension...");
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    console.log("Database completely cleared and vector extension installed.");
  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    await pool.end();
  }
}

setup();
