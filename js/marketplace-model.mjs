// OfficeStation(TM) Marketplace listing model. Shared by the site build (node), the public
// sell form and the dash editor (browser), so a listing reads the same everywhere.
// Listings are written in Office Station's own words from structured fields; nothing a
// third party typed is published verbatim.

// Every Office Station metro. [name, state, lat, lng, US group, region label (default "Greater <name>")]
// Coordinates are the metro centre, used to match a visitor to their nearest market.
const M = {
  "phoenix-az": ["Phoenix", "AZ", 33.4484, -112.074, "Southwest"],
  "tucson-az": ["Tucson", "AZ", 32.2226, -110.9747, "Southwest"],
  "flagstaff-az": ["Flagstaff", "AZ", 35.1983, -111.6513, "Southwest"],
  "las-vegas-nv": ["Las Vegas", "NV", 36.1699, -115.1398, "Southwest"],
  "albuquerque-nm": ["Albuquerque", "NM", 35.0844, -106.6504, "Southwest"],
  "los-angeles-ca": ["Los Angeles", "CA", 34.0522, -118.2437, "West Coast"],
  "orange-county-ca": ["Orange County", "CA", 33.7175, -117.8311, "West Coast", "Orange County"],
  "san-diego-ca": ["San Diego", "CA", 32.7157, -117.1611, "West Coast"],
  "northern-california": ["Northern California", "CA", 37.7749, -122.4194, "West Coast", "Northern California"],
  "portland-or": ["Portland", "OR", 45.5152, -122.6784, "West Coast"],
  "seattle-wa": ["Seattle", "WA", 47.6062, -122.3321, "West Coast"],
  "reno-nv": ["Reno", "NV", 39.5296, -119.8138, "Mountain West"],
  "salt-lake-city-ut": ["Salt Lake City", "UT", 40.7608, -111.891, "Mountain West"],
  "denver-co": ["Denver", "CO", 39.7392, -104.9903, "Mountain West"],
  "dallas-fort-worth-tx": ["Dallas-Fort Worth", "TX", 32.7767, -96.797, "Texas & Plains", "the Dallas-Fort Worth area"],
  "houston-tx": ["Houston", "TX", 29.7604, -95.3698, "Texas & Plains"],
  "austin-tx": ["Austin", "TX", 30.2672, -97.7431, "Texas & Plains"],
  "san-antonio-tx": ["San Antonio", "TX", 29.4241, -98.4936, "Texas & Plains"],
  "oklahoma-city-ok": ["Oklahoma City", "OK", 35.4676, -97.5164, "Texas & Plains"],
  "omaha-ne": ["Omaha", "NE", 41.2565, -95.9345, "Texas & Plains"],
  "kansas-city-mo": ["Kansas City", "MO", 39.0997, -94.5786, "Texas & Plains"],
  "st-louis-mo": ["St. Louis", "MO", 38.627, -90.1994, "Midwest"],
  "minneapolis-mn": ["Minneapolis-St. Paul", "MN", 44.9778, -93.265, "Midwest", "the Twin Cities"],
  "milwaukee-wi": ["Milwaukee", "WI", 43.0389, -87.9065, "Midwest"],
  "chicago-il": ["Chicago", "IL", 41.8781, -87.6298, "Midwest"],
  "detroit-mi": ["Detroit", "MI", 42.3314, -83.0458, "Midwest"],
  "grand-rapids-mi": ["Grand Rapids", "MI", 42.9634, -85.6681, "Midwest"],
  "indianapolis-in": ["Indianapolis", "IN", 39.7684, -86.1581, "Midwest"],
  "columbus-oh": ["Columbus", "OH", 39.9612, -82.9988, "Midwest"],
  "cleveland-oh": ["Cleveland", "OH", 41.4993, -81.6944, "Midwest"],
  "cincinnati-oh": ["Cincinnati", "OH", 39.1031, -84.512, "Midwest"],
  "pittsburgh-pa": ["Pittsburgh", "PA", 40.4406, -79.9959, "Northeast"],
  "new-york-ny": ["New York City", "NY", 40.7128, -74.006, "Northeast", "Greater New York"],
  "northern-new-jersey": ["Northern New Jersey", "NJ", 40.7357, -74.1724, "Northeast", "Northern New Jersey"],
  "boston-ma": ["Boston", "MA", 42.3601, -71.0589, "Northeast"],
  "philadelphia-pa": ["Philadelphia", "PA", 39.9526, -75.1652, "Northeast"],
  "baltimore-md": ["Baltimore", "MD", 39.2904, -76.6122, "Northeast"],
  "washington-dc": ["Washington, D.C.", "DC", 38.9072, -77.0369, "Northeast", "Greater Washington, D.C."],
  "atlanta-ga": ["Atlanta", "GA", 33.749, -84.388, "Southeast"],
  "charlotte-nc": ["Charlotte", "NC", 35.2271, -80.8431, "Southeast"],
  "raleigh-durham-nc": ["Raleigh-Durham", "NC", 35.8992, -78.8636, "Southeast", "the Research Triangle"],
  "nashville-tn": ["Nashville", "TN", 36.1627, -86.7816, "Southeast"],
  "miami-fl": ["Miami", "FL", 25.7617, -80.1918, "Southeast", "South Florida"],
  "tampa-fl": ["Tampa", "FL", 27.9506, -82.4572, "Southeast", "Tampa Bay"],
  "orlando-fl": ["Orlando", "FL", 28.5383, -81.3792, "Southeast", "Central Florida"],
};
const PHX_AREAS = ["Phoenix", "Scottsdale", "Tempe", "Mesa", "Chandler", "Gilbert", "Glendale", "Peoria", "Surprise", "Goodyear", "Avondale", "Queen Creek", "Buckeye", "Cave Creek", "Fountain Hills", "Paradise Valley", "Sun City", "Tolleson", "Apache Junction"];
export const MARKETS = Object.fromEntries(Object.entries(M).map(([slug, [name, state, lat, lng, group, region]]) => [slug, {
  name, state, lat, lng, group, region: region || `Greater ${name}`,
  areas: slug === "phoenix-az" ? PHX_AREAS : [name.replace(/-.*/, "")],
}]));
export const GROUPS = ["Southwest", "West Coast", "Mountain West", "Texas & Plains", "Midwest", "Northeast", "Southeast"];
export const HOME_MARKET = "phoenix-az";

