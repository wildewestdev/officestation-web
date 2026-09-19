// Manufacturer library: keyword search + category filter over the line card.
(function () {
  var q = document.getElementById("lib-q");
  var items = [].slice.call(document.querySelectorAll(".lib-item"));
  if (!q || !items.length) return;
  var chips = document.querySelectorAll(".lib-chips .chip");
  var status = document.getElementById("lib-status");
  var count = document.getElementById("lib-count");
  var empty = document.getElementById("lib-empty");
  var clear = document.getElementById("lib-clear");
  var group = "all";

  function apply() {
    var terms = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    var shown = 0;
    items.forEach(function (a) {
      var hay = a.getAttribute("data-s") || "";
      var cats = " " + (a.getAttribute("data-cats") || "") + " ";
      var hit = (group === "all" || cats.indexOf(" " + group + " ") !== -1)
        && terms.every(function (t) { return hay.indexOf(t) !== -1; });
      a.hidden = !hit;
      if (hit) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
    if (clear) clear.hidden = !q.value;
    var msg = shown + (shown === 1 ? " line" : " lines") + " of " + items.length;
    if (count) count.textContent = msg + ".";
    if (status) status.textContent = !terms.length && group === "all" ? "" : msg + (terms.length ? ' for "' + q.value.trim() + '"' : "");
  }

  var t;
  q.addEventListener("input", function () { clearTimeout(t); t = setTimeout(apply, 90); });
  q.addEventListener("search", apply);
  if (clear) clear.addEventListener("click", function () { q.value = ""; apply(); q.focus(); });
  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      chips.forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      group = b.getAttribute("data-g");
      apply();
    });
  });
  var pre = new URLSearchParams(location.search).get("q");
  if (pre) q.value = pre;
  apply();
})();
