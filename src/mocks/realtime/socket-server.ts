import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import { SOCKET_PATH, type NftUpdatedEvent, type OrderUpdatedEvent } from '@/shared/contracts'

import { db } from '../db/store'

/**
 * Socket.IO server simulated with MSW's WebSocket interception + @mswjs/socket.io-binding.
 *
 * Transport notes (see ARCHITECTURE.md):
 * - Only the `websocket` transport can be intercepted; the client disables long-polling.
 * - The binding has no rooms: this module keeps its own registry and routes private events
 *   (`order.updated`) only to sockets authenticated as the order owner.
 * - Engine.IO heartbeats are emulated (ping every 25 s) so the client never times out.
 */

export const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ?? `${location.origin.replace(/^http/, 'ws')}`
).replace(/\/$/, '')

const PING_INTERVAL_MS = 25_000

type Connection = Parameters<Parameters<ReturnType<typeof ws.link>['addEventListener']>[1]>[0]

type Client = {
  id: number
  userId: string | null
  connection: Connection
  io: ReturnType<typeof toSocketIo>
  heartbeat: ReturnType<typeof setInterval>
}

const clients = new Map<number, Client>()
let clientSequence = 0
let eventSequence = 0
let blockedUntil = 0
const history: Array<{
  event: string
  data: NftUpdatedEvent | OrderUpdatedEvent
  userId: string | null
}> = []

function userFromUrl(url: URL) {
  const token = url.searchParams.get('token')
  if (!token) return null
  const session = db().sessions[token]
  if (!session || Date.now() >= Date.parse(session.expiresAt)) return null
  return session.userId
}

const realtime = ws.link(`${SOCKET_URL}${SOCKET_PATH}`)

export const socketHandler = realtime.addEventListener('connection', (connection) => {
  if (Date.now() < blockedUntil) {
    // Simulated outage: refuse the connection so the client keeps retrying with backoff.
    connection.client.close(1011, 'Simulated outage')
    return
  }

  const io = toSocketIo(connection)
  const id = ++clientSequence
  const client: Client = {
    id,
    userId: userFromUrl(connection.client.url),
    connection,
    io,
    heartbeat: setInterval(() => connection.client.send('2'), PING_INTERVAL_MS),
  }
  clients.set(id, client)

  connection.client.addEventListener('close', () => {
    clearInterval(client.heartbeat)
    clients.delete(id)
  })
})

export function nextEventId() {
  eventSequence += 1
  return `evt_${Date.now().toString(36)}_${eventSequence}`
}

function deliver(client: Client, event: string, data: NftUpdatedEvent | OrderUpdatedEvent) {
  try {
    client.io.client.emit(event, data)
  } catch {
    // Socket already closing; the client will reconcile through REST after reconnecting.
  }
}

/** Public event: every connected socket (visitors included) receives catalog changes. */
export function publishNftUpdated(event: NftUpdatedEvent) {
  history.push({ event: 'nft.updated', data: event, userId: null })
  for (const client of clients.values()) deliver(client, 'nft.updated', event)
}

/** Private event: only sockets authenticated as the order owner receive it. */
export function publishOrderUpdated(userId: string, event: OrderUpdatedEvent) {
  history.push({ event: 'order.updated', data: event, userId })
  for (const client of clients.values()) {
    if (client.userId === userId) deliver(client, 'order.updated', event)
  }
}

/* --------------------------------------------------------------- Controls for scenarios/tests */

/** Re-delivers the last event with the same eventId (duplicate delivery). */
export function replayLastEvent() {
  const last = history.at(-1)
  if (!last) return false
  for (const client of clients.values()) {
    if (last.userId === null || client.userId === last.userId)
      deliver(client, last.event, last.data)
  }
  return true
}

/** Sends an older version of the last nft.updated event (out-of-order delivery). */
export function sendStaleNftEvent() {
  const last = history.toReversed().find((entry) => entry.event === 'nft.updated')
  if (!last) return false
  const stale = { ...(last.data as NftUpdatedEvent) }
  stale.eventId = nextEventId()
  stale.version = Math.max(1, stale.version - 1)
  stale.payload = { ...stale.payload, price: '99.99' }
  for (const client of clients.values()) deliver(client, 'nft.updated', stale)
  return true
}

/** Drops every socket and refuses reconnections for `ms` (simulated connection loss). */
export function interruptConnections(ms = 0) {
  blockedUntil = Date.now() + ms
  for (const client of clients.values()) client.connection.client.close(1012, 'Simulated drop')
}

export function connectedClients() {
  return [...clients.values()].map(({ id, userId }) => ({ id, userId }))
}
