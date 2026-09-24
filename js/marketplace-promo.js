// Homepage Marketplace card: always shown, fixed in the corner.
//  - Opens on the home market, then asks /api/geo (Netlify IP location, no prompt) for the nearest market.
//    IP location is rough on mobile data (carrier hubs), so:
//  - "Use my location" asks the browser for GPS once and picks the nearest market ON THE DEVICE
//    (coordinates never leave the phone; only the chosen market slug is counted).
//  - An auto-detected market with no listings shows the nearest market that has some; a market the
//    visitor picks by hand is always shown as-is.
//  - "See other markets" opens the full U.S. menu; picking one switches the card (remembered 30 days).
(function () {
  var el = document.getElementById("mpPromo");
  if (!el) return;
  var data = {};
  try { data = JSON.parse(document.getElementById("mpData").textContent); } catch (e) {}
  var GEO = /netlify\.app$/.test(location.hostname) ? "/.netlify/functions/geo" : "https://officestation.netlify.app/.netlify/functions/geo";
  var KEY = "os-mp-market";

  function show(slug, auto) {
    var base = data[slug];
    if (!base) return;
    var d = auto && !base.n && base.a ? base.a : base;
    el.querySelector('[data-f="k"]').textContent = d.k;
    el.querySelector('[data-f="t"]').textContent = d.t;
    el.querySelector('[data-f="g"]').textContent = d.g;
    el.querySelector('[data-f="r"]').textContent = d.r;
    el.querySelector(".mp-promo-link").href = d.u;
    var im = el.querySelector(".mp-promo-img img");
    if (im.getAttribute("src") !== d.p) im.src = d.p;
    el.setAttribute("data-market", slug);
    var cur = el.querySelector(".mp-promo-menu a[aria-current]");
    if (cur) cur.removeAttribute("aria-current");
    var a = el.querySelector('.mp-promo-menu a[data-market="' + slug + '"]');
    if (a) a.setAttribute("aria-current", "true");
  }
  function remember(slug, how) {
    try { localStorage.setItem(KEY, JSON.stringify({ m: slug, t: Date.now(), pick: how !== "ip", how: how })); } catch (e) {}
  }
  // anonymous count of which market a visitor chose (market slug + method only)
  function count(slug, how) {
    try { fetch(GEO + "?pick=" + encodeURIComponent(slug) + "&src=" + how, { credentials: "omit", keepalive: true }); } catch (e) {}
  }
  function nearest(lat, lng) {
    var best = null, r = Math.PI / 180;
    for (var s in data) {
      var m = data[s], h = Math.pow(Math.sin((m.la - lat) * r / 2), 2) + Math.cos(lat * r) * Math.cos(m.la * r) * Math.pow(Math.sin((m.lo - lng) * r / 2), 2);
      var d = 2 * 3958.8 * Math.asin(Math.sqrt(h));
      if (!best || d < best.d) best = { s: s, d: d };
    }
    return best && best.s;
  }

  // a market the visitor chose (30 days, shown as-is) or the cached IP guess (1 day), else ask the network
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (cached && cached.m && data[cached.m] && Date.now() - cached.t < (cached.pick ? 30 : 1) * 864e5) show(cached.m, !cached.pick);
  else {
    fetch(GEO, { credentials: "omit" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.market || !data[j.market]) return;
      show(j.market, true);
      remember(j.market, "ip");
    }).catch(function () {});
  }

  // "Use my location": GPS, decided on the device
  var gps = el.querySelector(".mp-promo-gps");
  if (gps && navigator.geolocation && window.isSecureContext) {
    gps.hidden = false;
    gps.addEventListener("click", function () {
      gps.disabled = true; gps.textContent = "Locating…";
      navigator.geolocation.getCurrentPosition(function (pos) {
        var s = nearest(pos.coords.latitude, pos.coords.longitude);
        gps.disabled = false; gps.textContent = "Use my location";
        if (!s) return;
        show(s, true); remember(s, "gps"); count(s, "gps");
      }, function () {
        gps.disabled = false; gps.textContent = "Location unavailable";
        setTimeout(function () { gps.textContent = "Use my location"; }, 2500);
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
    });
  }

  var more = el.querySelector(".mp-promo-more"), menu = document.getElementById("mpMenu");
  function setMenu(open) { menu.hidden = !open; more.setAttribute("aria-expanded", String(open)); el.classList.toggle("menu-open", open); }
  more.addEventListener("click", function () { setMenu(menu.hidden); });
  menu.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-market]");
    if (!a || !data[a.getAttribute("data-market")]) return;
    e.preventDefault();
    var slug = a.getAttribute("data-market");
    show(slug, false); remember(slug, "menu"); count(slug, "menu");
    setMenu(false);
    el.querySelector(".mp-promo-link").focus();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); more.focus(); } });
  document.addEventListener("click", function (e) { if (!menu.hidden && !el.contains(e.target)) setMenu(false); });
  el.querySelector(".mp-promo-x").addEventListener("click", function () { el.hidden = true; });
})();
