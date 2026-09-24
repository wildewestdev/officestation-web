// OfficeStation Marketplace search: every live listing nationwide, from /marketplace/search.json.
// Every word typed must appear somewhere in the listing (title, city, market, manufacturer, model, size,
// panel height, finish, condition, category, description). Sizes match however they are typed (6x6, 6 x 6, 6' x 6').
(function () {
  var grid = document.getElementById("mpsGrid");
  if (!grid) return;
  var input = document.getElementById("mpq"), sortSel = document.getElementById("mpsSort"), mktSel = document.getElementById("mpsMarket");
  var countEl = document.getElementById("mpsCount"), emptyEl = document.getElementById("mpsEmpty"), titleEl = document.getElementById("mpsTitle");
  var all = [];
  var params = new URLSearchParams(location.search);
  input.value = params.get("q") || "";
  if (params.get("sort")) sortSel.value = params.get("sort");
  if (params.get("market")) mktSel.value = params.get("market");

  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  // "6 x 6", "6' x 6'", "6X6" -> "6x6"; strip punctuation; drop filler words
  var STOP = { the: 1, a: 1, an: 1, and: 1, of: 1, for: 1, in: 1, near: 1, used: 1, "for sale": 1 };
  function terms(q) {
    q = String(q || "").toLowerCase().replace(/(\d+)\s*['′"]?\s*(x|×|by)\s*(\d+)\s*['′"]?/g, "$1x$3").replace(/[^a-z0-9x.\s-]/g, " ");
    return q.split(/\s+/).filter(function (w) { return w && !STOP[w]; }).map(function (w) { return w.replace(/(?<!s)s$/, ""); });
  }
  // numbers and sizes match whole values only: "6x5" must not hit "16x5", "12" must not hit "120"
  var numRe = {};
  function has(text, w) {
    if (!/^\d/.test(w)) return text.indexOf(w) !== -1;
    var re = numRe[w] || (numRe[w] = new RegExp("(^|[^0-9.])" + w.replace(/[.]/g, "\\.") + "(?![0-9])"));
    return re.test(text);
  }
  function score(item, ts) {
    var s = 0, t = item.t.toLowerCase();
    for (var i = 0; i < ts.length; i++) {
      var w = ts[i];
      if (!has(item.x, w)) return -1; // every word must match
      s += t.indexOf(w) !== -1 ? 3 : 1;
      if ((item.mn + " " + item.m).toLowerCase().indexOf(w) !== -1) s += 2;
    }
    return s;
  }
  function card(l) {
    return '<a class="mp-card" href="' + esc(l.u) + '"><div class="mp-photo"><img src="' + esc(l.p) + '" alt="' + esc(l.t) + '" loading="lazy" decoding="async"></div>' +
      '<div class="mp-body"><span class="k">' + esc(l.c) + " · " + esc(l.mn) + '</span><h3>' + esc(l.t) + '</h3><p class="mp-price">' + esc(l.pl) + "</p></div></a>";
  }
  var SORT = {
    best: function (a, b) { return b._s - a._s || String(b.d).localeCompare(String(a.d)); },
    new: function (a, b) { return String(b.d).localeCompare(String(a.d)); },
    plo: function (a, b) { return (a.pr || 1e12) - (b.pr || 1e12); }, // "Request pricing" sorts last
    phi: function (a, b) { return (b.pr || -1) - (a.pr || -1); },
    qty: function (a, b) { return b.q - a.q; },
    mkt: function (a, b) { return a.mn.localeCompare(b.mn) || String(b.d).localeCompare(String(a.d)); },
  };
  function run() {
    var q = input.value.trim(), ts = terms(q), mk = mktSel.value;
    var res = all.filter(function (l) { return !mk || l.m === mk; }).map(function (l) { l._s = ts.length ? score(l, ts) : 0; return l; }).filter(function (l) { return l._s >= 0; });
    res.sort(SORT[sortSel.value] || SORT.best);
    grid.innerHTML = res.map(card).join("");
    emptyEl.hidden = res.length > 0;
    countEl.textContent = res.length + " listing" + (res.length === 1 ? "" : "s") + (q ? ' matching "' + q + '"' : "") + (mk ? " in " + mktSel.options[mktSel.selectedIndex].text : " nationwide");
    titleEl.textContent = q ? 'Results for "' + q + '"' : "Search the Marketplace";
    var u = new URLSearchParams();
    if (q) u.set("q", q);
    if (sortSel.value !== "best") u.set("sort", sortSel.value);
    if (mk) u.set("market", mk);
    try { history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : "")); } catch (e) {}
  }
  var timer;
  input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 120); });
  input.form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
  sortSel.addEventListener("change", run);
  mktSel.addEventListener("change", run);
  countEl.textContent = "Loading listings…";
  fetch("/marketplace/search.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (j) { all = j || []; run(); })
    .catch(function () { countEl.textContent = "Search is unavailable right now. Please try again in a moment."; });
})();
