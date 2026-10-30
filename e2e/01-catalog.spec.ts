import { expect, test } from './fixtures'

test.describe('1. Catálogo: busca, filtros, ordenação, paginação e histórico', () => {
  test('combina filtros, ordena, pagina e restaura pelo histórico', async ({
    page,
    mock,
    isMobile,
  }) => {
    test.skip(isMobile, 'Filtros da sidebar são desktop; o fluxo mobile é coberto abaixo')
    await mock.boot()
    const filters = page.getByRole('complementary', { name: 'Filtros do catálogo' })
    const cards = page.locator('#catalogo article')

    await expect(cards).toHaveCount(9)
    await expect(page.getByRole('button', { name: 'Página 4' })).toBeVisible()

    // Pagination: page 2 is written to the URL.
    await page.getByRole('button', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    // A filter change resets pagination; categories combine (OR) with networks (AND).
    await filters.getByRole('button', { name: /^Arte digital/ }).click()
    await expect(page).not.toHaveURL(/page=2/)
    await filters.getByRole('button', { name: /^Música/ }).click()
    await filters.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(page).toHaveURL(/categories=.*digital-art.*music|categories=.*music.*digital-art/)
    await expect(page).toHaveURL(/networks=/)
    await expect(cards.first()).toBeVisible()
    const filteredCount = await cards.count()
    expect(filteredCount).toBeGreaterThan(0)
    expect(filteredCount).toBeLessThan(9)

    // Sort by lowest price.
    await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    const prices = await page.locator('#catalogo article p.text-highlight').allTextContents()
    const values = prices.map((text) => Number.parseFloat(text))
    expect(values).toEqual(values.toSorted((a, b) => a - b))

    // Search through the header dialog.
    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await page.getByLabel('Termo de busca').fill('emerald')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/q=emerald/)
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Emerald Ape #042')

    // Refresh keeps the state; back restores the previous filter state.
    await page.reload()
    await expect(cards).toHaveCount(1)
    await page.goBack()
    await expect(page).not.toHaveURL(/q=emerald/)
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(filters.getByRole('button', { name: /^Ethereum/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('busca vazia mostra estado vazio e permite limpar filtros', async ({ page, mock }) => {
    await mock.boot({ path: '/?q=nada-por-aqui' })
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page.locator('#catalogo article')).toHaveCount(9)
  })

  test('mobile: busca com debounce e filtros na gaveta', async ({ page, mock, isMobile }) => {
    test.skip(!isMobile, 'Fluxo específico do layout mobile')
    await mock.boot()
    await page.getByRole('searchbox', { name: 'Explorar coleções' }).fill('golden')
    await expect(page).toHaveURL(/q=golden/)
    await expect(page.locator('#catalogo article').first()).toContainText('Golden')
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    await sheet.getByRole('button', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/categories=/)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })
})
