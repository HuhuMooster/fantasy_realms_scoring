import { createMiddleware } from '@tanstack/react-start'
import { getRequestIP } from '@tanstack/react-start/server'

import { requireUser } from '@/app/server/_requireAuth'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * Rate-limits by the caller's IP address.
 * For unauthenticated endpoints like login and register.
 */
export function ipRateLimit(prefix: string, limit: number, windowMs: number) {
  return createMiddleware().server(async ({ next }) => {
    const ip = getRequestIP() ?? 'unknown'
    await checkRateLimit(`${prefix}:${ip}`, limit, windowMs)
    return next()
  })
}

/**
 * Verifies auth then rate-limits by user ID.
 * Passes the verified user into handler context so requireUser()
 * does not need to be called again in the handler.
 */
export function userRateLimit(prefix: string, limit: number, windowMs: number) {
  return createMiddleware().server(async ({ next }) => {
    const user = await requireUser()
    await checkRateLimit(`${prefix}:${user.sub}`, limit, windowMs)
    return next({ context: { user } })
  })
}
