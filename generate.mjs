import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const work = join(here, '..')

// 1. Patch count from the maintained queue doc.
const patchesMd = readFileSync(join(work, 'dsh-docs', 'docs', 'specs', 'upstream-patches.md'), 'utf8')
const patchCount = (patchesMd.match(/^## \d+\./gm) ?? []).length

// 2. Registry size + verified count from the real registry snapshot.
const registry = JSON.parse(readFileSync(join(work, 'dsh-subscribe', 'data', 'registry.min.json'), 'utf8'))
const plugins = Array.isArray(registry) ? registry : (registry.plugins ?? registry.items ?? [])
const verified = plugins.filter(p => p?.verified === true || p?.flags?.includes?.('verified') || p?.status === 'verified').length

// 3. Live stars for the dsh-* repos (fallback to a snapshot on failure).
const REPOS = [
  'dsh-subscribe', 'dsh-plugin-doctor', 'dsh-shelf', 'dsh-replay', 'dsh-sandbox-audit',
  'dsh-rule-evolve', 'dsh-pet-evolve', 'dsh-tutorials', 'dsh-docs', 'dsh-ecosystem',
  'dsh-github-intelligence', 'dsh-github-release-radar', 'dsh-plugin-search', 'dsh-plugin-template', 'dsh-plugin-doctor-action',
]
let repos = []
try {
  const out = spawnSync('gh', ['api', 'users/zoahdev/repos?per_page=100&sort=pushed', '--jq', '.[] | [.name,.stargazers_count] | @tsv'], { encoding: 'utf8' })
  const map = new Map()
  for (const line of (out.stdout || '').trim().split(/\r?\n/)) {
    const [name, stars] = line.split('\t')
    if (name && stars !== undefined) map.set(name, Number(stars))
  }
  repos = REPOS.map(name => ({ name, stars: map.get(name) ?? 0 }))
} catch {
  repos = REPOS.map(name => ({ name, stars: 0 }))
}

const totalStars = repos.reduce((s, r) => s + r.stars, 0)
const awesomeSeats = ['dsh-subscribe', 'dsh-rule-evolve', 'dsh-pet-evolve', 'dsh-shelf']
const generatedAt = new Date().toISOString()

const cards = [
  { k: 'Cherry-pick-ready patches', v: patchCount, url: 'https://github.com/zoahdev/dsh-docs/blob/main/docs/specs/upstream-patches.md' },
  { k: 'Registry plugins', v: plugins.length, url: 'https://github.com/zoahdev/dsh-subscribe' },
  { k: 'Verified plugins', v: verified, url: 'https://github.com/zoahdev/dsh-subscribe' },
  { k: 'awesome seats', v: awesomeSeats.length, url: 'https://github.com/awesome-dsh-plugin/awesome-dsh-plugin' },
  { k: 'Stars across dsh repos', v: totalStars, url: 'https://github.com/zoahdev' },
]

const repoRows = repos.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
  .map(r => `<tr><td><a href="https://github.com/zoahdev/${r.name}">${r.name}</a></td><td class="num">${r.stars}</td></tr>`).join('')

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>dsh ecosystem status</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: #0d1117; color: #e6edf3; }
  header { padding: 32px 24px 20px; border-bottom: 1px solid #30363d; background: #161b22; }
  h1 { margin: 0 0 6px; font-size: 22px; font-weight: 600; }
  header p { margin: 0; color: #8b949e; font-size: 13px; }
  main { max-width: 920px; margin: 0 auto; padding: 24px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 14px 16px; }
  .card .k { display: block; font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: .04em; }
  .card .v { font-size: 28px; font-weight: 600; color: #58a6ff; }
  h2 { font-size: 16px; font-weight: 600; margin: 20px 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { text-align: left; padding: 7px 10px; border-bottom: 1px solid #21262d; font-size: 14px; }
  th { color: #8b949e; font-weight: 500; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  footer { margin-top: 24px; color: #8b949e; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>DeepSeek Harness ecosystem — zoahdev</h1>
  <p>auto-generated from real data · ${generatedAt}</p>
</header>
<main>
  <div class="cards">
    ${cards.map(c => `<div class="card"><span class="k">${c.k}</span><span class="v">${c.v}</span></div>`).join('\n    ')}
  </div>
  <h2>Stars by repo</h2>
  <table><thead><tr><th>repo</th><th class="num">stars</th></tr></thead><tbody>
  ${repoRows}
  </tbody></table>
  <footer>Sources: patch queue doc, dsh-subscribe registry snapshot, and GitHub API (stars). Regenerate with <code>node generate.mjs</code>.</footer>
</main>
</body>
</html>`

writeFileSync(join(here, 'index.html'), html)
console.log(JSON.stringify({ patchCount, plugins: plugins.length, verified, totalStars, generatedAt }, null, 2))
