import { confirmPayment, openReview, ordersInMockDb } from './checkout-helpers'
import { apiAs, expect, test, USERS } from './fixtures'

test.describe('6. Compra completa: do catálogo ao recibo confirmado', () => {
  test('visitante compra, autentica no meio do fluxo e recebe o recibo', async ({ page, mock }) => {
    await mock.boot()

    // Catalog → detail.
    await page
      .locator('#catalogo article')
      .filter({ hasText: 'Emerald Ape #042' })
      .getByRole('link')
      .click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)

    // Buy → cart → checkout requires login → resumes at payment.
    await page
      .getByRole('button', { name: /^Comprar( NFT)?$/ })
      .filter({ visible: true })
      .click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await page
      .getByRole('button', { name: 'Conectar e finalizar' })
      .filter({ visible: true })
      .click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
    await page.getByPlaceholder('contato@email.com').fill(USERS.nova.email)
    await page.getByPlaceholder('***********').fill(USERS.nova.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/pagamento$/)

    // Review the server quote and confirm.
    const dialog = await openReview(page)
    await expect(dialog).toContainText('Emerald Ape #042')
    await expect(
      dialog.getByRole('button', { name: 'Confirmar pagamento de 1.206 ETH' }),
    ).toBeVisible()
    await confirmPayment(page)

    // Pending → confirmed via order.updated → receipt.
    await expect(page.getByText('Pagamento em processamento')).toBeVisible()
    await expect(page).toHaveURL(/\/pedido\/ord_/, { timeout: 15_000 })
    const receipt = page.getByRole('dialog', { name: 'Seus NFTs agora estão na sua carteira' })
    await expect(receipt).toContainText('Emerald Ape #042')
    await expect(receipt).toContainText('1.206 ETH')
    await expect(receipt.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute(
      'href',
      /etherscan\.io\/tx\/0x/,
    )

    // Only the purchased items leave the cart; exactly one order exists.
    const cart = await apiAs(page, '/cart')
    expect((cart.body as { items: unknown[] }).items).toHaveLength(0)
    expect(await ordersInMockDb(page)).toBe(1)

    // The receipt is a snapshot: later catalog changes do not alter it.
    await mock.control((m) => m.setNftPrice('emerald-ape-042', '9.99'))
    await page.reload()
    await expect(page.getByRole('dialog')).toContainText('1.206 ETH')
  })
})
