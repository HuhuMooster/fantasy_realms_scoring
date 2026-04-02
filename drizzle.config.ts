import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  migrations: {
    prefix: 'timestamp',
    table: '_drizzle_migrations',
    schema: 'drizzle',
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
