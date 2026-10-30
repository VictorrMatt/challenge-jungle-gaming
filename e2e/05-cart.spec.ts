import { addToCart, apiAs, expect, login, test } from './fixtures'

test.describe('5. Carrinho: quantidades, remoção, cupom e persistência', () => {
  test('edita quantidades, remove itens e recalcula o resumo da API', async ({
    page,
    mock,
    isMobile,
  }) => {
    await mock.boot()
    await addToCart(page, 'emerald-ape-042', { quantity: 2 })
    await addToCart(page, 'violet-nomad-314')
    await page.goto('/carrinho')

    const summary = isMobile
      ? page.getByRole('complementary', { name: 'Resumo do pedido' })
      : page.getByRole('complementary', { name: 'Resumo da carteira' })
    await expect(summary.getByText('3.77 ETH')).toBeVisible() // 2×1.19 + 1.39
    await expect(summary.getByText('3.786 ETH')).toBeVisible() // + 0.016 network fee

    await page
      .getByRole('group', { name: 'Quantidade de Violet Nomad #314' })
      .filter({ visible: true })
      .getByRole('button', { name: /Aumentar/ })
      .click()
    await expect(summary.getByText('5.16 ETH')).toBeVisible()

    await page
      .getByRole('button', { name: /Remover Emerald Ape #042/ })
      .filter({ visible: true })
      .click()
    await expect(page.getByText('Emerald Ape #042 removido do carrinho.')).toBeVisible()
    await expect(summary.getByText('2.78 ETH')).toBeVisible()
  })

  test('cupom inválido, expirado, válido e remoção', async ({ page, mock }) => {
    await mock.boot()
    await addToCart(page, 'ivory-baron-088')
    await page.goto('/carrinho')
    const coupon = page
      .getByRole('textbox', { name: 'Código promocional' })
      .filter({ visible: true })
    const apply = page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true })

    await coupon.fill('NAOEXISTE')
    await apply.click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Código promocional inválido.' }).first(),
    ).toBeVisible()
    await expect(coupon).toHaveAttribute('aria-invalid', 'true')

    await coupon.fill('VERAO2025')
    await apply.click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Este código promocional expirou.' }).first(),
    ).toBeVisible()

    await coupon.fill('kurio10')
    await apply.click()
    await expect(
      page
        .getByText(/Cupom KURIO10 aplicado/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
    await expect(page.getByText('(-) 0.179 ETH').filter({ visible: true })).toBeVisible() // 10% of 1.79

    await page
      .getByRole('button', { name: 'Remover', exact: true })
      .filter({ visible: true })
      .click()
    await expect(page.getByText('Cupom removido.')).toBeVisible()
  })

  test('carrinho persiste após refresh e é preservado ao autenticar', async ({ page, mock }) => {
    await mock.boot()
    await addToCart(page, 'golden-beat-207', { quantity: 3 })
    await page.reload()
    await page.goto('/carrinho')
    await expect(page.getByText('Golden Beat #207').filter({ visible: true }).first()).toBeVisible()

    await login(page)
    const cart = await apiAs(page, '/cart')
    const items = (cart.body as { items: Array<{ name: string; quantity: number }> }).items
    expect(items).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Golden Beat #207', quantity: 3 })]),
    )
  })

  test('não permite exceder a disponibilidade da edição', async ({ page, mock }) => {
    await mock.boot()
    await addToCart(page, 'emerald-ape-042', { edition: '1-1' })
    await page.goto('/nft/emerald-ape-042?edicao=1-1')
    await expect(
      page.getByText('Você já tem o máximo disponível desta edição no carrinho (1).'),
    ).toBeVisible()
    await expect(
      page
        .getByRole('button', { name: 'Adicionar ao carrinho' })
        .or(page.getByRole('button', { name: 'Comprar', exact: true }))
        .filter({ visible: true })
        .first(),
    ).toBeDisabled()
  })
})
