// Panel-system gallery: filter by manufacturer, and carry the chosen system into the request form.
(function () {
  var grid = document.getElementById("sys-grid");
  if (!grid) return;
  var cards = [].slice.call(grid.querySelectorAll(".sys-card"));
  var chips = document.querySelectorAll("[data-sysfilter]");
  var count = document.getElementById("sys-count");

  function show() {
    var n = cards.filter(function (c) { return !c.hidden; }).length;
    if (count) count.textContent = "Showing " + n + " of " + cards.length + " systems. Availability changes with every liquidation.";
  }
  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      chips.forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      var f = b.getAttribute("data-sysfilter");
      cards.forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-brand") === f); });
      show();
    });
  });
  show();

  // "Find me this style" drops the system into the request form and scrolls to it
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".sys-ask");
    if (!b) return;
    e.preventDefault();
    var field = document.getElementById("sys-model");
    var form = document.getElementById("sys-request");
    if (field) field.value = b.getAttribute("data-system") || "";
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { var q = document.getElementById("sys-qty"); if (q) q.focus(); }, 500);
    }
    if (window.osTrack) window.osTrack("cta");
  });
})();
