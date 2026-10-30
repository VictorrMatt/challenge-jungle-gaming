/**
 * Mock scenarios.
 *
 * A scenario is a named, deterministic set of network conditions and business outcomes.
 * Scenarios can be combined (`?scenario=slow,payment-declined`) and are selected, in priority:
 *   1. `?scenario=` query parameter (persisted for the rest of the session),
 *   2. the value saved by the scenario panel / previous `?scenario=`,
 *   3. `VITE_MOCK_SCENARIO`,
 *   4. `default`.
 */

export type RequestMatcher = {
  method?: string
  /** Matched against the path after the API base, e.g. `/cart/items`. */
  path: RegExp
}

export type FailureRule = RequestMatcher & {
  status: number | 'network-error' | 'timeout'
  code?: string
  /** Fail only the first N matching requests (then recover). Omit to always fail. */
  times?: number
}

export type ScenarioConfig = {
  /** Fixed latency or inclusive range (deterministic jitter from a seeded PRNG). */
  latency: number | { min: number; max: number }
  /** Requests to these paths answer slower the earlier they were sent (out-of-order replies). */
  outOfOrder?: RegExp
  failures: FailureRule[]
  emptyCatalog?: boolean
  /** Lifetime of new sessions. */
  sessionTtlMs: number
  paymentOutcome: 'confirmed' | 'declined'
  paymentSettleMs: number
  walletRejects?: boolean
  /** Changes the price of the first cart line right after a quote is issued. */
  priceChangeOnQuote?: boolean
  /** Sells out the first cart line right after a quote is issued. */
  soldOutOnQuote?: boolean
  /** Order creation succeeds server-side but the reply never reaches the client. */
  orderTimeoutOnce?: boolean
}

const BASE: ScenarioConfig = {
  latency: { min: 80, max: 220 },
  failures: [],
  sessionTtlMs: Number(import.meta.env.VITE_SESSION_TTL_MINUTES ?? 30) * 60_000,
  paymentOutcome: 'confirmed',
  paymentSettleMs: 2500,
}

