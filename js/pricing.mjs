// Office Station pricing engine, shared by the browser tools and the server
// (submit-lead recomputes, so a tampered form can never set its own number).
//
// DRAFT NUMBERS 9/15/26: modeled from typical used / remanufactured / new market
// ranges. NOT yet confirmed against partner quotes (refurbisher, install crews,
// freight, disposal). Confirm before quoting real projects.

export const money = (n) => (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));
const round = (n, to) => Math.round(n / to) * to;

// ---------------------------------------------------------------- zones
// Central valley ZIPs get the base rate; the rest of the metro and outside it cost more.
const CORE = /^(850(0[1-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-4])|852(0[1-6]|1[0-5]|5[0-9]|6[0-9]|8[0-3]))$/;
export function zoneFor(zip) {
  const z = String(zip || "").trim();
  if (!/^\d{5}$/.test(z)) return null;
  if (CORE.test(z)) return "core";
  const n = Number(z);
  return n >= 85001 && n <= 85399 ? "metro" : "far";
}

// Liquidation hub markets (9/15/26 West, 9/23/26 national): San Diego, Orange County, Northern California, Las Vegas, Reno,
// Phoenix, Tucson, Flagstaff, Denver, Albuquerque, Salt Lake City. ZIP3 prefixes -> market.
const SERVED_ZIP3 = [
  [/^(919|920|921)/, "San Diego"], [/^(926|927|928)/, "Orange County"],
  [/^(94[0-9]|95[01]|956|957|958)/, "Northern California"], [/^(889|890|891)/, "Las Vegas"],
  [/^(894|895|897)/, "Reno"], [/^(850|851|852|853)/, "Phoenix"], [/^(856|857)/, "Tucson"],
  [/^860/, "Flagstaff"], [/^(800|801|802|803|804|805|806)/, "Denver"], [/^(870|871)/, "Albuquerque"],
  [/^(840|841)/, "Salt Lake City"],
  // national markets, 9/23/26 (ZIP3s of each metro's office districts)
  [/^(900|904|902|912|915)/, "Los Angeles"],
  [/^(981|980)/, "Seattle"],
  [/^(972|970)/, "Portland"],
  [/^(752|750|761)/, "Dallas-Fort Worth"],
  [/^(770|773)/, "Houston"],
  [/^(787|786)/, "Austin"],
  [/^(782)/, "San Antonio"],
  [/^(731)/, "Oklahoma City"],
  [/^(681)/, "Omaha"],
  [/^(641|662)/, "Kansas City"],
  [/^(631|630)/, "St. Louis"],
  [/^(554|551)/, "Minneapolis-St. Paul"],
  [/^(532|530|531)/, "Milwaukee"],
  [/^(606|600)/, "Chicago"],
  [/^(482|480|483)/, "Detroit"],
  [/^(495)/, "Grand Rapids"],
  [/^(462|460)/, "Indianapolis"],
  [/^(432|430)/, "Columbus"],
  [/^(441)/, "Cleveland"],
  [/^(452|450|410)/, "Cincinnati"],
  [/^(152|153|151)/, "Pittsburgh"],
  [/^(100|112|111)/, "New York City"],
  [/^(073|071|079|070|076)/, "Northern New Jersey"],
  [/^(021|022|024)/, "Boston"],
  [/^(191|194|190)/, "Philadelphia"],
  [/^(212|210)/, "Baltimore"],
  [/^(200)/, "Washington, D.C."],
  [/^(303)/, "Atlanta"],
  [/^(282)/, "Charlotte"],
  [/^(276|277)/, "Raleigh-Durham"],
  [/^(372|370)/, "Nashville"],
  [/^(331)/, "Miami"],
  [/^(336|337)/, "Tampa"],
  [/^(328|327)/, "Orlando"],
];
export function servedMarket(zip) {
  const z = String(zip || "").trim();
  if (!/^\d{5}$/.test(z)) return null;
  const hit = SERVED_ZIP3.find(([re]) => re.test(z));
  return hit ? hit[1] : null;
}
// Liquidation travel zone: central Phoenix = core, any other served market = metro, elsewhere = far.
export function liquidationZone(zip) {
  const z = zoneFor(zip);
  if (z === "core") return "core";
  return servedMarket(zip) ? "metro" : z ? "far" : null;
}

// ---------------------------------------------------------------- 1. liquidation
// What a corporate floor is worth to us, minus what it costs to clear it.
// Positive net = we pay the client. Near zero = no-cost liquidation. Negative = net cost.
export const BRAND_TIERS = {
  premium: { label: "Premium", hint: "Herman Miller, Steelcase, Knoll, Haworth" },
  commercial: { label: "Commercial", hint: "Allsteel, Kimball, Teknion, HON, AIS, Friant" },
  mixed: { label: "Unbranded / mixed", hint: "Not sure, or a mix of makers" },
};
export const AGES = { "0-7": "Under 8 years", "8-15": "8–15 years", "15+": "15+ years" };
export const CONDITIONS = { good: "Good", fair: "Fair / normal wear", rough: "Heavy wear" };
export const ACCESS = { dock: "Loading dock", elevator: "Freight / passenger elevator", stairs: "Stairs only" };
export const DEADLINES = { "4+": "4+ weeks", "2-4": "2–4 weeks", "<2": "Under 2 weeks" };

