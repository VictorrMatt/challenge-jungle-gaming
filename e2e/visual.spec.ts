import type { Page } from '@playwright/test'

import { addToCart, expect, login, test } from './fixtures'

/**
 * Visual regression of the four key screens with deterministic data (seeded mocks, fixed
 * latency 0, no animations, panel hidden). Baselines live in e2e/__screenshots__/<project>/.
 *
 * Pixels depend on font rasterization, which varies between operating systems and Linux
 * distributions, so baselines belong to ONE reference environment: the official Playwright image
 * pinned to the installed version (scripts/e2e-docker.mjs). CI and `pnpm test:e2e:docker` run
 * there with E2E_VISUAL=1; anywhere else these tests are skipped with the reason below instead of
 * failing on anti-aliasing noise.
 * Update with: pnpm test:e2e:update
 */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page
    .locator('[data-sonner-toast]')
    .evaluateAll((toasts) => toasts.forEach((toast) => toast.remove()))
}

test.describe('Regressão visual', () => {
  test.skip(
    !process.env.E2E_VISUAL,
    'Baselines são da imagem Docker de referência do Playwright: rode `pnpm test:e2e:docker`.',
  )

  test('início', async ({ page, mock }) => {
    await mock.boot()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio.png')
  })

  test('detalhe do NFT', async ({ page, mock }) => {
    await mock.boot({ path: '/nft/emerald-ape-042' })
    await settle(page)
    await expect(page).toHaveScreenshot('detalhe.png')
  })

  test('carrinho', async ({ page, mock }) => {
    await mock.boot()
    await addToCart(page, 'emerald-ape-042', { quantity: 2 })
    await addToCart(page, 'violet-nomad-314')
    await page.goto('/carrinho')
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho.png')
  })

  test('pagamento', async ({ page, mock }) => {
    await mock.boot()
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    await page.goto('/pagamento')
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento.png')
  })
})
