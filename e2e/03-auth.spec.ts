import { addToCart, apiAs, expect, login, test, USERS } from './fixtures'

test.describe('3. Cadastro, login, expiração, logout e troca de usuário', () => {
  test('cadastro valida campos e trata conflito; conta nova entra logada', async ({
    page,
    mock,
  }) => {
    await mock.boot({ path: '/cadastro' })
    await page.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
    await expect(page.getByPlaceholder('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')

    await page.getByPlaceholder('Nome de usuário').fill('nova.sato')
    await page.getByPlaceholder('Digite seu e-mail', { exact: true }).fill(USERS.nova.email)
    await page.getByPlaceholder('Senha', { exact: true }).fill('abc12345')
    await page.getByPlaceholder('Confirmar senha').fill('abc12345')
    await page.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(page.getByPlaceholder('Digite seu e-mail', { exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    await page.getByPlaceholder('Nome de usuário').fill('lia.okada')
    await page.getByPlaceholder('Digite seu e-mail', { exact: true }).fill('lia@kurio.dev')
    await page.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
    await expect(page.getByText(/Conta criada!/)).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
  })

  test('login inválido mostra erro; válido retorna ao fluxo anterior', async ({ page, mock }) => {
    await mock.boot({ path: '/entrar?redirect=%2Fperfil' })
    await page.getByPlaceholder('contato@email.com').fill(USERS.nova.email)
    await page.getByPlaceholder('***********').fill('senha-errada1')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' }),
    ).toBeVisible()
    await page.getByPlaceholder('***********').fill(USERS.nova.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByRole('main').getByLabel('Nome de exibição')).toHaveValue('Nova Sato')
  })

  test('rota privada redireciona e sessão sobrevive ao refresh', async ({ page, mock }) => {
    await mock.boot({ path: '/perfil/carteiras' })
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    await login(page, USERS.nova)
    await page.goto('/perfil/carteiras')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  })

  test('expiração durante a navegação preserva o contexto para retomada', async ({
    page,
    mock,
  }) => {
    await mock.boot()
    await login(page, USERS.nova, '/perfil')
    await expect(page.getByRole('main').getByLabel('Nome de exibição')).toHaveValue('Nova Sato')
    await mock.control((m) => m.expireSessions())
    await page
      .getByRole('navigation', { name: 'Meu perfil' })
      .getByRole('link', { name: 'Carteiras' })
      .click()
    await expect(page.getByText(/Sua sessão expirou/)).toBeVisible()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil/)
    await page.getByPlaceholder('contato@email.com').fill(USERS.nova.email)
    await page.getByPlaceholder('***********').fill(USERS.nova.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/perfil/)
  })

  test('sessão expira pelo tempo (relógio controlado) e o checkout é retomado após novo login', async ({
    page,
    mock,
  }) => {
    await page.clock.install()
    await mock.boot({ scenarios: ['session-expired'] }) // sessions last 20 s in this scenario
    await login(page)
    await addToCart(page, 'golden-beat-207')
    await page.goto('/pagamento')
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await page.clock.fastForward(21_000)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
    // A single notice (no duplicated error toast from the checkout).
    expect(await page.getByText(/Sua sessão expirou/).count()).toBeLessThanOrEqual(1)

    await page.getByPlaceholder('contato@email.com').fill(USERS.nova.email)
    await page.getByPlaceholder('***********').fill(USERS.nova.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  })

  test('logout e troca de usuário não vazam dados privados', async ({ page, mock }) => {
    await mock.boot()
    await login(page, USERS.nova)
    await addToCart(page, 'golden-beat-207')
    await page.goto('/favoritos')
    await expect(page.locator('article')).toContainText(['Emerald Ape #042'])

    await page.goto('/perfil')
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()

    await login(page, USERS.theo)
    await page.goto('/favoritos')
    await expect(page.getByText('Sua lista está vazia')).toBeVisible()
    const cart = await apiAs(page, '/cart')
    expect((cart.body as { items: unknown[] }).items).toHaveLength(0)
    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })
})