// buy-side recovery value per item: [0-7, 8-15, 15+]
const RECOVERY = {
  workstation: { premium: [110, 55, 15], commercial: [60, 25, 5], mixed: [20, 5, 0] },
  chair: { premium: [60, 30, 8], commercial: [18, 6, 0], mixed: [4, 0, 0] },
  office: { premium: [140, 65, 15], commercial: [70, 30, 5], mixed: [20, 0, 0] },
  conference: { premium: [110, 55, 10], commercial: [55, 20, 0], mixed: [10, 0, 0] },
};
const COND_MULT = { good: 1, fair: 0.75, rough: 0.4 };
const LABOR = { workstation: 65, chair: 6, office: 95, conference: 80 };
const MOBILIZE = 750;
const ACCESS_MULT = { dock: 1, elevator: 1.15, stairs: 1.4 };
const DEADLINE_MULT = { "4+": 1, "2-4": 1.1, "<2": 1.25 };
const ZONE_MULT = { core: 1, metro: 1.08, far: 1.25 };

// input: { sqft, workstations, chairs, offices, conference, brand, age, condition, access, deadline, zip }
export function liquidation(input) {
  const sqft = int(input.sqft, 0, 2_000_000);
  // no counts yet? estimate from square footage (~1 station per 175 usable sq ft)
  const estimated = !Number(input.workstations) && sqft > 0;
  const workstations = estimated ? int(sqft / 175, 0, 20000) : int(input.workstations, 0, 20000);
  const chairs = input.chairs === "" || input.chairs == null ? Math.round(workstations * 1.15) : int(input.chairs, 0, 40000);
  const offices = input.offices === "" || input.offices == null ? Math.round(workstations / 12) : int(input.offices, 0, 2000);
  const conference = input.conference === "" || input.conference == null ? Math.round(workstations / 25) : int(input.conference, 0, 500);
  const brand = BRAND_TIERS[input.brand] ? input.brand : "commercial";
  const age = AGES[input.age] ? input.age : "8-15";
  const condition = COND_MULT[input.condition] ? input.condition : "fair";
  const access = ACCESS_MULT[input.access] ? input.access : "elevator";
  const deadline = DEADLINE_MULT[input.deadline] ? input.deadline : "2-4";
  const zone = liquidationZone(input.zip) || "metro";
  const ai = { "0-7": 0, "8-15": 1, "15+": 2 }[age];

  const counts = { workstation: workstations, chair: chairs, office: offices, conference };
  let recovery = 0;
  let labor = 0;
  for (const k of Object.keys(counts)) {
    recovery += counts[k] * RECOVERY[k][brand][ai] * COND_MULT[condition];
    labor += counts[k] * LABOR[k];
  }
  const items = workstations + chairs + offices + conference;
  const cost = items ? (MOBILIZE + labor) * ACCESS_MULT[access] * DEADLINE_MULT[deadline] * ZONE_MULT[zone] : 0;
  const net = recovery - cost;

  let tier, headline;
  if (!items) { tier = "empty"; headline = "Add your inventory"; }
  else if (net > 1500) { tier = "payout"; headline = "We pay you"; }
  else if (net > -1500) { tier = "nocost"; headline = "No-cost liquidation"; }
  else { tier = "cost"; headline = "Net project cost"; }

  const spread = 0.18;
  const lo = round(Math.abs(net) * (1 - spread), 50);
  const hi = round(Math.abs(net) * (1 + spread), 50);
  const drivers = [];
  if (brand === "premium") drivers.push("Premium manufacturers carry real resale value");
  if (brand === "mixed") drivers.push("Unbranded furniture resells for little, so labor drives the number");
  if (age === "15+") drivers.push("Furniture over 15 years old is priced mostly as removal");
  if (condition === "rough") drivers.push("Heavy wear cuts resale by more than half");
  if (access === "stairs") drivers.push("Stairs-only access adds crew hours");
  if (deadline === "<2") drivers.push("Under two weeks means after-hours and extra crews");
  if (zone === "far") drivers.push("Outside our hub markets adds crew travel");
  if (zone === "metro" && servedMarket(input.zip) && servedMarket(input.zip) !== "Phoenix") drivers.push(`${servedMarket(input.zip)} service market`);
  if (estimated) drivers.push(`Inventory estimated from ${sqft.toLocaleString("en-US")} sq ft; your counts will sharpen this`);

  return {
    tier, headline, net: Math.round(net), lo, hi,
    recovery: Math.round(recovery), cost: Math.round(cost),
    workstations, chairs, offices, conference, items, estimated,
    brand, age, condition, access, deadline, zone, sqft, drivers,
  };
}

