import { test as base, expect, type Page } from '@playwright/test'

/**
 * Shared fixtures.
 * Each test gets a fresh browser context (Playwright default) and, before the first navigation,
 * the mock database is reset to the deterministic seed and the scenario is set through the URL.
 * REST goes through the MSW handlers and realtime through socket.io-client — tests only drive the
 * UI and the mock control surface (`window.__kurioMock`), never the app state.
 */

export const USERS = {
  nova: { email: 'nova@kurio.dev', password: 'Kurio2026!', name: 'Nova Sato' },
  theo: { email: 'theo@kurio.dev', password: 'Kurio2026!', name: 'Theo Lima' },
} as const

type Mock = {
  /** Opens the app with the given scenarios (always combined with `fast` unless `keepLatency`). */
  boot: (options?: { scenarios?: string[]; path?: string; keepLatency?: boolean }) => Promise<void>
  control: <T>(fn: (mock: NonNullable<Window['__kurioMock']>) => T | Promise<T>) => Promise<T>
}

export const test = base.extend<{ mock: Mock }>({
  mock: async ({ page }, use) => {
    // Keep the demo scenario panel out of every test page (and of visual baselines).
    await page.addInitScript(() => sessionStorage.setItem('kurio:scenario-panel', 'off'))
    const mock: Mock = {
      async boot({ scenarios = [], path = '/', keepLatency = false } = {}) {
        const list = keepLatency ? scenarios : ['fast', ...scenarios]
        await page.goto(`/?scenario=${list.join(',')}&panel=off`)
        await page.waitForFunction(() => Boolean(window.__kurioMock))
        await page.evaluate(() => window.__kurioMock!.reset())
        if (path !== '/') await page.goto(path)
        else await page.reload()
        // Realtime scenarios need the app's socket.io-client connected to the mock server.
        await page.waitForFunction(() => (window.__kurioMock?.socket.clients().length ?? 0) > 0)
      },
      // The callback is serialized and run in the page against the mock control surface.
      control: async (fn) => {
        await page.waitForFunction(() => Boolean(window.__kurioMock))
        return page.evaluate(`(${fn.toString()})(window.__kurioMock)`) as never
      },
    }
    await use(mock)
  },
})

export { expect }

export async function login(
  page: Page,
  user: (typeof USERS)[keyof typeof USERS] = USERS.nova,
  redirect?: string,
) {
  await page.goto(redirect ? `/entrar?redirect=${encodeURIComponent(redirect)}` : '/entrar')
  await page.getByPlaceholder('contato@email.com').fill(user.email)
  await page.getByPlaceholder('***********').fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText(`Bem-vindo de volta, ${user.name}!`)).toBeVisible()
  // Route changes cross-fade (View Transitions): wait until the login form has left the DOM
  // so the next locator never resolves against the outgoing page.
  await expect(page.getByPlaceholder('contato@email.com')).toHaveCount(0)
}

/** Adds an NFT to the cart through the detail page (as a collector would). */
export async function addToCart(
  page: Page,
  nftId: string,
  { quantity = 1, edition }: { quantity?: number; edition?: string } = {},
) {
  await page.goto(`/nft/${nftId}${edition ? `?edicao=${edition}` : ''}`)
  const increase = page
    .getByRole('button', { name: /Aumentar quantidade/ })
    .filter({ visible: true })
  for (let index = 1; index < quantity; index++) await increase.click()
  await page
    .getByRole('button', { name: 'Adicionar ao carrinho' })
    .or(page.getByRole('button', { name: 'Comprar', exact: true }))
    .filter({ visible: true })
    .first()
    .click()
  await expect(page.getByText(/adicionado ao carrinho/)).toBeVisible()
}

export async function apiAs(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown } = {},
) {
  return page.evaluate(
    async ({ path: url, init: options }) => {
      const session = localStorage.getItem('kurio:session')
      const token = session ? (JSON.parse(session) as { token: string }).token : null
      const response = await fetch(`/api${url}`, {
        method: options.method ?? 'GET',
        headers: {
          'content-type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
      return {
        status: response.status,
        body: (await response.json().catch(() => null)) as Record<string, unknown> | null,
      }
    },
    { path, init },
  )
}

/**
 * Advances a fake clock in small steps, yielding real time between steps so promise chains and
 * network round-trips scheduled after each step can still register their timers.
 */
export async function advanceClock(page: Page, totalMs: number, stepMs = 500) {
  for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
    await page.clock.runFor(stepMs)
    await page.waitForTimeout(40)
  }
}
