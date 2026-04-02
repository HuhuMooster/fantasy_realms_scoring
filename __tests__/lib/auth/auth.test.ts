// @vitest-environment node
import * as jose from 'jose'
import { describe, expect, it, vi } from 'vitest'

import { comparePassword, hashPassword, signJWT, verifyJWT } from '@/lib/auth/auth'

// Mock @/env before auth.ts (which imports it) is resolved
vi.mock('@/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'adminpass',
    INITIAL_INVITE_CODE: 'TESTCODE',
  },
}))

describe('hashPassword / comparePassword', () => {
  it('round-trips correctly', async () => {
    const hash = await hashPassword('MySecretPass1')
    expect(await comparePassword('MySecretPass1', hash)).toBe(true)
  })

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correct')
    expect(await comparePassword('wrong', hash)).toBe(false)
  })

  it('hash is not equal to plaintext', async () => {
    const plain = 'plaintext123'
    const hash = await hashPassword(plain)
    expect(hash).not.toBe(plain)
  })
})

describe('signJWT / verifyJWT', () => {
  it('round-trips a PLAYER token', async () => {
    const token = await signJWT({ sub: 'user-1', role: 'PLAYER' })
    const payload = await verifyJWT(token)
    expect(payload).toEqual({ sub: 'user-1', role: 'PLAYER' })
  })

  it('round-trips an ADMIN token', async () => {
    const token = await signJWT({ sub: 'admin-1', role: 'ADMIN' })
    const payload = await verifyJWT(token)
    expect(payload?.role).toBe('ADMIN')
  })

  it('returns null for an invalid token string', async () => {
    expect(await verifyJWT('not.a.valid.token')).toBeNull()
  })

  it('returns null for an empty string', async () => {
    expect(await verifyJWT('')).toBeNull()
  })

  it('returns null for an expired token', async () => {
    const secret = new TextEncoder().encode('test-secret-at-least-32-chars-long!!')
    const expired = await new jose.SignJWT({ role: 'PLAYER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('u1')
      .setIssuedAt()
      .setExpirationTime('-1s')
      .sign(secret)
    expect(await verifyJWT(expired)).toBeNull()
  })
})
