import { confirmPayment, openReview, ordersInMockDb } from './checkout-helpers'
import { addToCart, apiAs, expect, login, test } from './fixtures'

test.describe('7. Falha de pagamento, clique repetido e timeout com recuperação', () => {
  test('pagamento recusado preserva o carrinho e permite nova tentativa', async ({
    page,
    mock,
  }) => {
    await mock.boot({ scenarios: ['payment-declined'] })
    await login(page)
    await addToCart(page, 'sage-nomad-009')
    await openReview(page)
    await confirmPayment(page)
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
      timeout: 15_000,
    })
    const cart = await apiAs(page, '/cart')
    expect((cart.body as { items: unknown[] }).items).toHaveLength(1)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  })

  test('clique duplo na confirmação cria um único pedido', async ({ page, mock }) => {
    await mock.boot()
    await login(page)
    await addToCart(page, 'golden-beat-207')
    await openReview(page)
    await confirmPayment(page, { double: true })
    await expect(page).toHaveURL(/\/pedido\//, { timeout: 15_000 })
    expect(await ordersInMockDb(page)).toBe(1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido pela chave de idempotência', async ({
    page,
    mock,
  }) => {
    // Real time on purpose: the 8 s client timeout and the delayed reply race in the browser.
    await mock.boot({ scenarios: ['order-timeout'] })
    await login(page)
    await addToCart(page, 'ivory-baron-088')
    await openReview(page)
    await confirmPayment(page)
    // Client gives up after 8 s and retries with the same Idempotency-Key.
    // The retry (same key) returns the order created by the first, timed-out request.
    await expect(page).toHaveURL(/\/pedido\//, { timeout: 25_000 })
    await expect(
      page.getByRole('dialog', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible()
    expect(await ordersInMockDb(page)).toBe(1)
  })

  test('carteira recusa a conexão', async ({ page, mock }) => {
    await mock.boot({ scenarios: ['wallet-rejected'] })
    await login(page)
    await addToCart(page, 'golden-beat-207')
    await page.goto('/pagamento')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByText(/A carteira recusou a conexão/)).toBeVisible()
    expect(await ordersInMockDb(page)).toBe(0)
  })

  test('carteira desconectada antes da confirmação exige reconexão', async ({ page, mock }) => {
    await mock.boot()
    await login(page)
    await addToCart(page, 'golden-beat-207')
    await openReview(page)
    await mock.control((m) => m.disconnectWallets())
    await confirmPayment(page)
    await expect(page.getByText(/A carteira foi desconectada/)).toBeVisible()
    expect(await ordersInMockDb(page)).toBe(0)
  })
})
