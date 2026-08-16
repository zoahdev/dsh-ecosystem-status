import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const token = process.env.GITHUB_TOKEN ?? ''
const auth = token ? { Authorization: `Bearer ${token}` } : {}

async function gh(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers: { 'User-Agent': 'dsh-ecosystem-status', ...auth } })
  if (!r.ok) throw new Error(`GH ${path}: ${r.status}`)
  return r.json()
}

async function raw(owner, repo, path, ref = 'main') {
  const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`)
  if (!r.ok) throw new Error(`raw ${owner}/${repo}/${path}: ${r.status}`)
  return r.text()
}

const patchesMd = await raw('zoahdev', 'dsh-docs', 'docs/specs/upstream-patches.md')
const patchCount = (patchesMd.match(/^## \d+\./gm) ?? []).length

const registry = JSON.parse(await raw('zoahdev', 'dsh-subscribe', 'data/registry.min.json'))
const plugins = Array.isArray(registry) ? registry : (registry.plugins ?? registry.items ?? [])
const verified = plugins.filter((p) => p?.verified === true).length

const REPOS = [
  'dsh-subscribe', 'dsh-plugin-doctor', 'dsh-shelf', 'dsh-replay', 'dsh-sandbox-audit',
  'dsh-rule-evolve', 'dsh-pet-evolve', 'dsh-tutorials', 'dsh-docs', 'dsh-ecosystem',
  'dsh-github-intelligence', 'dsh-github-release-radar', 'dsh-plugin-search', 'dsh-plugin-template',
  'dsh-plugin-doctor-action', 'dsh-poison-guard', 'dsh-poison-guard-action',
  'dsh-compose-viz', 'dsh-redact', 'dsh-trace', 'dsh-preset-diff',
]
const reposData = await gh('/users/zoahdev/repos?per_page=100&sort=pushed')
const map = new Map(reposData.map((r) => [r.name, r.stargazers_count]))
const repos = REPOS.map((name) => ({ name, stars: map.get(name) ?? 0 }))
const totalStars = repos.reduce((s, r) => s + r.stars, 0)
const generatedAt = new Date().toISOString()

const cards = [
  { k: 'Cherry-pick-ready patches', v: patchCount },
  { k: 'Registry plugins', v: plugins.length },
  { k: 'Verified plugins', v: verified },
  { k: 'Tracked dsh repos', v: REPOS.length },
  { k: 'Stars across dsh repos', v: totalStars },
]
const repoRows = repos.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
  .map((r) => `<tr><td><a href="https://github.com/zoahdev/${r.name}">${r.name}</a></td><td class="num">${r.stars}</td></tr>`).join('')

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
    ${cards.map((c) => `<div class="card"><span class="k">${c.k}</span><span class="v">${c.v}</span></div>`).join('\n    ')}
  </div>
  <h2>Stars by repo</h2>
  <table><thead><tr><th>repo</th><th class="num">stars</th></tr></thead><tbody>
  ${repoRows}
  </tbody></table>
  <footer>auto-refreshed daily by GitHub Actions from real API data.</footer>
</main>
</body>
</html>`

writeFileSync(join(root, 'index.html'), html)
writeFileSync(join(root, 'status.json'), JSON.stringify({ patchCount, plugins: plugins.length, verified, trackedRepos: REPOS.length, totalStars, generatedAt }, null, 2))
console.log(JSON.stringify({ patchCount, plugins: plugins.length, verified, totalStars }))
