import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    ADMIN_USERNAME: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(8),
    INITIAL_INVITE_CODE: z.string().length(8),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    INITIAL_INVITE_CODE: process.env.INITIAL_INVITE_CODE,
  },
})
