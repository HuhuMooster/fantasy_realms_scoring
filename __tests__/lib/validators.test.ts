import { describe, expect, it } from 'vitest'

import {
  actionConfigSchema,
  changePasswordSchema,
  createSessionSchema,
  loginSchema,
  registerSchema,
  submitHandSchema,
} from '@/lib/validators'

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  const valid = { username: 'abc', password: '12345678' }

  it('accepts valid input', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects username shorter than 3 chars', () => {
    expect(loginSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(false)
  })

  it('rejects username longer than 32 chars', () => {
    expect(loginSchema.safeParse({ ...valid, username: 'a'.repeat(33) }).success).toBe(
      false
    )
  })

  it('rejects password shorter than 8 chars', () => {
    expect(loginSchema.safeParse({ ...valid, password: '1234567' }).success).toBe(false)
  })

  it('rejects password longer than 128 chars', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'x'.repeat(129) }).success).toBe(
      false
    )
  })
})

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe('registerSchema', () => {
  const valid = { username: 'abc_123', password: '12345678', inviteCode: 'ABCD1234' }

  it('accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects username with special characters', () => {
    expect(registerSchema.safeParse({ ...valid, username: 'hello!' }).success).toBe(
      false
    )
  })

  it('rejects username with spaces', () => {
    expect(
      registerSchema.safeParse({ ...valid, username: 'hello world' }).success
    ).toBe(false)
  })

  it('rejects inviteCode shorter than 8 chars', () => {
    expect(registerSchema.safeParse({ ...valid, inviteCode: 'ABCD123' }).success).toBe(
      false
    )
  })

  it('rejects inviteCode longer than 8 chars', () => {
    expect(
      registerSchema.safeParse({ ...valid, inviteCode: 'ABCD12345' }).success
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createSessionSchema
// ---------------------------------------------------------------------------
describe('createSessionSchema', () => {
  const valid = { name: 'Game', editionIds: ['ed1'], nicknames: ['Alice', 'Bob'] }

  it('accepts valid input', () => {
    expect(createSessionSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(createSessionSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects empty editionIds array', () => {
    expect(createSessionSchema.safeParse({ ...valid, editionIds: [] }).success).toBe(
      false
    )
  })

  it('rejects empty nicknames array', () => {
    expect(createSessionSchema.safeParse({ ...valid, nicknames: [] }).success).toBe(
      false
    )
  })

  it('rejects nicknames array with more than 10 items', () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => `Player${i + 1}`)
    expect(
      createSessionSchema.safeParse({ ...valid, nicknames: tooMany }).success
    ).toBe(false)
  })

  it('rejects nickname longer than 32 chars', () => {
    expect(
      createSessionSchema.safeParse({ ...valid, nicknames: ['a'.repeat(33)] }).success
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// changePasswordSchema
// ---------------------------------------------------------------------------
describe('changePasswordSchema', () => {
  const valid = { currentPassword: 'anyvalue', newPassword: '12345678' }

  it('accepts valid input', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty currentPassword', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, currentPassword: '' }).success
    ).toBe(false)
  })

  it('rejects newPassword shorter than 8 chars', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: '1234567' }).success
    ).toBe(false)
  })

  it('rejects newPassword longer than 128 chars', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: 'x'.repeat(129) }).success
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// actionConfigSchema
// ---------------------------------------------------------------------------
describe('actionConfigSchema', () => {
  it('accepts impersonate_deck', () => {
    expect(
      actionConfigSchema.safeParse({ type: 'impersonate_deck', targetCardId: 'c1' })
        .success
    ).toBe(true)
  })

  it('accepts impersonate_hand', () => {
    expect(
      actionConfigSchema.safeParse({ type: 'impersonate_hand', targetCardId: 'c1' })
        .success
    ).toBe(true)
  })

  it('accepts book_of_changes with newSuit', () => {
    expect(
      actionConfigSchema.safeParse({
        type: 'book_of_changes',
        targetCardId: 'c1',
        newSuit: 'flame',
      }).success
    ).toBe(true)
  })

  it('rejects book_of_changes without newSuit', () => {
    expect(
      actionConfigSchema.safeParse({ type: 'book_of_changes', targetCardId: 'c1' })
        .success
    ).toBe(false)
  })

  it('accepts island', () => {
    expect(
      actionConfigSchema.safeParse({ type: 'island', targetCardId: 'c1' }).success
    ).toBe(true)
  })

  it('accepts angel', () => {
    expect(
      actionConfigSchema.safeParse({ type: 'angel', targetCardId: 'c1' }).success
    ).toBe(true)
  })

  it('rejects unknown type', () => {
    expect(
      actionConfigSchema.safeParse({ type: 'unknown_action', targetCardId: 'c1' })
        .success
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// submitHandSchema
// ---------------------------------------------------------------------------
describe('submitHandSchema', () => {
  it('accepts empty cardIds without actionConfigs', () => {
    expect(
      submitHandSchema.safeParse({ sessionPlayerId: 'p1', cardIds: [] }).success
    ).toBe(true)
  })

  it('accepts valid cardIds with actionConfigs', () => {
    expect(
      submitHandSchema.safeParse({
        sessionPlayerId: 'p1',
        cardIds: ['c1', 'c2'],
        actionConfigs: {
          c1: { type: 'impersonate_deck', targetCardId: 'c99' },
        },
      }).success
    ).toBe(true)
  })

  it('rejects cardIds with more than 20 items', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `c${i}`)
    expect(
      submitHandSchema.safeParse({ sessionPlayerId: 'p1', cardIds: tooMany }).success
    ).toBe(false)
  })

  it('rejects invalid actionConfig entry', () => {
    expect(
      submitHandSchema.safeParse({
        sessionPlayerId: 'p1',
        cardIds: ['c1'],
        actionConfigs: { c1: { type: 'bad_type', targetCardId: 'c2' } },
      }).success
    ).toBe(false)
  })
})
