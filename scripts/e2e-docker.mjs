#!/usr/bin/env node
/**
 * Runs the Playwright suite inside the official Playwright image — the reference environment of
 * the visual baselines (CI uses the same image).
 *
 * Screenshots depend on font rasterization, which differs between operating systems and even
 * between Linux distributions. Baselines are therefore generated and compared in one pinned image,
 * so `pnpm test:e2e:docker` reproduces exactly what CI checks, on Linux, macOS or Windows.
 *
 * Usage:  pnpm test:e2e:docker [playwright args]      e.g. --project=desktop e2e/visual.spec.ts
 *         pnpm test:e2e:update                         regenerate the visual baselines
 * Needs:  Docker running. The container gets its own node_modules volume, so the host install
 *         (Windows/macOS binaries) is never touched.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import os from 'node:os'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const playwrightVersion = pkg.devDependencies['@playwright/test'].replace(/^[^\d]*/, '')
const image = `mcr.microsoft.com/playwright:v${playwrightVersion}-noble`
const args = process.argv.slice(2)

const docker = [
  'run',
  '--rm',
  '--init',
  '--ipc=host',
  '-v',
  `${process.cwd()}:/work`,
  '-v',
  'kurio-e2e-node-modules:/work/node_modules',
  // Persistent pnpm store: later runs install from cache instead of downloading again.
  '-v',
  'kurio-e2e-pnpm-store:/pnpm-store',
  '-e',
  'npm_config_store_dir=/pnpm-store',
  '-w',
  '/work',
  '-e',
  'CI=1',
  '-e',
  'E2E_VISUAL=1',
  '-e',
  'COREPACK_ENABLE_DOWNLOAD_PROMPT=0',
]
const pnpmVersion = pkg.packageManager.replace(/^pnpm@/, '')
const steps = [
  // Corepack picks the pinned pnpm; images whose Node ships without Corepack fall back to npm.
  `(corepack enable 2>/dev/null || npm install --global pnpm@${pnpmVersion})`,
  'pnpm install --frozen-lockfile',
  `pnpm exec playwright test ${args.map((arg) => `'${arg.replaceAll("'", "'\\''")}'`).join(' ')}`,
]
let command = steps.join(' && ')
// On Linux hosts the container writes as root: hand reports and baselines back to the user.
if (os.platform() === 'linux' && process.getuid) {
  const owner = `${process.getuid()}:${process.getgid()}`
  command = `${command}; status=$?; find . -path ./node_modules -prune -o -user 0 -exec chown ${owner} {} + 2>/dev/null; exit $status`
}
docker.push(image, 'bash', '-lc', command)

console.log(`[e2e:docker] ${image}`)
const result = spawnSync('docker', docker, { stdio: 'inherit' })
if (result.error) {
  console.error(
    [
      `[e2e:docker] Could not start Docker: ${result.error.message}`,
      'Visual baselines are only valid in the reference image, so they are never compared or',
      'regenerated on the host. Without Docker:',
      '  - run the functional suite with `pnpm test:e2e` (visual tests are skipped with the reason);',
      '  - compare or regenerate baselines through GitHub Actions (CI E2E job or the',
      '    "Update visual baselines" workflow), which run in the same image.',
    ].join('\n'),
  )
  process.exit(1)
}
process.exit(result.status ?? 1)
