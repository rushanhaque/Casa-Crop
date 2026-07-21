/*  ─────────────────────────────────────────────────────────────
    THE SHORTLIST

    Not a checkout. This house sells to the trade against a drawing,
    a minimum and an Incoterm — there is no price to total and no
    card to take. What a buyer actually does on a catalogue page is
    mark the pieces worth asking about, and then ask about them in
    one message rather than seven.

    So this is a shortlist that composes an enquiry. It holds SKUs,
    it survives a page load (the site is a real multi-page document —
    a shortlist that emptied itself on every navigation would be
    useless), and it hands the whole list to WhatsApp or to a mail
    client as a prefilled draft the buyer sends themselves.

    A plain module with a subscriber set rather than a framework
    store: three pages need to read it, none of them share a React
    tree, and this is about forty lines.
    ───────────────────────────────────────────────────────────── */

const KEY = 'casa-and-crop:shortlist'

/*  Storage is allowed to fail. Safari in private mode throws on
    setItem, some corporate builds disable it outright, and a buyer
    hitting either of those should get a working shortlist for the
    length of their visit rather than a broken page. */
function read() {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /*  In memory for this visit, then. */
  }
}

let items = typeof window === 'undefined' ? [] : read()

const subscribers = new Set()

function emit() {
  write()
  /*  A fresh array each time: subscribers are React setState calls,
      and a mutated-in-place array would compare equal and never
      re-render. */
  items = items.slice()
  subscribers.forEach((fn) => fn(items))
}

export function getItems() {
  return items
}

export function countItems(list = items) {
  return list.reduce((n, it) => n + it.qty, 0)
}

/**
 * @param {{sku: string, name: string, range: string, spec: string}} piece
 */
export function addItem(piece) {
  const found = items.find((it) => it.sku === piece.sku)
  if (found) {
    found.qty += 1
  } else {
    items.push({ ...piece, qty: 1 })
  }
  emit()
}

export function removeItem(sku) {
  items = items.filter((it) => it.sku !== sku)
  emit()
}

export function setQty(sku, qty) {
  const found = items.find((it) => it.sku === sku)
  if (!found) return
  /*  One is the floor; removing is a separate, deliberate act, so a
      buyer cannot delete a line by leaning on a minus key. */
  found.qty = Math.max(1, Math.min(999, qty))
  emit()
}

export function clearItems() {
  items = []
  emit()
}

export function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/*  Two tabs open on two ranges is a completely ordinary way to shop
    a catalogue, and a shortlist that disagreed with itself between
    them would be a bug the buyer discovers at the worst moment. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    items = read()
    subscribers.forEach((fn) => fn(items))
  })
}

/* ── The enquiry ─────────────────────────────────────────────────
   One message, composed from the list. Deliberately plain text: it
   has to survive being pasted into WhatsApp, a mail client, and
   whatever the buyer's procurement system is. */

export const WHATSAPP = '915912458890'
export const EMAIL = 'export@casaandcrop.com'

export function composeEnquiry(list = items) {
  const lines = list.map(
    (it) =>
      `• ${it.sku} — ${it.name}${it.qty > 1 ? ` (×${it.qty})` : ''}` +
      (it.spec ? `\n  ${it.spec}` : ''),
  )

  return [
    'Casa & Crop — enquiry',
    '',
    'Please quote against the following:',
    '',
    lines.join('\n'),
    '',
    'To confirm: destination, required finish, and quantity per SKU.',
  ].join('\n')
}

export function whatsappHref(list = items) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(composeEnquiry(list))}`
}

export function mailHref(list = items) {
  const n = countItems(list)
  const subject = `Enquiry — ${n} ${n === 1 ? 'piece' : 'pieces'}`
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(composeEnquiry(list))}`
}
