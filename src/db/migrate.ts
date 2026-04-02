import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import path from 'path'
import postgres from 'postgres'
import { fileURLToPath } from 'url'

import { env } from '@/env'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const client = postgres(env.DATABASE_URL, { max: 1 })
const db = drizzle(client)

await migrate(db, {
  migrationsFolder: path.join(__dirname, '../../drizzle/migrations'),
})
console.log('Migrations complete.')
await client.end()
