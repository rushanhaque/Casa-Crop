/*  Keeping a device off an old build of the site.

    The catalogue endpoint solves stale DATA. This solves stale CODE,
    which is the other half of "every browser shows a different version".

    Entry HTML is served must-revalidate, so a normal load picks up a new
    deploy. Three things get in the way of a normal load:

      · The back/forward cache resurrects a whole page — DOM, module
        state and all — without re-running anything or re-fetching the
        document. Press Back and you are looking at the build that was
        current whenever that page was first opened.
      · Speculation-rules prerendering renders the next document ahead of
        the click. A prerender that has been sitting in the buffer since
        before a deploy is served from it afterwards.
      · A tab left open for days simply never navigates.

    So the running page checks, at the moments it could have gone stale,
    whether the build it came from is still the build being served, and
    reloads itself once if it is not.

    ONCE is the important word. A reload that does not resolve the
    mismatch — a proxy pinning the HTML, an intermediate cache, a host
    mid-deploy serving two builds — would otherwise reload forever, and
    an infinite reload loop is a far worse failure than a stale page.
    The build that was reloaded for is recorded in sessionStorage, and
    the same build never triggers a second one. */

const SEEN_KEY = 'casa-and-crop:reloaded-for-build'

/*  Written by the admin panel's storage layer. Owned there, read here,
    because the one thing this module must never do is reload a panel
    holding work that exists nowhere else yet. */
const DIRTY_KEY = 'casa-and-crop:unpublished'

/*  Replaced at build time. The fallback keeps `vitest`/node imports and
    any non-Vite consumer from throwing on an undefined global. */
const CURRENT = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : ''

let checking = false

async function currentServerBuild() {
  const res = await fetch(`/version.json?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  if (!res.headers.get('content-type')?.includes('json')) return null
  const body = await res.json()
  return typeof body?.buildId === 'string' ? body.buildId : null
}

async function check() {
  if (checking || !CURRENT) return
  if (typeof fetch === 'undefined' || typeof document === 'undefined') return
  if (document.visibilityState !== 'visible') return

  /*  A prerendering document must not reload — it is not on screen, the
      user has not committed to it, and reloading it would throw away the
      work the prerender exists to do. It will be checked again on
      `pageshow`/`focus` once it is actually activated. */
  if (document.prerendering) return

  /*  Never reload over unpublished work.

      The admin panel keeps edits in localStorage until they are
      published. A reload does not destroy them — they are on disk — but
      it does interrupt whatever the operator was in the middle of, and
      it fires the unsaved-work prompt at someone who did not ask for a
      navigation. A stale build is a mild problem; an unexpected reload
      mid-edit is a rude one. It will be picked up on the next reload
      the operator performs themselves, once the work is published. */
  try {
    if (localStorage.getItem(DIRTY_KEY) === 'true') return
  } catch { /* private mode — fall through and check as normal */ }

  checking = true
  try {
    const server = await currentServerBuild()
    if (!server || server === CURRENT) return

    let seen = null
    try { seen = sessionStorage.getItem(SEEN_KEY) } catch { /* private mode */ }
    if (seen === server) return

    try { sessionStorage.setItem(SEEN_KEY, server) } catch { /* private mode */ }
    location.reload()
  } catch {
    /*  Offline, or the file is not deployed. Staying on the current
        build is the correct outcome either way. */
  } finally {
    checking = false
  }
}

if (typeof document !== 'undefined') {
  /*  Deferred past first paint. This check is housekeeping and must
      never compete with the page's own rendering for the network. */
  const schedule = () => setTimeout(check, 1500)

  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
  window.addEventListener('focus', check)
  window.addEventListener('pageshow', (e) => { if (e.persisted) check() })
}

/*  Exported for tests. Nothing in the app calls it — the listeners
    above are the whole interface. */
export { check as __checkBuild }
