/*  Answers one question: is what I pushed actually on the live site?

    That question turned out to be the whole problem. Publishing from
    the admin panel worked perfectly — the catalogue reached GitHub
    every time — while the host quietly refused to deploy any of it.
    From the browser the two are indistinguishable: you press Publish,
    it says Published, and the site keeps showing what it showed before.

    So this checks the live site directly and reports what it finds:
    whether the deploy pipeline is running at all, which commit is
    serving, and whether each route the catalogue depends on exists.

    Run it any time the site looks out of date:

      npm run check:live                                             */

import { execSync } from 'node:child_process'

const SITE = process.env.SITE_URL || 'https://www.casaandcrop.com'
const REPO = process.env.GITHUB_REPO_SLUG || 'rushanhaque/Casa-Crop'

const ok = (s) => `  OK    ${s}`
const bad = (s) => `  FAIL  ${s}`
const info = (s) => `        ${s}`

let failures = 0
const fail = (msg) => { failures += 1; console.log(bad(msg)) }

async function getJSON(url, init) {
  const res = await fetch(url, { ...init, cache: 'no-store' })
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { /* not JSON */ }
  return { status: res.status, body, text, headers: res.headers }
}

console.log(`\nChecking ${SITE}\n`)

/* ── 1. Is the host deploying at all? ──────────────────────────── */

console.log('Deploy pipeline')
let localHead = null
try {
  localHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
} catch { /* not a git checkout */ }

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  const unpushed = execSync(`git log origin/${branch}..HEAD --oneline`, { encoding: 'utf-8' }).trim()
  if (unpushed) {
    fail('there are commits that have not been pushed yet:')
    for (const line of unpushed.split('\n')) console.log(info(line))
  } else {
    console.log(ok(`everything on ${branch} is pushed`))
  }
} catch { /* no upstream configured */ }

if (localHead) {
  const { body } = await getJSON(`https://api.github.com/repos/${REPO}/commits/${localHead}/status`)
  const state = body?.state
  const vercel = (body?.statuses || []).find(s => /vercel/i.test(s.context))
  if (state === 'failure' || vercel?.state === 'failure') {
    fail(`the host REFUSED to deploy ${localHead.slice(0, 7)} — nothing you pushed is live`)
    if (vercel?.description) console.log(info(vercel.description))
    console.log(info('Run `npm run check:config` first; an invalid vercel.json is the usual cause.'))
    console.log(info(vercel?.target_url || `https://github.com/${REPO}/commit/${localHead}`))
  } else if (state === 'pending') {
    console.log(info(`deploy of ${localHead.slice(0, 7)} is still running — re-run this in a minute`))
  } else if (state === 'success') {
    console.log(ok(`the host deployed ${localHead.slice(0, 7)}`))
  } else {
    console.log(info(`no deploy status reported for ${localHead.slice(0, 7)} yet`))
  }
}

/* ── 2. Which build is actually serving? ───────────────────────── */

console.log('\nLive build')
const version = await getJSON(`${SITE}/version.json?t=${Date.now()}`)
if (version.status !== 200 || !version.body?.buildId) {
  fail('/version.json is not being served — the live site predates the current code')
} else {
  console.log(ok(`build ${version.body.buildId}, built ${version.body.builtAt}`))
}

/* ── 3. Do the catalogue routes exist? ─────────────────────────── */

console.log('\nCatalogue routes')
const live = await getJSON(`${SITE}/api/catalogue?fresh=${Date.now()}`)
if (live.status !== 200 || !Array.isArray(live.body?.products)) {
  fail(`/api/catalogue answered ${live.status} — publishes will wait for a rebuild instead of appearing at once`)
} else {
  console.log(ok(`/api/catalogue — ${live.body.products.length} product(s), published ${live.body.updatedAt}`))
}

const stat = await getJSON(`${SITE}/products.json`)
if (stat.status !== 200 || !Array.isArray(stat.body?.products)) {
  fail(`/products.json answered ${stat.status}`)
} else {
  console.log(ok(`/products.json — ${stat.body.products.length} product(s), published ${stat.body.updatedAt}`))
}

/*  An empty payload is rejected before anything is written, so this
    asks "does the endpoint exist and hold a credential" without
    publishing anything. */
for (const route of ['/api/publish', '/api/photo-blob']) {
  const probe = await getJSON(`${SITE}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (probe.status === 404) fail(`${route} does not exist on the live site`)
  else if (probe.body?.error === 'not-configured') fail(`${route} exists but GITHUB_TOKEN is not set on the host`)
  else console.log(ok(`${route} — present and holding a credential`))
}

/* ── 4. Are the photos filed, or still inside the catalogue? ───── */

console.log('\nProduct photos')
const products = live.body?.products || stat.body?.products || []
const inline = products.filter(p => typeof p?.photo === 'string' && p.photo.startsWith('data:'))
if (!products.length) {
  console.log(info('no products in the catalogue yet'))
} else if (inline.length) {
  console.log(info(`${inline.length} of ${products.length} photo(s) still stored inside the catalogue`))
  console.log(info('publish once from the admin panel to move them out to files'))
} else {
  console.log(ok(`all ${products.length} photo(s) stored as files`))
}

for (const p of products) {
  if (typeof p?.photo !== 'string' || !p.photo.startsWith('/product-photos/')) continue
  const res = await fetch(`${SITE}${p.photo}`, { method: 'HEAD', cache: 'no-store' })
  if (res.ok) console.log(ok(`${p.photo} — ${res.headers.get('cache-control') || 'no cache header'}`))
  else fail(`${p.photo} answered ${res.status} for "${p.name}"`)
}

/* ── 5. Caching that would pin a device to an old version ──────── */

console.log('\nCaching')
for (const [path, want, why] of [
  ['/', 'max-age=0', 'the page document must be revalidated or devices keep old code'],
  ['/admin', 'no-store', 'the panel must never come from a disk cache'],
  ['/version.json', 'no-store', 'a cached build stamp defeats the stale-build check'],
]) {
  const res = await fetch(`${SITE}${path}`, { cache: 'no-store' })
  const cc = res.headers.get('cache-control') || ''
  if (cc.includes(want)) console.log(ok(`${path} — ${cc}`))
  else fail(`${path} — ${cc || 'no Cache-Control'} (expected ${want}; ${why})`)
}

console.log(
  failures
    ? `\n${failures} problem(s). The live site is NOT fully up to date.\n`
    : '\nEverything checks out — the live site is serving the current build.\n',
)
process.exitCode = failures ? 1 : 0
