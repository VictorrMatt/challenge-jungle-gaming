import { expect, login, test } from './fixtures'

// 1×1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

test.describe('8. Perfil, avatar, senha e carteiras com validação', () => {
  test('edita perfil com validação e persiste após refresh', async ({ page, mock }) => {
    await mock.boot()
    await login(page, undefined, '/perfil')
    await page.getByRole('main').getByLabel('E-mail').fill('email-invalido')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('main').getByLabel('E-mail')).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    // Conflict returned by the API is shown on the field.
    await page.getByRole('main').getByLabel('E-mail').fill('theo@kurio.dev')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()

    await page.getByRole('main').getByLabel('E-mail').fill('nova@kurio.dev')
    await page.getByRole('main').getByLabel('Nome de exibição').fill('Nova S.')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('main').getByLabel('Nome de exibição')).toHaveValue('Nova S.')
  })

  test('envia e remove avatar', async ({ page, mock }) => {
    await mock.boot()
    await login(page, undefined, '/perfil')
    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG })
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Seu avatar atual' })).toBeVisible()
    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByText('Avatar removido.')).toBeVisible()
  })

  test('alteração de senha valida senha atual e confirmação', async ({ page, mock }) => {
    await mock.boot()
    await login(page, undefined, '/perfil')
    await page.getByRole('main').getByLabel('Senha atual').fill('errada123')
    await page.getByRole('main').getByLabel('Nova senha', { exact: true }).fill('NovaSenha2026')
    await page.getByRole('main').getByLabel('Confirmar nova senha').fill('Diferente2026')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('As senhas não conferem')).toBeVisible()

    await page.getByRole('main').getByLabel('Confirmar nova senha').fill('NovaSenha2026')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()

    await page.getByRole('main').getByLabel('Senha atual').fill('Kurio2026!')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Senha alterada com sucesso.')).toBeVisible()
  })

  test('carteiras: valida endereço e salva a secundária', async ({ page, mock }) => {
    await mock.boot()
    await login(page, undefined, '/perfil/carteiras')
    const primary = page.getByRole('region', { name: 'Carteira principal' })
    await primary.getByLabel('Endereço da carteira').fill('0x123')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(primary.getByText(/Informe um endereço 0x/)).toBeVisible()

    // Nova already has a secondary wallet; editing it with the primary address conflicts.
    const secondary = page.getByRole('region', { name: 'Carteira secundária' })
    await secondary
      .getByLabel('Endereço da carteira')
      .fill('0xA91F3c5D8e2B7a4F6c1D9e8B3a7C5d2E4f6aE82C')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      secondary.getByText('Este endereço já está cadastrado na outra carteira.'),
    ).toBeVisible()

    await secondary
      .getByLabel('Endereço da carteira')
      .fill('0x1111111111111111111111111111111111111111')
    await secondary.getByLabel('Apelido da carteira').fill('Cofre')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('region', { name: 'Carteira secundária' }).getByLabel('Apelido da carteira'),
    ).toHaveValue('Cofre')
  })
})
