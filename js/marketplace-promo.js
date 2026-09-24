// Homepage Marketplace card: appears after 6 s or a third of the way down the page,
// dismiss hides it for 7 days (per browser; storage failures just mean it can show again).
(function () {
  var el = document.getElementById("mpPromo");
  if (!el) return;
  var KEY = "os-mp-promo-hide", WEEK = 7 * 864e5;
  try { if (Date.now() - Number(localStorage.getItem(KEY) || 0) < WEEK) return; } catch (e) {}
  var shown = false;
  function show() {
    if (shown) return; shown = true;
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add("in"); });
    window.removeEventListener("scroll", onScroll);
  }
  function onScroll() { if (window.scrollY > (document.documentElement.scrollHeight - innerHeight) / 3) show(); }
  setTimeout(show, 6000);
  window.addEventListener("scroll", onScroll, { passive: true });
  el.querySelector(".mp-promo-x").addEventListener("click", function () {
    el.classList.remove("in");
    setTimeout(function () { el.hidden = true; }, 250);
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
  });
})();
