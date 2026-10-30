import type { Page } from '@playwright/test'

import { expect } from './fixtures'

export function reviewDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Revise seu pedido' })
}

/** From the payment page: connect wallet + get a quote → review dialog. */
export async function openReview(page: Page) {
  if (!page.url().endsWith('/pagamento')) await page.goto('/pagamento')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(reviewDialog(page)).toBeVisible()
  return reviewDialog(page)
}

export async function confirmPayment(page: Page, { double = false } = {}) {
  const button = reviewDialog(page).getByRole('button', { name: /Confirmar pagamento/ })
  if (double) await button.dblclick()
  else await button.click()
}

export async function ordersInMockDb(page: Page) {
  return page.evaluate(
    () =>
      Object.keys(
        (JSON.parse(localStorage.getItem('kurio:mock-db') ?? '{}') as { orders?: object }).orders ??
          {},
      ).length,
  )
}
