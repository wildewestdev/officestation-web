// OfficeStation Marketplace: listing gallery + category filter chips.
(function () {
  document.querySelectorAll("[data-gallery]").forEach(function (g) {
    var main = g.querySelector(".mp-main img");
    g.querySelectorAll(".mp-thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        main.src = b.getAttribute("data-src");
        main.alt = b.querySelector("img").alt;
        g.querySelectorAll(".mp-thumbs button").forEach(function (x) { x.removeAttribute("aria-current"); });
        b.setAttribute("aria-current", "true");
      });
    });
  });
  var chips = document.querySelectorAll("[data-mpfilter]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-mpfilter");
      chips.forEach(function (x) { x.classList.toggle("on", x === c); });
      document.querySelectorAll("#mp-grid .mp-card").forEach(function (card) {
        card.hidden = f !== "all" && card.getAttribute("data-cat") !== f;
      });
    });
  });
})();
