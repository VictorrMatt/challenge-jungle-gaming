import { expect, login, test } from './fixtures'

test.describe('4. Favoritos: persistência, falha de mutation e rollback', () => {
  test('favorito persiste por usuário após refresh', async ({ page, mock }) => {
    await mock.boot()
    await login(page)
    await page.goto('/nft/golden-signal-160')
    const toggle = page.getByRole('button', { name: /^Favoritar$/ }).filter({ visible: true })
    await toggle.click()
    await expect(
      page.getByText('Golden Signal #160 adicionado à lista de interesse.'),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('button', { name: /Favoritado|Remover da lista/ }).filter({ visible: true }),
    ).toHaveAttribute('aria-pressed', 'true')
    await page.goto('/favoritos')
    await expect(page.locator('article')).toContainText(['Golden Signal #160'])
  })

  test('falha na mutation reverte o estado otimista e informa o erro', async ({ page, mock }) => {
    await mock.boot({ scenarios: ['favorites-error'] })
    await login(page)
    await page.goto('/nft/golden-signal-160')
    const toggle = page
      .getByRole('button', { name: /^(Favoritar|Favoritado|Remover da lista de interesse)$/ })
      .filter({ visible: true })
    await toggle.click()
    await expect(page.getByText(/Não foi possível favoritar Golden Signal #160/)).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    // Recovery: once the backend is healthy the same action succeeds.
    await mock.control((m) => m.setScenario(['fast']))
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  test('visitante é enviado ao login ao favoritar', async ({ page, mock }) => {
    await mock.boot({ path: '/nft/golden-signal-160' })
    await page
      .getByRole('button', { name: /^Favoritar$/ })
      .filter({ visible: true })
      .click()
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
  })
})
