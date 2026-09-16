// Resource library: keyword search + topic filter, all client side over data-s haystacks.
(function () {
  var q = document.getElementById("lib-q");
  var grid = document.querySelectorAll(".lib-item");
  if (!q || !grid.length) return;
  var secs = document.querySelectorAll(".lib-sec");
  var chips = document.querySelectorAll(".lib-chips .chip");
  var status = document.getElementById("lib-status");
  var empty = document.getElementById("lib-empty");
  var clear = document.getElementById("lib-clear");
  var total = grid.length;
  var group = "all";

  function apply() {
    var terms = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    var shown = 0;
    secs.forEach(function (sec) {
      var inGroup = group === "all" || sec.getAttribute("data-group") === group;
      var n = 0;
      sec.querySelectorAll(".lib-item").forEach(function (a) {
        var hay = a.getAttribute("data-s") || "";
        // every term must appear somewhere in the row (AND), so extra words narrow the list
        var hit = inGroup && terms.every(function (t) { return hay.indexOf(t) !== -1; });
        a.hidden = !hit;
        if (hit) n++;
      });
      sec.hidden = n === 0;
      var c = sec.querySelector("[data-count]");
      if (c) c.textContent = n;
      shown += n;
    });
    if (empty) empty.hidden = shown !== 0;
    if (clear) clear.hidden = !q.value;
    if (status) {
      status.textContent = !terms.length && group === "all"
        ? ""
        : shown + (shown === 1 ? " page" : " pages") + " of " + total + (terms.length ? ' for "' + q.value.trim() + '"' : "");
    }
  }

  var t;
  q.addEventListener("input", function () { clearTimeout(t); t = setTimeout(apply, 90); });
  q.addEventListener("search", apply);
  q.form && q.form.addEventListener("submit", function (e) { e.preventDefault(); });
  if (clear) clear.addEventListener("click", function () { q.value = ""; apply(); q.focus(); });
  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      chips.forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      group = b.getAttribute("data-g");
      apply();
    });
  });
  // deep link: /library/?q=aeron
  var pre = new URLSearchParams(location.search).get("q");
  if (pre) { q.value = pre; apply(); }
})();
