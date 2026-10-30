import { z } from 'zod'

import { isoDateTime } from './common'
import { networkId } from './nft'

/* ----------------------------------------------------------------------------------------------
 * Validation rules shared by the forms (client) and the mock API (server), so both always agree.
 * ------------------------------------------------------------------------------------------- */

export const emailField = z.email('Informe um e-mail válido').max(120)
export const usernameField = z
  .string()
  .trim()
  .min(3, 'Use ao menos 3 caracteres')
  .max(24, 'Use no máximo 24 caracteres')
  .regex(/^[a-z0-9_.]+$/i, 'Use apenas letras, números, ponto ou _')
export const passwordField = z
  .string()
  .min(8, 'A senha precisa ter ao menos 8 caracteres')
  .max(72, 'Use no máximo 72 caracteres')
  .regex(/[a-z]/i, 'Inclua ao menos uma letra')
  .regex(/\d/, 'Inclua ao menos um número')
export const ensNameField = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{3,32}$/i, 'Use 3–32 letras, números ou hífen')
export const walletAddressField = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x com 40 caracteres hexadecimais')

/* ---------------------------------------------------------------------------------------- Auth */

export const user = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof user>

export const session = z.object({
  token: z.string(),
  expiresAt: isoDateTime,
  user,
})
export type Session = z.infer<typeof session>

export const loginRequest = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe sua senha'),
})
export type LoginRequest = z.infer<typeof loginRequest>

export const registerRequest = z
  .object({
    username: usernameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
export type RegisterRequest = z.infer<typeof registerRequest>

/* ------------------------------------------------------------------------------------- Profile */

export const profile = z.object({
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  ensName: z.string(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
  updatedAt: isoDateTime,
})
export type Profile = z.infer<typeof profile>

export const updateProfileRequest = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(40),
  username: usernameField,
  email: emailField,
  ensName: ensNameField.or(z.literal('')),
  walletNickname: z.string().trim().min(2, 'Informe o apelido da carteira').max(32),
})
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>

export const AVATAR_MAX_BYTES = 1_000_000
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const updateAvatarRequest = z.object({
  /** Data URL of an image up to 1 MB. */
  dataUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/, 'Formato de imagem inválido'),
})
export type UpdateAvatarRequest = z.infer<typeof updateAvatarRequest>

export const changePasswordRequest = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual',
  })
export type ChangePasswordRequest = z.infer<typeof changePasswordRequest>

/* ------------------------------------------------------------------------------------- Wallets */

export const walletType = z.enum(['metamask', 'walletconnect', 'coinbase'])
export type WalletType = z.infer<typeof walletType>
export const walletSlot = z.enum(['primary', 'secondary'])
export type WalletSlot = z.infer<typeof walletSlot>

export const walletInput = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(40),
  nickname: z.string().trim().min(2, 'Informe o apelido da carteira').max(32),
  network: networkId,
  profileName: z.string().trim().min(2, 'Informe o nome do perfil').max(40),
  address: walletAddressField,
  secondaryAddress: walletAddressField.or(z.literal('')),
  type: walletType,
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{4,12}$/i, 'Use 4–12 letras ou números'),
  email: emailField,
  ensName: ensNameField,
})
export type WalletInput = z.infer<typeof walletInput>

export const wallet = walletInput.extend({
  id: z.string(),
  slot: walletSlot,
  updatedAt: isoDateTime,
})
export type Wallet = z.infer<typeof wallet>

export const walletsResponse = z.object({
  primary: wallet.nullable(),
  secondary: wallet.nullable(),
})
export type WalletsResponse = z.infer<typeof walletsResponse>

/* ----------------------------------------------------------------------------------- Favorites */

export const favoritesResponse = z.object({ nftIds: z.array(z.string()) })
export type FavoritesResponse = z.infer<typeof favoritesResponse>