// ---------------------------------------------------------------- 2. office outfitting (deals)
export const GRADES = {
  // Lead times (Carlos 9/15/26): liquidation grade as little as 72 hours in stock; reman usually 7-14 days; new 4-6 weeks.
  used: { label: "Liquidation grade", blurb: "From Phoenix corporate floors. Cleaned, inspected, fully working.", eta: "In as little as 72 hours", etaLine: "In stock: installed in as little as 72 hours", inStock: true },
  reman: { label: "Remanufactured", blurb: "New fabric, surfaces and edge banding. Looks new for about two-thirds of new.", eta: "Usually 7–14 days", etaLine: "Remanufactured: usually 7–14 days", inStock: false },
  new: { label: "New", blurb: "Factory-new commercial lines when you need a matched spec.", eta: "4–6 weeks", etaLine: "New: 4–6 weeks", inStock: false },
};
export const WORKSTATIONS = {
  // 9/15/26: 6x6 set by Carlos (liquidation $615, reman $1,245, new $1,920); other sizes scaled by the same ratios.
  // Furniture prices exclude electrical, delivery and professional installation. Space planning is free.
  "6x6": { label: "6' × 6' workstation", used: 615, reman: 1245, new: 1920 },
  "6x8": { label: "6' × 8' workstation", used: 725, reman: 1410, new: 2170 },
  "8x8": { label: "8' × 8' manager station", used: 850, reman: 1615, new: 2470 },
  bench: { label: "Open bench seat", used: 460, reman: 875, new: 1235 },
};
export const PANELS = {
  low: { label: "Low 42\"", hint: "Collaborative", mult: 0.95 },
  mid: { label: "Mid 53\"", hint: "Seated privacy", mult: 1 },
  tall: { label: "Tall 65\"", hint: "Full privacy", mult: 1.08 },
};
export const EXTRAS = {
  chairs: { label: "Ergonomic task chairs", used: 145, reman: 245, new: 395 },
  pedestals: { label: "Mobile file pedestals", used: 95, reman: 145, new: 245 },
  offices: { label: "Private office suites", used: 695, reman: 1150, new: 2250 },
  conference: { label: "Conference rooms (table + 8 chairs)", used: 1450, reman: 2400, new: 4200 },
};
const INSTALL_UNIT = 95;
const INSTALL_MIN = 495;
const DELIVERY = { core: 195, metro: 295, far: 495 };
export const VOLUME = [{ min: 100, pct: 0.12 }, { min: 50, pct: 0.08 }, { min: 20, pct: 0.05 }];

// config: { grade, size, panel, stations, chairs, pedestals, offices, conference, install, zip }
export function outfit(config) {
  const grade = GRADES[config.grade] ? config.grade : "reman";
  const size = WORKSTATIONS[config.size] ? config.size : "6x6";
  const panel = PANELS[config.panel] ? config.panel : "mid";
  const stations = int(config.stations, 0, 5000);
  const q = { chairs: int(config.chairs, 0, 5000), pedestals: int(config.pedestals, 0, 5000), offices: int(config.offices, 0, 500), conference: int(config.conference, 0, 100) };
  const install = config.install !== false && config.install !== "false";
  const zone = zoneFor(config.zip) || "metro";

  const lines = [];
  if (stations) lines.push({ label: `${stations} × ${WORKSTATIONS[size].label}`, amount: Math.round(WORKSTATIONS[size][grade] * PANELS[panel].mult) * stations });
  for (const k of Object.keys(q)) if (q[k]) lines.push({ label: `${q[k]} × ${EXTRAS[k].label}`, amount: EXTRAS[k][grade] * q[k] });
  const furniture = lines.reduce((s, l) => s + l.amount, 0);
  const tier = VOLUME.find((t) => stations >= t.min);
  const discount = tier ? Math.round(furniture * tier.pct) : 0;
  if (discount) lines.push({ label: `Volume pricing (${Math.round(tier.pct * 100)}% off)`, amount: -discount, save: true });
  const units = stations + q.offices * 3 + q.conference * 2;
  const installCost = install && furniture ? Math.max(INSTALL_MIN, units * INSTALL_UNIT) : 0;
  if (installCost) lines.push({ label: "Professional installation", amount: installCost });
  // Arizona ZIPs get zone pricing; anywhere else in the country ships freight, quoted per project.
  const nationwide = zone === "far";
  const delivery = furniture && !nationwide ? DELIVERY[zone] : 0;
  if (delivery) lines.push({ label: "Delivery", amount: delivery });
  if (furniture && nationwide) lines.push({ label: "Freight outside Greater Phoenix (quoted per project)", amount: 0, quoted: true });
  const total = furniture - discount + installCost + delivery;
  // what the same layout costs new, for the savings line
  const newEquivalent = grade === "new" ? total : Math.round(
    (stations ? Math.round(WORKSTATIONS[size].new * PANELS[panel].mult) * stations : 0) +
    Object.keys(q).reduce((s, k) => s + EXTRAS[k].new * q[k], 0)
  ) * (1 - (tier ? tier.pct : 0)) + installCost + delivery;

  return {
    grade, size, panel, stations, ...q, install, zone, lines, furniture, discount, installCost, delivery, total,
    perStation: stations ? Math.round(total / stations) : 0,
    savings: Math.max(0, Math.round(newEquivalent - total)),
    eta: GRADES[grade].eta, etaLine: GRADES[grade].etaLine, inStock: GRADES[grade].inStock,
  };
}
