// Homepage Marketplace card: always shown, fixed in the corner. The × closes it for this page view only.
(function () {
  var el = document.getElementById("mpPromo");
  if (!el) return;
  el.querySelector(".mp-promo-x").addEventListener("click", function () { el.hidden = true; });
})();
