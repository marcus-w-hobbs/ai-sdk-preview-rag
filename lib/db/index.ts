import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '@/lib/env.mjs'

console.log('Initializing database connection...')
console.log('Using database URL:', env.DATABASE_URL.replace(/:[^:@]{1,}@/, ':***@')) // Hide password

const pool = new Pool({
  connectionString: env.DATABASE_URL,
})

// Test connection on startup
pool.connect().then(client => {
  console.log('Successfully connected to database from app')
  client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    .then(result => {
      console.log('Available tables:', result.rows.map(r => r.table_name))
      client.release()
    })
    .catch(err => {
      console.error('Error checking tables:', err)
      client.release()
    })
}).catch(err => {
  console.error('Database connection error from app:', err)
})

export const db = drizzle(pool)

