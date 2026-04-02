import { pgEnum } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['ADMIN', 'PLAYER'])
export const sessionStatusEnum = pgEnum('session_status', ['IN_PROGRESS', 'COMPLETED'])
