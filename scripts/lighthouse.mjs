#!/usr/bin/env node
/**
 * Lighthouse audit (versioned config: lighthouse/lighthouse.config.json).
 *
 * Audits the optimized demo build (served by `vite preview`) with the default mock scenario:
 * every page × profile is measured N times and the MEDIAN score per category is reported.
 * Outputs (lighthouse/reports/):
 *   - <page>-<profile>-run<N>.report.html / .report.json  (every run)
 *   - summary.json / summary.md                           (medians, LCP/CLS/TBT, environment)
 *
 * Usage: pnpm build && pnpm preview --port 4173 &  pnpm audit:lighthouse
 * Env:   LH_BASE_URL (default http://localhost:4173), CHROME_PATH, LH_RUNS (default 3)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const config = JSON.parse(await readFile(path.resolve('lighthouse/lighthouse.config.json'), 'utf8'))
const BASE_URL = process.env.LH_BASE_URL ?? config.baseUrl
const RUNS = Number(process.env.LH_RUNS ?? config.runs)
const OUT = path.resolve('lighthouse/reports')
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

const median = (values) => {
  const sorted = values.toSorted((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

await mkdir(OUT, { recursive: true })
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
})

const results = []
try {
  for (const page of config.pages) {
    for (const profile of config.profiles) {
      const runs = []
      for (let run = 1; run <= RUNS; run++) {
        const flags = {
          port: chrome.port,
          output: ['html', 'json'],
          onlyCategories: CATEGORIES,
          logLevel: 'error',
        }
        const result = await lighthouse(
          `${BASE_URL}${page.path}`,
          flags,
          profile === 'desktop' ? desktopConfig : undefined,
        )
        if (!result) throw new Error(`Lighthouse returned no result for ${page.path}`)
        const [html, json] = result.report
        const base = path.join(OUT, `${page.name}-${profile}-run${run}`)
        await writeFile(`${base}.report.html`, html)
        await writeFile(`${base}.report.json`, json)
        const { categories, audits } = result.lhr
        runs.push({
          scores: Object.fromEntries(
            CATEGORIES.map((id) => [id, Math.round((categories[id]?.score ?? 0) * 100)]),
          ),
          lcp: audits['largest-contentful-paint'].numericValue,
          cls: audits['cumulative-layout-shift'].numericValue,
          tbt: audits['total-blocking-time'].numericValue,
        })
        console.log(`[lighthouse] ${page.name} ${profile} run ${run}:`, runs.at(-1).scores)
      }
      results.push({
        page: page.name,
        path: page.path,
        profile,
        median: Object.fromEntries(
          CATEGORIES.map((id) => [id, median(runs.map((run) => run.scores[id]))]),
        ),
        lcpMs: Math.round(median(runs.map((run) => run.lcp))),
        cls: Number(median(runs.map((run) => run.cls)).toFixed(3)),
        tbtMs: Math.round(median(runs.map((run) => run.tbt))),
        runs,
      })
    }
  }
} finally {
  await chrome.kill()
}

const lighthouseVersion = JSON.parse(
  await readFile(path.resolve('node_modules/lighthouse/package.json'), 'utf8'),
).version
const environment = {
  date: new Date().toISOString(),
  lighthouse: lighthouseVersion,
  node: process.version,
  os: `${os.type()} ${os.release()} (${os.arch()})`,
  cpus: os.cpus().length,
  baseUrl: BASE_URL,
  runsPerPage: RUNS,
  scenario: 'default (MSW)',
  throttling: {
    mobile: 'Lighthouse default (simulated Slow 4G, 4x CPU)',
    desktop: 'Lighthouse desktop preset',
  },
}
await writeFile(path.join(OUT, 'summary.json'), JSON.stringify({ environment, results }, null, 2))

const targets = config.targets
const row = (result) =>
  `| ${result.page} | ${result.profile} | ${CATEGORIES.map((id) => `${result.median[id]}${result.median[id] < targets[id] ? ' ⚠️' : ''}`).join(' | ')} | ${result.lcpMs} ms | ${result.cls} | ${result.tbtMs} ms |`
const markdown = [
  '# Lighthouse — medianas',
  '',
  `Gerado em ${environment.date} · Lighthouse ${environment.lighthouse} · Node ${environment.node} · ${environment.os} · ${environment.cpus} CPUs`,
  `${RUNS} execuções por página/perfil, cenário padrão dos mocks, build de produção (\`vite preview\`).`,
  '',
  '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...results.map(row),
  '',
  `Metas: Performance ≥ ${targets.performance}, Accessibility ≥ ${targets.accessibility}, Best Practices ≥ ${targets['best-practices']}, SEO ≥ ${targets.seo}.`,
].join('\n')
await writeFile(path.join(OUT, 'summary.md'), `${markdown}\n`)
console.log(`\n${markdown}`)
