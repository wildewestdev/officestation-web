// Live estimator (liquidation) and quote builder (outfit). Snapshot goes with the lead form.
import { liquidation, outfit, money } from "./pricing.mjs";

const read = (form) => {
  const o = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === "radio") { if (el.checked) o[el.name] = el.value; }
    else if (el.type === "checkbox") o[el.name] = el.checked;
    else o[el.name] = el.value;
  }
  return o;
};
const set = (root, key, v) => { const el = root.querySelector(`[data-out="${key}"]`); if (el) el.textContent = v; return el; };
const save = (kind, input, result) => { try { sessionStorage.setItem("os-tool", JSON.stringify({ kind, input, result })); } catch (e) {} };

// animate numbers so changes feel live
const tweens = new WeakMap();
function tween(el, to, fmt) {
  if (!el) return;
  const from = tweens.get(el) ?? 0;
  const start = performance.now();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const step = (t) => {
    const k = reduce ? 1 : Math.min(1, (t - start) / 380);
    const v = from + (to - from) * (1 - Math.pow(1 - k, 3));
    el.textContent = fmt(v);
    if (k < 1) requestAnimationFrame(step); else tweens.set(el, to);
  };
  requestAnimationFrame(step);
}

const est = document.getElementById("estimatorForm");
if (est) {
  const run = () => {
    const input = read(est);
    const r = liquidation(input);
    set(est, "headline", r.headline);
    const range = est.querySelector('[data-out="range"]');
    range.classList.toggle("pos", r.tier === "payout");
    if (r.tier === "empty") { range.textContent = "$0"; set(est, "sub", "Enter square footage or your inventory counts."); }
    else if (r.tier === "nocost") { range.textContent = "$0"; set(est, "sub", "Resale value roughly covers removal. You pay nothing."); }
    else { range.textContent = `${money(r.lo)} – ${money(r.hi)}`; set(est, "sub", r.tier === "payout" ? "Estimated amount paid to you after removal costs." : "Estimated cost after your furniture's resale value is credited."); }
    tween(est.querySelector('[data-out="recovery"]'), r.recovery, money);
    tween(est.querySelector('[data-out="cost"]'), r.cost, money);
    set(est, "items", r.items.toLocaleString("en-US"));
    est.querySelector('[data-out="drivers"]').innerHTML = r.drivers.map((d) => `<li>${d}</li>`).join("");
    save("liquidation", input, { headline: r.headline, lo: r.lo, hi: r.hi, net: r.net });
  };
  est.addEventListener("input", run);
  est.addEventListener("change", run);
  run();
}

const qf = document.getElementById("quoteForm");
if (qf) {
  const run = () => {
    const input = read(qf);
    const r = outfit(input);
    tween(qf.querySelector('[data-out="total"]'), r.total, money);
    set(qf, "per", r.stations ? `${money(r.perStation)} per workstation, all in` : "Add workstations to start.");
    const eta = set(qf, "eta", r.inStock ? "In stock: installed in as little as 72 hours" : "New: 3–6 weeks");
    eta.classList.toggle("slow", !r.inStock);
    qf.querySelector('[data-out="lines"]').innerHTML = r.lines.map((l) => `<li class="${l.save ? "save" : ""}"><span>${l.label}</span><span>${money(l.amount)}</span></li>`).join("");
    set(qf, "savings", r.savings > 0 ? `About ${money(r.savings)} less than the same layout new.` : "");
    save("outfit", input, { total: r.total, perStation: r.perStation, lines: r.lines });
  };
  qf.addEventListener("input", run);
  qf.addEventListener("change", run);
  run();
}
