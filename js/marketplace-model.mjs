// OfficeStation(TM) Marketplace listing model. Shared by the site build (node), the public
// sell form and the dash editor (browser), so a listing reads the same everywhere.
// Listings are written in Office Station's own words from structured fields; nothing a
// third party typed is published verbatim.

export const MARKETS = {
  "phoenix-az": {
    name: "Phoenix", state: "AZ", region: "Greater Phoenix",
    areas: ["Phoenix", "Scottsdale", "Tempe", "Mesa", "Chandler", "Gilbert", "Glendale", "Peoria", "Surprise", "Goodyear", "Avondale", "Queen Creek", "Buckeye", "Cave Creek", "Fountain Hills", "Paradise Valley", "Sun City", "Tolleson", "Apache Junction"],
  },
};

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
  const area = clean(l.area) || (MARKETS[l.market] || {}).region || "Greater Phoenix";
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
    `Office Station can deliver, install and reconfigure ${qty === 1 ? `this ${cat.one}` : `these ${cat.noun}`} anywhere in Greater Phoenix, or you can arrange your own pickup.`,
    `Delivery, professional installation and reconfiguration are available across Greater Phoenix; local pickup is also possible.`,
    `Want it installed? Office Station handles delivery and installation throughout the Valley${l.category === "cubicles" || l.category === "benching" ? ", and can add or remove stations to fit your plan" : ""}.`,
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

// The consignment ask sent (by a person) to Facebook Marketplace sellers.
export function outreachMessage(p) {
  const item = clean(p.title) || "your office furniture";
  return `Hi, I saw your listing for ${item}. I'm with Office Station (officestation.com), an office furniture dealer here in the Valley. We'd like to offer it on consignment through the OfficeStation Marketplace: we photograph and list it, handle buyers, delivery and installation, and pay you when it sells. There is no cost to list. Interested?`;
}
