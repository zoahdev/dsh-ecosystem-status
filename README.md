# dsh-ecosystem-status

Live, auto-generated status dashboard for the DeepSeek Harness ecosystem work
under `zoahdev` — patches, plugin registry, verified plugins, awesome-list seats,
and per-repo stars. Every number is read from real sources, not hardcoded.

## Metrics

| Metric | Source |
| --- | --- |
| Cherry-pick-ready patches | `dsh-docs/docs/specs/upstream-patches.md` |
| Registry plugins / verified | `dsh-subscribe/data/registry.min.json` |
| awesome seats | `awesome-dsh-plugin` (maintained list) |
| Stars | GitHub API (`gh api users/zoahdev/repos`) |

## Regenerate

```sh
node generate.mjs   # writes index.html
```

Requires `gh` on `PATH` for the live star count (falls back to zero on failure).

## View

Open `index.html` in any browser, or read it directly in this repo. This is a
static artifact and is intentionally **not** hosted on GitHub Pages (to avoid
interfering with the account's custom domain).

---

# dsh-ecosystem-status（中文）

`zoahdev` 名下 DeepSeek Harness 生态工作的实时自动生成状态面板——补丁数、插件注册表、
已认证插件数、awesome 榜单席位、各仓库 star。所有数字都来自真实数据源，不写死。

```sh
node generate.mjs   # 生成 index.html
```

静态产物，故意不挂 GitHub Pages（避免影响账号自定义域名）。用浏览器直接打开 `index.html` 查看。
