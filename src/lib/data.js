/*  DEMO DATA — the same sheet the range cards quote. One source of
    figures per range keeps the site cross-checkable: the MOQ a buyer
    reads on a card is the MOQ they find here. */
export const RANGES = {
  funeral: {
    name: 'Funeral',
    meta: 'Cast · Spun',
    lede: 'Memorial and cremation ware in cast brass and copper — urns, plaques and keepsakes, finished by hand to an antique standard.',
    subcategories: ['Urns', 'Caskets', 'Memorials', 'Keepsakes'],
    spec: [
      ['Alloy', 'Cast brass / copper'],
      ['Finish', 'Antique, hand-polished'],
    ],
  },
  lighting: {
    name: 'Lighting',
    meta: 'Spun · Plated',
    lede: 'Spun brass shades, bases and fittings, plated to a stated film thickness rather than to appearance alone.',
    subcategories: ['Pendants', 'Chandeliers', 'Sconces', 'Table Lamps'],
    spec: [
      ['Alloy', 'Spun brass, 1.2 mm'],
      ['Finish', 'Nickel / PVD, 12 µm'],
    ],
  },
  kitchenware: {
    name: 'Kitchenware',
    meta: 'Steel · Copper',
    lede: 'Serveware and cookware in 304 steel and ETP copper, mirror-finished and food-safe.',
    subcategories: ['Cookware', 'Utensils', 'Serveware', 'Cutlery'],
    spec: [
      ['Alloy', '304 steel / ETP copper'],
      ['Finish', 'Mirror, food-safe'],
    ],
  },
  decor: {
    name: 'Décor',
    meta: 'Cast · Wrought',
    lede: 'Objects for the room — cast, wrought and waxed, in the antique register the house is known for.',
    subcategories: ['Vases', 'Sculptures', 'Trays', 'Bookends'],
    spec: [
      ['Alloy', 'Gravity die cast brass'],
      ['Finish', 'Antique, waxed'],
    ],
  },
  accessories: {
    name: 'Accessories',
    meta: 'Brass · Zinc',
    lede: 'The small hardware of a finished house — hooks, handles, stays and stands in brass and zinc alloy.',
    subcategories: ['Hooks', 'Handles', 'Knobs', 'Hinges'],
    spec: [
      ['Alloy', 'Brass, zinc alloy'],
      ['Finish', 'Plated, lacquered'],
    ],
  },
  furniture: {
    name: 'Furniture',
    meta: 'Tube · Inlay',
    lede: 'Frames and accent pieces in mild-steel tube with brass inlay, powder-coated to sixty microns.',
    subcategories: ['Tables', 'Seating', 'Shelving', 'Mirrors'],
    spec: [
      ['Alloy', 'MS tube, brass inlay'],
      ['Finish', 'Powder coat, 60 µm'],
    ],
  },
}

export const ORDER = ['funeral', 'lighting', 'kitchenware', 'decor', 'accessories', 'furniture']

/*  Eight reserved plates per range. Products are added manually later;
    the plates are designed so the page is finished-looking while
    empty — a numbered pattern-plate awaiting its casting, not a
    broken image grid. */
export const PLATE_COUNT = 8

/*  A woven arrival for the catalogue: each plate enters by a different
    gesture, cycled by position, so the grid assembles rather than
    fading in as one slab. The .plates grid clips horizontally, so the
    slides' off-positions never reach the page edge. */
export const PLATE_REVEALS = ['slide-right', 'flip-in', 'slide-left', 'slide-up']
