/*  Validates vercel.json before the build runs.

    WHY THIS EXISTS

    An invalid vercel.json does not fail loudly. The host rejects the
    deployment, the site keeps serving the last build that worked, and
    the only outward sign is that nothing you push ever appears. Every
    symptom points at the application — publishes that "do not show up",
    devices "stuck on an old version" — and none of them point at the
    config file that is actually refusing to deploy.

    That is precisely what happened here, and it cost two days. A
    vercel.json carrying "//" keys as comments was rejected on every
    push: catalogue updates published from the admin panel reached
    GitHub perfectly and then sat there, because the deploy that would
    have carried them never ran.

    So: the config is checked here, as part of `npm run build`, where a
    mistake fails immediately and says what is wrong. It runs on the
    host too, which turns an opaque "Deployment failed" into a build log
    naming the offending key.

    NOTE FOR ANYONE EDITING vercel.json

    It is strict JSON and every object rejects unknown properties, so it
    cannot carry comments — not "//" keys, not anything. The reasoning
    behind each rule lives with the code that depends on it:
    api/catalogue.js for the catalogue caching, api/photo.js for the
    photo rewrite, src/lib/version.js for the build stamp. */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONFIG = resolve(ROOT, 'vercel.json')
const SCHEMA_URL = 'https://openapi.vercel.sh/vercel.json'

/*  The subset of the schema this project actually uses, kept here so
    the check still works with no network — on a plane, or on a host
    that blocks outbound calls during a build. The live schema is
    preferred when it can be reached, because it is the thing the host
    will actually judge the file by. */
const FALLBACK = {
  top: [
    'cleanUrls', 'trailingSlash', 'headers', 'rewrites', 'redirects',
    'routes', 'regions', 'functions', 'buildCommand', 'outputDirectory',
    'installCommand', 'devCommand', 'framework', 'ignoreCommand',
    'crons', 'images', 'public', 'github', 'git', '$schema',
  ],
  headers: ['source', 'headers', 'has', 'missing'],
  headerPair: ['key', 'value'],
  rewrites: ['source', 'destination', 'has', 'missing', 'statusCode'],
  redirects: ['source', 'destination', 'permanent', 'statusCode', 'has', 'missing'],
}

async function liveSchema() {
  try {
    /*  Raced against a timer rather than aborted through a signal:
        aborting a fetch and then exiting the process trips an assertion
        in libuv on Windows, which turns a clean "config is wrong" exit
        into a crash and an exit code nobody can read. The timer is
        unref'd so it can never hold the process open. */
    const timeout = new Promise((r) => {
      const t = setTimeout(() => r(null), 5000)
      t.unref?.()
    })
    const res = await Promise.race([fetch(SCHEMA_URL), timeout])
    if (!res?.ok) return null
    const schema = await res.json()
    const props = schema?.properties
    if (!props) return null

    const keysOf = (node) => {
      const p = node?.items?.properties || node?.properties
      return p ? Object.keys(p) : null
    }
    return {
      top: Object.keys(props),
      headers: keysOf(props.headers) || FALLBACK.headers,
      headerPair: keysOf(props.headers?.items?.properties?.headers) || FALLBACK.headerPair,
      rewrites: keysOf(props.rewrites) || FALLBACK.rewrites,
      redirects: keysOf(props.redirects) || FALLBACK.redirects,
    }
  } catch {
    return null
  }
}

const problems = []

function checkKeys(where, object, allowed) {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) {
      problems.push(
        `${where} has an unknown property ${JSON.stringify(key)}.`
        + (key.startsWith('/') || key.startsWith('#')
          ? ' vercel.json is strict JSON and cannot carry comments — remove it.'
          : ` Allowed here: ${allowed.join(', ')}.`),
      )
    }
  }
}

let raw
try {
  raw = readFileSync(CONFIG, 'utf-8')
} catch {
  console.log('vercel.json  no config file — nothing to check.')
  raw = null
}

let config = null
if (raw !== null) {
  try {
    config = JSON.parse(raw)
  } catch (err) {
    console.error(`\nvercel.json is not valid JSON: ${err.message}\n`)
    process.exitCode = 1
  }
}

const schema = config ? (await liveSchema()) || FALLBACK : FALLBACK
const source = schema === FALLBACK ? 'bundled key list' : 'live Vercel schema'

if (config) checkKeys('vercel.json', config, schema.top)

for (const [i, rule] of (config?.headers || []).entries()) {
  checkKeys(`headers[${i}]`, rule, schema.headers)
  if (!rule.source) problems.push(`headers[${i}] is missing "source".`)
  if (!Array.isArray(rule.headers)) {
    problems.push(`headers[${i}] is missing a "headers" array.`)
    continue
  }
  for (const [j, pair] of rule.headers.entries()) {
    checkKeys(`headers[${i}].headers[${j}]`, pair, schema.headerPair)
    if (!pair.key || typeof pair.value !== 'string') {
      problems.push(`headers[${i}].headers[${j}] needs a string "key" and "value".`)
    }
  }
}

for (const [i, rule] of (config?.rewrites || []).entries()) {
  checkKeys(`rewrites[${i}]`, rule, schema.rewrites)
  if (!rule.source || !rule.destination) {
    problems.push(`rewrites[${i}] needs both "source" and "destination".`)
  }
}

for (const [i, rule] of (config?.redirects || []).entries()) {
  checkKeys(`redirects[${i}]`, rule, schema.redirects)
}

if (!config) {
  /*  Either there is no config, or it failed to parse and the exit code
      is already set. Nothing further to say. */
} else if (problems.length) {
  console.error('\nvercel.json will be REJECTED by the host, and the deploy will not run:\n')
  for (const p of problems) console.error(`  · ${p}`)
  console.error(`\nChecked against the ${source}.`)
  console.error('Until this is fixed, nothing pushed to the repository reaches the live site.\n')
  process.exitCode = 1
} else {
  const counts = [
    `${(config.headers || []).length} header rule(s)`,
    `${(config.rewrites || []).length} rewrite(s)`,
  ].join(', ')
  console.log(`vercel.json  OK — ${counts}, checked against the ${source}.`)
}
