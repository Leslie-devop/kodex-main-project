import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";

// Using the Neon HTTP driver for maximum stability in Vercel's serverless environment
let _db: any = null;

export const db = new Proxy({}, {
  get: (target, prop) => {
    if (!_db) {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl && process.env.USE_MEMORY_STORAGE !== "true") {
        console.error("CRITICAL: DATABASE_URL is missing in production environment!");
        return null; 
      }
      
      try {
        const sql = neon(dbUrl!);
        _db = drizzle(sql, { schema });
        console.log("Database initialized successfully via HTTP");
      } catch (e) {
        console.error("FAILED to initialize database:", e);
        return null;
      }
    }
    return _db ? (_db as any)[prop] : undefined;
  }
}) as any;

// Export an empty pool or a dummy to satisfy any direct imports if they exist
export const pool = null;