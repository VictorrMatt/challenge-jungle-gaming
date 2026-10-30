import { expect, test } from './fixtures'

test.describe('12. Skeletons em carregamento lento, falha e nova tentativa', () => {
  test('skeletons com shimmer no catálogo durante rede lenta', async ({ page, mock }) => {
    await mock.boot({ scenarios: ['slow'], keepLatency: true })
    const skeleton = page.getByRole('status', { name: 'Carregando NFTs' })
    await expect(skeleton).toBeVisible()
    await expect(skeleton.locator('[data-slot=skeleton]').first()).toHaveClass(/animate-shimmer/)
    await expect(page.locator('#catalogo article').first()).toBeVisible({ timeout: 15_000 })
    await expect(skeleton).toBeHidden()
  })

  test('skeleton do detalhe e do resumo do carrinho', async ({ page, mock }) => {
    await mock.boot({ scenarios: ['slow'], keepLatency: true, path: '/nft/emerald-ape-042' })
    await expect(page.getByRole('status', { name: 'Carregando NFT' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({
      timeout: 15_000,
    })
    await page.goto('/carrinho')
    await expect(
      page.getByRole('status', { name: 'Carregando carrinho' }).filter({ visible: true }),
    ).toBeVisible()
  })

  test('falha do servidor mostra erro e recupera com "Tentar novamente"', async ({
    page,
    mock,
  }) => {
    await mock.boot({ scenarios: ['server-error'] })
    await expect(page.getByText('Não foi possível carregar o catálogo')).toBeVisible({
      timeout: 15_000,
    })
    await mock.control((m) => m.setScenario(['fast']))
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('#catalogo article')).toHaveCount(9)
  })

  test('falha transitória é recuperada automaticamente por retry', async ({ page, mock }) => {
    await mock.boot({ scenarios: ['catalog-error'] })
    await expect(page.locator('#catalogo article')).toHaveCount(9, { timeout: 15_000 })
  })

  test('respostas fora de ordem não sobrescrevem o filtro atual', async ({
    page,
    mock,
    isMobile,
  }) => {
    test.skip(isMobile, 'Usa a sidebar de filtros desktop')
    await mock.boot({ scenarios: ['out-of-order'] })
    const filters = page.getByRole('complementary', { name: 'Filtros do catálogo' })
    await expect(page.locator('#catalogo article').first()).toBeVisible({ timeout: 15_000 })
    // First request is slowest, last is fastest: the final UI must match the last filter.
    await filters.getByRole('button', { name: /^Música/ }).click()
    await filters.getByRole('button', { name: /^Jogos/ }).click()
    await expect(page).toHaveURL(/gaming/)
    await page.waitForTimeout(2600)
    const names = await page.locator('#catalogo article h3').allTextContents()
    expect(names.length).toBeGreaterThan(0)
    expect(names).toContain('Golden Signal #160')
  })
})
