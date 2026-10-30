import {
  changePasswordRequest,
  endpoints,
  loginRequest,
  registerRequest,
  updateAvatarRequest,
  updateProfileRequest,
  walletInput,
  walletSlot,
  AVATAR_MAX_BYTES,
  type Profile,
  type Session,
  type User,
} from '@/shared/contracts'

import type { UserRecord } from '../db/fixtures'
import { db, hashPassword, mutate, nextId, nowIso } from '../db/store'
import { activeScenario } from '../scenarios/scenarios'
import { ApiError, json, noContent, route } from './http'

function toUser(user: UserRecord): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  }
}

function toProfile(user: UserRecord): Profile {
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatarUrl: user.avatarUrl,
    updatedAt: user.updatedAt,
  }
}

function openSession(user: UserRecord): Session {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + activeScenario().sessionTtlMs).toISOString()
  mutate((state) => {
    state.sessions[token] = { token, userId: user.id, expiresAt }
  })
  return { token, expiresAt, user: toUser(user) }
}

function findByEmail(email: string) {
  return Object.values(db().users).find((user) => user.email.toLowerCase() === email.toLowerCase())
}

function findByUsername(username: string) {
  return Object.values(db().users).find(
    (user) => user.username.toLowerCase() === username.toLowerCase(),
  )
}

export const accountHandlers = [
  /* -------------------------------------------------------------------------------- Session */
  route('post', endpoints.auth.register, { body: registerRequest }, async ({ body }) => {
    const fieldErrors: Record<string, string[]> = {}
    if (findByEmail(body.email)) fieldErrors.email = ['Este e-mail já está cadastrado.']
    if (findByUsername(body.username))
      fieldErrors.username = ['Este nome de usuário já está em uso.']
    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError(
        409,
        fieldErrors.email ? 'EMAIL_TAKEN' : 'USERNAME_TAKEN',
        'Já existe uma conta com estes dados.',
        { fieldErrors },
      )
    }
    const id = mutate(() => nextId('usr'))
    const passwordSalt = crypto.randomUUID()
    const user: UserRecord = {
      id,
      username: body.username,
      email: body.email,
      displayName: body.username,
      ensName: '',
      walletNickname: '',
      avatarUrl: null,
      passwordSalt,
      passwordHash: await hashPassword(body.password, passwordSalt),
      updatedAt: nowIso(),
    }
    mutate((state) => {
      state.users[id] = user
      state.favorites[id] = []
      state.wallets[id] = { primary: null, secondary: null }
    })
    return json(openSession(user), 201)
  }),

  route('post', endpoints.auth.login, { body: loginRequest }, async ({ body }) => {
    const user = findByEmail(body.email)
    const valid =
      user && (await hashPassword(body.password, user.passwordSalt)) === user.passwordHash
    if (!user || !valid)
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    return json(openSession(user))
  }),

  route('get', endpoints.auth.session, { auth: 'required' }, ({ auth }) => {
    const session = db().sessions[auth!.token]!
    return json<Session>({
      token: auth!.token,
      expiresAt: session.expiresAt,
      user: toUser(auth!.user),
    })
  }),

  route('post', endpoints.auth.logout, { auth: 'optional' }, ({ auth }) => {
    if (auth) {
      mutate((state) => {
        delete state.sessions[auth.token]
      })
    }
    return noContent()
  }),

  /* -------------------------------------------------------------------------------- Profile */
  route('get', endpoints.profile.current, { auth: 'required' }, ({ auth }) =>
    json(toProfile(auth!.user)),
  ),

  route(
    'patch',
    endpoints.profile.current,
    { auth: 'required', body: updateProfileRequest },
    ({ auth, body }) => {
      const email = findByEmail(body.email)
      const username = findByUsername(body.username)
      const fieldErrors: Record<string, string[]> = {}
      if (email && email.id !== auth!.user.id)
        fieldErrors.email = ['Este e-mail já está cadastrado.']
      if (username && username.id !== auth!.user.id)
        fieldErrors.username = ['Este nome de usuário já está em uso.']
      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError(409, 'CONFLICT', 'Alguns dados já pertencem a outra conta.', {
          fieldErrors,
        })
      }
      const updated = mutate((state) => {
        const user = state.users[auth!.user.id]!
        Object.assign(user, body, { updatedAt: nowIso() })
        return user
      })
      return json(toProfile(updated))
    },
  ),

  route(
    'put',
    endpoints.profile.avatar,
    { auth: 'required', body: updateAvatarRequest },
    ({ auth, body }) => {
      const bytes = Math.floor(((body.dataUrl.split(',')[1] ?? '').length * 3) / 4)
      if (bytes > AVATAR_MAX_BYTES) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'A imagem deve ter no máximo 1 MB.', {
          fieldErrors: { dataUrl: ['A imagem deve ter no máximo 1 MB.'] },
        })
      }
      const updated = mutate((state) => {
        const user = state.users[auth!.user.id]!
        user.avatarUrl = body.dataUrl
        user.updatedAt = nowIso()
        return user
      })
      return json(toProfile(updated))
    },
  ),

  route('delete', endpoints.profile.avatar, { auth: 'required' }, ({ auth }) => {
    const updated = mutate((state) => {
      const user = state.users[auth!.user.id]!
      user.avatarUrl = null
      user.updatedAt = nowIso()
      return user
    })
    return json(toProfile(updated))
  }),

  route(
    'post',
    endpoints.profile.password,
    { auth: 'required', body: changePasswordRequest },
    async ({ auth, body }) => {
      const user = auth!.user
      if ((await hashPassword(body.currentPassword, user.passwordSalt)) !== user.passwordHash) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'A senha atual está incorreta.', {
          fieldErrors: { currentPassword: ['A senha atual está incorreta.'] },
        })
      }
      const passwordSalt = crypto.randomUUID()
      const passwordHash = await hashPassword(body.newPassword, passwordSalt)
      mutate((state) => {
        Object.assign(state.users[user.id]!, { passwordSalt, passwordHash, updatedAt: nowIso() })
      })
      return noContent()
    },
  ),

  /* -------------------------------------------------------------------------------- Wallets */
  route('get', endpoints.wallets.list, { auth: 'required' }, ({ auth }) =>
    json(db().wallets[auth!.user.id] ?? { primary: null, secondary: null }),
  ),

  route(
    'put',
    '/me/wallets/:slot',
    { auth: 'required', body: walletInput },
    ({ auth, body, params }) => {
      const slot = walletSlot.safeParse(params.slot)
      if (!slot.success) throw new ApiError(404, 'NOT_FOUND', 'Carteira inexistente.')
      const wallets = db().wallets[auth!.user.id] ?? { primary: null, secondary: null }
      if (slot.data === 'secondary' && !wallets.primary) {
        throw new ApiError(409, 'CONFLICT', 'Cadastre a carteira principal antes da secundária.')
      }
      const other = slot.data === 'primary' ? wallets.secondary : wallets.primary
      if (other && other.address.toLowerCase() === body.address.toLowerCase()) {
        throw new ApiError(409, 'CONFLICT', 'Este endereço já está cadastrado na outra carteira.', {
          fieldErrors: { address: ['Este endereço já está cadastrado na outra carteira.'] },
        })
      }
      const saved = mutate((state) => {
        const current = (state.wallets[auth!.user.id] ??= { primary: null, secondary: null })
        const wallet = {
          ...body,
          id: current[slot.data]?.id ?? nextId('wal'),
          slot: slot.data,
          updatedAt: nowIso(),
        }
        current[slot.data] = wallet
        return wallet
      })
      return json(saved)
    },
  ),
]
