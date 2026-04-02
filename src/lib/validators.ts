import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
})

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  password: z.string().min(8).max(128),
  inviteCode: z.string().length(8),
})

export const cardFiltersSchema = z.object({
  editionId: z.string().optional(),
  suit: z.string().optional(),
  q: z.string().optional(),
})

export const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  editionIds: z.array(z.string()).min(1, 'Select at least one edition'),
  nicknames: z
    .array(z.string().min(1).max(32))
    .min(1, 'Add at least one player')
    .max(10),
})

export const actionConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('impersonate_deck'), targetCardId: z.string() }),
  z.object({ type: z.literal('impersonate_hand'), targetCardId: z.string() }),
  z.object({
    type: z.literal('book_of_changes'),
    targetCardId: z.string(),
    newSuit: z.string(),
  }),
  z.object({ type: z.literal('island'), targetCardId: z.string() }),
  z.object({ type: z.literal('angel'), targetCardId: z.string() }),
])

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export const submitHandSchema = z.object({
  sessionPlayerId: z.string(),
  cardIds: z.array(z.string()).max(20),
  actionConfigs: z.record(z.string(), actionConfigSchema).optional(),
})

// Form-specific schemas (client-side only, not used for API validation)

export const loginFormSchema = z.object({
  username: z.string().min(3, 'At least 3 characters').max(32, 'Max 32 characters'),
  password: z.string().min(8, 'At least 8 characters'),
})

export const registerFormSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(32, 'Max 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  password: z.string().min(8, 'At least 8 characters').max(128, 'Max 128 characters'),
  inviteCode: z.string().length(8, '8-character code required'),
})

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .max(128, 'Max 128 characters'),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })
    }
  })

export const createSessionFormSchema = z.object({
  name: z.string().min(1, 'Enter a game name'),
  editionIds: z.array(z.string()).min(1, 'Select at least one edition'),
  nicknames: z
    .array(z.string())
    .refine((arr) => arr.some((n) => n.trim().length > 0), 'Add at least one player'),
})
