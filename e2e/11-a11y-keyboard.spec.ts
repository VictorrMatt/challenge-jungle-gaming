import { AxeBuilder } from '@axe-core/playwright'

import { expect, test } from './fixtures'

test.describe('11. Teclado, foco em diálogos e validação acessível', () => {
  test('skip link e navegação por teclado até o conteúdo', async ({ page, mock }) => {
    await mock.boot()
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    // Headless Chromium may spend the first Tab(s) on the document itself; the skip link must be
    // the first focusable stop inside the page.
    for (
      let attempt = 0;
      attempt < 3 && !(await skip.evaluate((element) => element === document.activeElement));
      attempt++
    ) {
      await page.keyboard.press('Tab')
    }
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()
  })

  test('diálogo de login prende o foco e fecha com Esc', async ({ page, mock, isMobile }) => {
    test.skip(isMobile, 'No mobile o login é uma tela cheia, sem diálogo')
    await mock.boot({ path: '/entrar' })
    const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' })
    await expect(dialog).toBeVisible()
    for (let index = 0; index < 12; index++) {
      await page.keyboard.press('Tab')
      const inside = await dialog.evaluate((element) => element.contains(document.activeElement))
      expect(inside).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/$/)
  })

  test('erros de formulário ficam associados aos campos', async ({ page, mock }) => {
    await mock.boot({ path: '/entrar' })
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    const email = page.getByPlaceholder('contato@email.com')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText(/e-mail válido/)
  })

  for (const path of ['/', '/nft/emerald-ape-042', '/carrinho', '/entrar']) {
    test(`axe: sem violações críticas em ${path}`, async ({ page, mock }) => {
      await mock.boot({ path })
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      const serious = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      )
      expect(
        serious,
        JSON.stringify(serious.map((violation) => [violation.id, violation.nodes.length])),
      ).toEqual([])
    })
  }

  test('sem overflow horizontal nas telas principais', async ({ page, mock }) => {
    await mock.boot()
    await page.evaluate(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nova@kurio.dev', password: 'Kurio2026!' }),
      })
      localStorage.setItem('kurio:session', JSON.stringify(await response.json()))
    })
    for (const path of [
      '/',
      '/nft/emerald-ape-042',
      '/carrinho',
      '/pagamento',
      '/perfil',
      '/perfil/carteiras',
      '/favoritos',
    ]) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, `overflow horizontal em ${path}`).toBeLessThanOrEqual(0)
    }
  })
})
