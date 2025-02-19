import { env } from "@/lib/env.mjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import "dotenv/config";
import * as fs from 'fs';
import * as path from 'path';

// Function to split SQL while preserving DO $$ blocks
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inDoBlock = false;

  // Split by semicolon but preserve newlines for error reporting
  const lines = sql.split(/\n/);

  for (const line of lines) {
    if (line.trim().startsWith('DO $$')) {
      inDoBlock = true;
    }

    currentStatement += line + '\n';

    if (inDoBlock && line.trim() === 'END $$;') {
      statements.push(currentStatement.trim());
      currentStatement = '';
      inDoBlock = false;
    } else if (!inDoBlock && line.trim().endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements.filter(stmt => stmt.trim());
}

const runMigrate = async () => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("Migration starting...");
  console.log("Using database URL:", env.DATABASE_URL.replace(/:[^:@]{1,}@/, ':***@'));

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log("Successfully connected to database");
    
    // Check if pgvector is installed
    const vectorExtResult = await client.query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'"
    );
    console.log("pgvector installed:", vectorExtResult.rows.length > 0);
    
    // List all tables before migration
    const tablesBefore = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log("Tables before migration:", tablesBefore.rows.map(r => r.table_name));
    
    // Execute migration SQL directly
    console.log("Executing migration SQL...");
    const migrationPath = path.join(process.cwd(), 'lib/db/migrations/0000_init.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      await client.query('BEGIN');
      const statements = splitSqlStatements(migrationSQL);
      
      for (const stmt of statements) {
        try {
          console.log('Executing statement:', stmt.split('\n')[0] + '...');
          await client.query(stmt);
        } catch (err) {
          console.error('Failed to execute statement:', stmt);
          console.error('Error:', err);
          throw err;
        }
      }
      
      await client.query('COMMIT');
      console.log("Migration SQL executed successfully");
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Migration failed, rolling back");
      throw err;
    }
    
    // Verify tables after migration
    const tablesAfter = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log("Tables after migration:", tablesAfter.rows.map(r => r.table_name));
    
    client.release();
  } catch (err) {
    console.error("Migration process failed:", err);
    throw err;
  } finally {
    await pool.end();
  }
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
