import { expect, test } from './fixtures'

test.describe('2. Detalhe: acesso direto e recurso inexistente', () => {
  test('abre o detalhe por URL direta com galeria, edição e preço', async ({ page, mock }) => {
    await mock.boot({ path: '/nft/emerald-ape-042' })
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByRole('radio', { name: '1/50' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('1.19 ETH').filter({ visible: true }).first()).toBeVisible()
  })

  test('NFT inexistente mostra página de não encontrado', async ({ page, mock }) => {
    await mock.boot({ path: '/nft/nao-existe-123' })
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Explorar o mercado' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('edição esgotada fica indisponível e a quantidade respeita o limite', async ({
    page,
    mock,
  }) => {
    // Sage Nomad #009 has its 1/1 edition sold out in the seed.
    await mock.boot({ path: '/nft/sage-nomad-009' })
    await expect(page.getByRole('radio', { name: '1/1 (esgotada)' })).toBeDisabled()

    // The 1/10 edition allows at most its availability (and 10 per order).
    await page.getByRole('radio', { name: '1/10' }).click()
    await expect(page).toHaveURL(/edicao=1-10/)
    const increase = page
      .getByRole('button', { name: /Aumentar quantidade/ })
      .filter({ visible: true })
    for (let index = 0; index < 12; index++) {
      if (await increase.isDisabled()) break
      await increase.click()
    }
    await expect(increase).toBeDisabled()
    await expect(increase).toHaveAccessibleName(/máximo/)
  })

  test('rota inexistente mostra 404', async ({ page, mock }) => {
    await mock.boot({ path: '/rota/que/nao/existe' })
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })
})