export const SCENARIOS = {
  default: {
    description: 'Sucesso com latência realista',
    config: {},
  },
  fast: {
    description: 'Sem latência (testes e auditorias determinísticas)',
    config: { latency: 0, paymentSettleMs: 600 },
  },
  slow: {
    description: 'Rede lenta: 2,5 s por requisição',
    config: { latency: 2500 },
  },
  'variable-latency': {
    description: 'Latência variável entre 100 ms e 2 s',
    config: { latency: { min: 100, max: 2000 } },
  },
  'out-of-order': {
    description: 'Respostas do catálogo chegam fora de ordem',
    config: { outOfOrder: /^\/nfts$/ },
  },
  offline: {
    description: 'Sem conexão: toda requisição falha na rede',
    config: { failures: [{ path: /.*/, status: 'network-error' }] },
  },
  flaky: {
    description: 'Primeira tentativa de cada leitura falha com 503',
    config: { failures: [{ method: 'GET', path: /.*/, status: 503, times: 1 }] },
  },
  'server-error': {
    description: 'HTTP 500 em todas as rotas',
    config: { failures: [{ path: /.*/, status: 500 }] },
  },
  'catalog-error': {
    description: 'Catálogo falha 2 vezes com 503 e depois se recupera',
    config: { failures: [{ method: 'GET', path: /^\/nfts$/, status: 503, times: 2 }] },
  },
  'empty-catalog': {
    description: 'Catálogo sem resultados',
    config: { emptyCatalog: true },
  },
  'session-expired': {
    description: 'Sessão expira 20 s após o login',
    config: { sessionTtlMs: 20_000 },
  },
  unauthorized: {
    description: 'Rotas privadas respondem 403',
    config: { failures: [{ path: /^\/me\//, status: 403, code: 'FORBIDDEN' }] },
  },
  'favorites-error': {
    description: 'Mutations de favoritos falham com 500 (rollback otimista)',
    config: {
      failures: [
        { method: 'PUT', path: /^\/me\/favorites\//, status: 500 },
        { method: 'DELETE', path: /^\/me\/favorites\//, status: 500 },
      ],
    },
  },
  'price-change': {
    description: 'Preço do primeiro item muda logo após a cotação',
    config: { priceChangeOnQuote: true },
  },
  'sold-out': {
    description: 'Edição do primeiro item esgota logo após a cotação',
    config: { soldOutOnQuote: true },
  },
  'order-timeout': {
    description: 'Pedido é criado, mas a resposta expira (recuperação por idempotência)',
    config: { orderTimeoutOnce: true },
  },
  'payment-declined': {
    description: 'Pagamento recusado pela rede',
    config: { paymentOutcome: 'declined' },
  },
  'wallet-rejected': {
    description: 'Carteira recusa a conexão',
    config: { walletRejects: true },
  },
} satisfies Record<string, { description: string; config: Partial<ScenarioConfig> }>

export type ScenarioName = keyof typeof SCENARIOS
export const SCENARIO_NAMES = Object.keys(SCENARIOS) as ScenarioName[]

const STORAGE_KEY = 'kurio:mock-scenario'

export function isScenarioName(value: string): value is ScenarioName {
  return value in SCENARIOS
}

export function parseScenarioList(raw: string | null | undefined): ScenarioName[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((name) => name.trim())
    .filter(isScenarioName)
}

export function composeScenario(names: ScenarioName[]): ScenarioConfig {
  return names.reduce<ScenarioConfig>((config, name) => {
    const partial: Partial<ScenarioConfig> = SCENARIOS[name].config
    return { ...config, ...partial, failures: [...config.failures, ...(partial.failures ?? [])] }
  }, BASE)
}

let active: ScenarioName[] = ['default']

export function resolveInitialScenario(search: string, envValue: string | undefined) {
  const fromQuery = parseScenarioList(new URLSearchParams(search).get('scenario'))
  if (fromQuery.length > 0) {
    saveScenario(fromQuery)
    return fromQuery
  }
  let stored: ScenarioName[] = []
  try {
    stored = parseScenarioList(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    // ignore
  }
  if (stored.length > 0) return stored
  const fromEnv = parseScenarioList(envValue)
  return fromEnv.length > 0 ? fromEnv : (['default'] as ScenarioName[])
}

export function saveScenario(names: ScenarioName[]) {
  active = names.length > 0 ? names : ['default']
  try {
    sessionStorage.setItem(STORAGE_KEY, active.join(','))
  } catch {
    // ignore
  }
  resetScenarioCounters()
}

export function activeScenarioNames() {
  return active
}

export function activeScenario(): ScenarioConfig {
  return composeScenario(active)
}

/* ---------------------------------------------------------- Per-scenario mutable counters */

const failureHits = new Map<FailureRule, number>()
let outOfOrderSequence = 0
let orderTimeoutConsumed = false
const consumed = new Set<string>()

export function resetScenarioCounters() {
  failureHits.clear()
  outOfOrderSequence = 0
  orderTimeoutConsumed = false
  consumed.clear()
}

/** Returns true only the first time a one-shot scenario effect is requested. */
export function consumeOnce(effect: string) {
  if (consumed.has(effect)) return false
  consumed.add(effect)
  return true
}

export function matchFailure(method: string, path: string): FailureRule | null {
  for (const rule of activeScenario().failures) {
    if (rule.method && rule.method !== method) continue
    if (!rule.path.test(path)) continue
    if (rule.times !== undefined) {
      const hits = failureHits.get(rule) ?? 0
      if (hits >= rule.times) continue
      failureHits.set(rule, hits + 1)
    }
    return rule
  }
  return null
}

export function nextOutOfOrderDelay() {
  // 1st request: 1800 ms, 2nd: 1200 ms, 3rd: 600 ms … later requests resolve first.
  outOfOrderSequence += 1
  return Math.max(150, 2400 - outOfOrderSequence * 600)
}

export function consumeOrderTimeout() {
  if (!activeScenario().orderTimeoutOnce || orderTimeoutConsumed) return false
  orderTimeoutConsumed = true
  return true
}
