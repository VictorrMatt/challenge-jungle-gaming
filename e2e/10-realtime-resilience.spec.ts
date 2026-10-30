import { confirmPayment, openReview, ordersInMockDb } from './checkout-helpers'
import { addToCart, expect, login, test } from './fixtures'

test.describe('10. Eventos duplicados/antigos, desconexão e retomada de pedido pendente', () => {
  test('eventos duplicados e antigos não regridem o estado mais recente', async ({
    page,
    mock,
  }) => {
    await mock.boot({ path: '/nft/golden-signal-160' })
    await expect(page.getByRole('heading', { level: 1, name: 'Golden Signal #160' })).toBeVisible()
    await mock.control((m) => m.setNftPrice('golden-signal-160', '0.55'))
    await expect(page.getByText(/0.39 ETH → 0.55 ETH/)).toBeVisible()

    // Duplicate delivery (same eventId) and an older version (price 99.99) must be ignored.
    await mock.control((m) => m.socket.replayLastEvent())
    await mock.control((m) => m.socket.sendStaleNftEvent())
    await page.waitForTimeout(300)
    await expect(page.getByText('99.99 ETH')).toHaveCount(0)
    await expect(page.getByText('0.55 ETH').filter({ visible: true }).first()).toBeVisible()
  })

  test('reconexão reconcilia com REST os eventos perdidos', async ({ page, mock }) => {
    await mock.boot({ path: '/nft/golden-signal-160' })
    await expect(page.getByRole('heading', { level: 1, name: 'Golden Signal #160' })).toBeVisible()
    await mock.control((m) => m.socket.interrupt(1500))
    await expect(page.getByText(/Reconectando às atualizações/)).toBeVisible()
    // Change happens while offline: its event is lost, REST reconciliation must recover it.
    await mock.control((m) => m.setNftPrice('golden-signal-160', '0.77'))
    await expect(page.getByText(/Reconectando às atualizações/)).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText('0.77 ETH').filter({ visible: true }).first()).toBeVisible()
  })

  test('pedido pendente sobrevive a queda de conexão e refresh sem duplicar', async ({
    page,
    mock,
  }) => {
    await mock.boot()
    await login(page)
    await addToCart(page, 'golden-beat-207')
    await openReview(page)
    await mock.control((m) => m.setScenario(['default']))
    await confirmPayment(page)
    await expect(page.getByText('Pagamento em processamento')).toBeVisible()

    // Socket drops (order.updated is missed) and the page is reloaded mid-payment.
    await mock.control((m) => m.socket.interrupt(500))
    await page.reload()
    await expect(
      page
        .getByText('Pagamento em processamento')
        .or(page.getByText('Seus NFTs agora estão na sua carteira')),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/pedido\//, { timeout: 15_000 })
    expect(await ordersInMockDb(page)).toBe(1)
  })
})
