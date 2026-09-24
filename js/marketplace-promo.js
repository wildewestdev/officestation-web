// Homepage Marketplace card: always shown, fixed in the corner. Opens on the home market, then asks
// /api/geo (Netlify IP location, no browser prompt) for the visitor's nearest market and swaps in
// that market's newest listing. "See other markets" opens the full U.S. menu. × closes it for this view.
(function () {
  var el = document.getElementById("mpPromo");
  if (!el) return;
  var data = {};
  try { data = JSON.parse(document.getElementById("mpData").textContent); } catch (e) {}
  var GEO = /netlify\.app$/.test(location.hostname) ? "/.netlify/functions/geo" : "https://officestation.netlify.app/.netlify/functions/geo";
  var KEY = "os-mp-market";

  function show(slug) {
    var d = data[slug];
    if (!d) return;
    el.querySelector('[data-f="k"]').textContent = d.k;
    el.querySelector('[data-f="t"]').textContent = d.t;
    el.querySelector('[data-f="g"]').textContent = d.g;
    el.querySelector('[data-f="r"]').textContent = d.r;
    el.querySelector(".mp-promo-link").href = d.u;
    var im = el.querySelector(".mp-promo-img img");
    if (im.getAttribute("src") !== d.p) im.src = d.p;
    el.setAttribute("data-market", slug);
    var cur = el.querySelector('.mp-promo-menu a[aria-current]');
    if (cur) cur.removeAttribute("aria-current");
    var a = el.querySelector('.mp-promo-menu a[data-market="' + slug + '"]');
    if (a) a.setAttribute("aria-current", "true");
  }

  // cached answer first (1 day), then the network
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (cached && cached.m && Date.now() - cached.t < 864e5) show(cached.m);
  else {
    fetch(GEO, { credentials: "omit" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.market) return;
      show(j.market);
      try { localStorage.setItem(KEY, JSON.stringify({ m: j.market, t: Date.now() })); } catch (e) {}
    }).catch(function () {});
  }

  var more = el.querySelector(".mp-promo-more"), menu = document.getElementById("mpMenu");
  function setMenu(open) { menu.hidden = !open; more.setAttribute("aria-expanded", String(open)); el.classList.toggle("menu-open", open); }
  more.addEventListener("click", function () { setMenu(menu.hidden); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); more.focus(); } });
  document.addEventListener("click", function (e) { if (!menu.hidden && !el.contains(e.target)) setMenu(false); });
  el.querySelector(".mp-promo-x").addEventListener("click", function () { el.hidden = true; });
})();
