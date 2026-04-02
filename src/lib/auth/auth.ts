import bcrypt from 'bcryptjs'
import * as jose from 'jose'

import { env } from '@/env'

export interface IJWTPayload {
  sub: string
  role: 'ADMIN' | 'PLAYER'
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET)
}

export async function signJWT(payload: IJWTPayload): Promise<string> {
  return new jose.SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyJWT(token: string): Promise<IJWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret())
    return {
      sub: payload.sub as string,
      role: payload['role'] as 'ADMIN' | 'PLAYER',
    }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