// nearest market to a point, in straight-line miles
export function nearestMarket(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const rad = Math.PI / 180;
  let best = null;
  for (const [slug, m] of Object.entries(MARKETS)) {
    const dLat = (m.lat - lat) * rad, dLng = (m.lng - lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat * rad) * Math.cos(m.lat * rad) * Math.sin(dLng / 2) ** 2;
    const d = 2 * 3958.8 * Math.asin(Math.sqrt(h));
    if (!best || d < best.miles) best = { slug, miles: Math.round(d) };
  }
  return best;
}

export const CATEGORIES = {
  cubicles: { label: "Cubicles & workstations", noun: "workstations", one: "workstation" },
  benching: { label: "Benching & desking", noun: "benching stations", one: "benching station" },
  seating: { label: "Office chairs", noun: "chairs", one: "chair" },
  desks: { label: "Desks & private offices", noun: "desks", one: "desk" },
  storage: { label: "Files & storage", noun: "storage pieces", one: "storage piece" },
  tables: { label: "Conference & tables", noun: "tables", one: "table" },
  other: { label: "Other office furniture", noun: "pieces", one: "piece" },
};

export const CONDITIONS = {
  A: { label: "Grade A", blurb: "Clean, complete and ready to install with minimal wear." },
  B: { label: "Grade B", blurb: "Solid and complete with light, visible wear consistent with office use." },
  C: { label: "Grade C", blurb: "Serviceable, priced for budget and back-office areas; visible wear." },
};

export const STATUSES = ["draft", "live", "sold", "archived"];

