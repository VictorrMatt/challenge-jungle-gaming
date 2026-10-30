import { confirmPayment, openReview, ordersInMockDb, reviewDialog } from './checkout-helpers'
import { addToCart, expect, login, test } from './fixtures'

/**
 * Required realtime scenario (README §7): an NFT is in the cart, its price/availability changes
 * through Socket.IO during navigation, the UI reports it and refreshes the summary, and checkout
 * refuses to confirm with the outdated quote.
 * Events are emitted by the mock server and received by socket.io-client — never injected in the UI.
 */
test.describe('9. Alteração de preço/disponibilidade via Socket.IO durante o checkout', () => {
  test('preço muda com o item no carrinho: aviso, resumo atualizado e reconfirmação', async ({
    page,
    mock,
  }) => {
    await mock.boot()
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    await page.goto('/carrinho')
    await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()

    await mock.control((m) => m.setNftPrice('emerald-ape-042', '1.49'))
    await expect(
      page.getByText(/Emerald Ape #042 teve preço ou disponibilidade atualizados/),
    ).toBeVisible()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Itens do carrinho mudaram' }),
    ).toContainText('1.19 para 1.49')
    await expect(page.getByText('1.506 ETH').filter({ visible: true }).first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Revise as alterações' }).filter({ visible: true }),
    ).toBeDisabled()
    await page.getByRole('button', { name: 'Entendi, atualizar carrinho' }).click()
    await expect(page.getByText('Carrinho atualizado com os valores atuais.')).toBeVisible()

    // Price changes again while the collector is on the review dialog.
    await openReview(page)
    await expect(
      reviewDialog(page).getByRole('button', { name: 'Confirmar pagamento de 1.506 ETH' }),
    ).toBeVisible()
    await mock.control((m) => m.setNftPrice('emerald-ape-042', '1.59'))
    await confirmPayment(page)
    await expect(reviewDialog(page).getByText(/mudaram desde a última revisão/)).toBeVisible()
    await expect(
      reviewDialog(page).getByRole('button', { name: 'Confirmar pagamento de 1.606 ETH' }),
    ).toBeVisible()
    expect(await ordersInMockDb(page)).toBe(0)

    await confirmPayment(page)
    await expect(page).toHaveURL(/\/pedido\//, { timeout: 15_000 })
  })

  test('edição esgota durante a navegação e o checkout é bloqueado', async ({ page, mock }) => {
    await mock.boot()
    await login(page)
    await addToCart(page, 'violet-nomad-314', { edition: '1-10' })
    await page.goto('/carrinho')
    await expect(
      page.getByText('Violet Nomad #314').filter({ visible: true }).first(),
    ).toBeVisible()
    await mock.control((m) => m.setAvailability('violet-nomad-314', '1-10', 0))
    await expect(
      page.getByRole('alert').filter({ hasText: 'Violet Nomad #314 (1/10) esgotou.' }),
    ).toBeVisible()
    await expect(page.getByText('Esgotado').filter({ visible: true }).first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Revise as alterações' }).filter({ visible: true }),
    ).toBeDisabled()
  })

  test('preço do catálogo e do detalhe atualiza ao vivo', async ({ page, mock }) => {
    await mock.boot({ path: '/nft/golden-signal-160' })
    await expect(page.getByRole('heading', { level: 1, name: 'Golden Signal #160' })).toBeVisible()
    await mock.control((m) => m.setNftPrice('golden-signal-160', '0.55'))
    await expect(
      page.getByText(/Preço atualizado em tempo real: 0.39 ETH → 0.55 ETH/),
    ).toBeVisible()
  })
})