const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const int = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : null; };
export const slugify = (s) => clean(s).toLowerCase().replace(/&/g, "and").replace(/[″"]/g, "in").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70).replace(/-$/, "");
export const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

// Normalises a size typed as 6x6, 6' x 6', 6 X 8 ... to "6' x 6'"
export function sizeLabel(v) {
  const m = /(\d{1,2})\s*['′]?\s*[x×by]+\s*(\d{1,2})/i.exec(String(v || ""));
  return m ? `${m[1]}' x ${m[2]}'` : clean(v);
}
const sizeShort = (v) => { const m = /(\d{1,2})\s*['′]?\s*[x×by]+\s*(\d{1,2})/i.exec(String(v || "")); return m ? `${m[1]}x${m[2]}` : ""; };

export function title(l) {
  const cat = CATEGORIES[l.category] || CATEGORIES.other;
  const qty = int(l.qty);
  const make = clean([l.brand, l.series].filter(Boolean).join(" "));
  const size = sizeShort(l.size);
  const noun = qty === 1 ? cat.one : cat.noun;
  const head = [qty ? String(qty) : "", make, size, noun.replace(/^./, (c) => c.toUpperCase())].filter(Boolean).join(" ");
  const panel = l.category === "cubicles" && int(l.panelHeight) ? `, ${int(l.panelHeight)}″ panels` : "";
  const where = l.area ? ` in ${clean(l.area)}` : "";
  return clean(head + panel + where);
}

export function slugFor(l) {
  return slugify(title(l)) + "-" + String(l.id || "").slice(-5).toLowerCase();
}

// deterministic variety: the same listing always reads the same, different listings read differently
function pick(seed, arr) {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

export function describe(l) {
  const cat = CATEGORIES[l.category] || CATEGORIES.other;
  const qty = int(l.qty);
  const make = clean([l.brand, l.series].filter(Boolean).join(" "));
  const size = sizeLabel(l.size);
  const cond = CONDITIONS[l.condition];
  const mk = MARKETS[l.market] || MARKETS[HOME_MARKET];
  const area = clean(l.area) || mk.region;
  const noun = qty === 1 ? cat.one : cat.noun;
  const what = [qty ? String(qty) : "", make, noun].filter(Boolean).join(" "); // "16 Herman Miller Action Office workstations"
  const each = size && l.category !== "seating" ? `, each ${size}` : "";
  const s = [];

  s.push(pick(l.id + "a", [
    `${qty && qty > 1 ? "A matched set of " : ""}${what}${each}, available now in ${area}.`,
    `Available in ${area}: ${what}${each}.`,
    `${what.replace(/^./, (c) => c.toUpperCase())}${each}, coming out of an office in ${area} and ready for a new floor.`,
  ]));

  const specs = [];
  const ph = int(l.panelHeight), pf = clean(l.panelFinish).toLowerCase();
  if (ph || pf) specs.push([ph ? `${ph}″` : "", pf, "panels"].filter(Boolean).join(" "));
  if (clean(l.worksurface)) specs.push(`${clean(l.worksurface).toLowerCase()} worksurfaces`);
  if (clean(l.storage)) specs.push(clean(l.storage).toLowerCase());
  if (l.power === "yes") specs.push("powered, electrical components included");
  if (l.power === "no") specs.push("non-powered");
  if (specs.length) s.push(pick(l.id + "b", [`Details: ${specs.join("; ")}.`, `What's included: ${specs.join("; ")}.`, `Specs: ${specs.join("; ")}.`]));

  if (cond) s.push(`${cond.label}: ${cond.blurb}`);
  if (clean(l.features)) s.push(clean(l.features).replace(/([^.!?])$/, "$1."));

  s.push(pick(l.id + "c", [
    `Office Station can deliver, install and reconfigure ${qty === 1 ? `this ${cat.one}` : `these ${cat.noun}`} anywhere in ${mk.region}, or you can arrange your own pickup.`,
    `Delivery, professional installation and reconfiguration are available across ${mk.region}; local pickup is also possible.`,
    `Want it installed? Office Station handles delivery and installation throughout ${mk.region}${l.category === "cubicles" || l.category === "benching" ? ", and can add or remove stations to fit your plan" : ""}.`,
  ]));
  s.push(pick(l.id + "d", [
    `Free space planning is included: send your floor plan and we'll show you how ${qty ? `the ${qty} ${noun}` : "these"} lay out.`,
    `Not sure it fits? We'll lay it out on your floor plan at no charge before you commit.`,
    `Send a floor plan and we'll draw the layout for free, so you know exactly what fits.`,
  ]));
  return s;
}

export function priceLine(l) {
  const p = Number(l.price);
  if (!p) return null;
  return l.priceUnit === "each" ? `${money(p)} each` : `${money(p)} for the set`;
}

export const specRows = (l) => [
  ["Category", (CATEGORIES[l.category] || CATEGORIES.other).label],
  ["Quantity", int(l.qty) ? String(int(l.qty)) : ""],
  ["Manufacturer", clean(l.brand)],
  ["Model / series", clean(l.series)],
  ["Size", l.category === "seating" ? "" : sizeLabel(l.size)],
  ["Panel height", int(l.panelHeight) ? `${int(l.panelHeight)}″` : ""],
  ["Panel finish", clean(l.panelFinish)],
  ["Worksurface", clean(l.worksurface)],
  ["Storage", clean(l.storage)],
  ["Power", l.power === "yes" ? "Powered" : l.power === "no" ? "Non-powered" : ""],
  ["Condition", CONDITIONS[l.condition] ? CONDITIONS[l.condition].label : ""],
  ["Location", [clean(l.area), (MARKETS[l.market] || {}).state].filter(Boolean).join(", ")],
].filter(([, v]) => v);

// Follow-up once a seller says yes: photo permission + pricing/terms, in writing, in the same thread.
export function consentMessage(p) {
  return `Great, thank you! Two quick things before we list it: 1) Please send the photos you'd like us to use, or reply "OK to use my Facebook photos" and we'll use the ones from your listing. 2) Office Station sets the listing price from current market data, and we'll confirm the consignment terms with you in writing before anything goes live. Thanks again!`;
}

// The consignment ask sent (by a person) to Facebook Marketplace sellers.
export function outreachMessage(p) {
  const item = clean(p.title) || "your office furniture";
  const where = (MARKETS[p.market] || MARKETS[HOME_MARKET]).region;
  // "30 years": officestation.com was registered in 1996. Don't say "over 30" before that is true.
  return `Hi, I saw your listing for ${item}. I'm with Office Station (officestation.com), serving ${where}. For 30 years, officestation.com has been a resource for office furniture dealers and their clients, and a free consignment listing on the OfficeStation Marketplace may be a great way to sell these units. We list them, handle buyers, delivery and installation, and pay you when they sell. There is no cost to list. Interested?`;
}
