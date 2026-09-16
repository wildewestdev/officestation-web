// Seating request: pick a chair, choose options, build a multi-chair request, submit through the lead form.
(function () {
  var dataEl = document.getElementById("chair-data");
  var dlg = document.getElementById("seat-request");
  if (!dataEl || !dlg) return;
  var DATA = JSON.parse(dataEl.textContent);
  var chairs = DATA.chairs;
  var $ = function (k) { return dlg.querySelector('[data-wl="' + k + '"]'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var list = [];
  var current = null;
  try { list = JSON.parse(sessionStorage.getItem("os-seating") || "[]"); } catch (e) {}
  var persist = function () { try { sessionStorage.setItem("os-seating", JSON.stringify(list)); } catch (e) {} };

  var thumb = function (c, src) {
    return '<img src="' + esc(src || c.img) + '" alt="' + esc(c.brand + " " + c.model) + '">';
  };

  // model switcher + condition list
  $("switch").innerHTML = chairs.map(function (c, i) { return '<option value="' + i + '">' + esc(c.brand + " " + c.model) + "</option>"; }).join("");
  var setConditions = function (c) {
    var opts = c.conditions || DATA.conditions;
    $("condition").innerHTML = opts.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("");
    $("condlabel").textContent = opts[0] + " or " + opts[1].toLowerCase();
  };

  function select(i) {
    current = chairs[i];
    $("switch").value = String(i);
    $("photo").innerHTML = thumb(current);
    $("brand").textContent = current.brand;
    $("model").textContent = current.brand + " " + current.model;
    // front / back studio angles, when we have both
    var views = [current.img].concat(current.back ? [current.back] : []);
    $("views").innerHTML = views.length > 1
      ? views.map(function (v, vi) {
          return '<button type="button" class="wl-view' + (vi === 0 ? " on" : "") + '" data-src="' + esc(v) + '" aria-label="' + (vi === 0 ? "Front" : "Back") + ' view"><img src="' + esc(v) + '" alt=""></button>';
        }).join("")
      : "";
    $("qty").value = 1;
    setConditions(current);
    var pr = current.prices || {};
    var parts = Object.keys(pr).filter(function (k) { return pr[k]; }).map(function (k) { return k + " " + pr[k]; });
    $("price").textContent = parts.length ? parts.join("  ·  ") + "  per chair" : "Priced on request";
    $("options").innerHTML = Object.keys(current.options).map(function (group, gi) {
      return '<fieldset class="fieldset wl-group"><legend>' + esc(group) + '</legend><div class="opts">' +
        current.options[group].map(function (v, vi) {
          return '<label class="opt"><input type="radio" name="wlopt' + gi + '" value="' + esc(v) + '" data-group="' + esc(group) + '"' + (vi === 0 ? " checked" : "") + "><span><b>" + esc(v) + "</b></span></label>";
        }).join("") + "</div></fieldset>";
    }).join("");
  }

  function renderList() {
    var ul = $("items");
    if (!list.length) { ul.innerHTML = '<li class="wl-empty">Add chairs to build your request.</li>'; }
    else {
      ul.innerHTML = list.map(function (it, i) {
        var c = chairs.find(function (x) { return x.model === it.model; }) || { model: it.model, brand: it.brand };
        var opts = Object.keys(it.options).map(function (k) { return k + ": " + it.options[k]; }).join(" · ");
        return '<li class="wl-item"><div class="wl-thumb">' + thumb(c) + '</div><div class="wl-info"><b>' + esc(it.brand + " " + it.model) + " × " + it.qty + "</b><small>" + esc(opts) + "</small><small>" + esc(it.condition) + '</small></div><button type="button" class="wl-remove" data-i="' + i + '" aria-label="Remove ' + esc(it.model) + '">Remove</button></li>';
      }).join("");
    }
    $("field").value = list.map(function (it) {
      return it.brand + " " + it.model + " x" + it.qty + " | " + it.condition + " | " + Object.keys(it.options).map(function (k) { return k + ": " + it.options[k]; }).join("; ");
    }).join("\n");
    persist();
  }

  function addCurrent() {
    var qty = Math.max(1, parseInt($("qty").value, 10) || 1);
    var options = {};
    dlg.querySelectorAll('[data-wl="options"] input:checked').forEach(function (r) { options[r.getAttribute("data-group")] = r.value; });
    list.push({ brand: current.brand, model: current.model, qty: qty, condition: $("condition").value, options: options });
    renderList();
    var btn = $("add");
    btn.textContent = "Added. Add another chair?";
    setTimeout(function () { btn.textContent = "Add to request"; }, 2200);
    if (window.osTrack) window.osTrack("cta");
  }

  function open(model) {
    var i = Math.max(0, chairs.findIndex(function (c) { return c.model === model; }));
    select(i);
    renderList();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.classList.add("wl-lock");
  }
  function close() {
    if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
    document.documentElement.classList.remove("wl-lock");
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".wl-add");
    if (b) {
      e.preventDefault();
      open(b.getAttribute("data-model"));
    }
  });

  // catalog filtering and sorting
  var grid = document.getElementById("seat-grid");
  if (grid) {
    var cards = [].slice.call(grid.children);
    var count = document.getElementById("seat-count");
    var show = function () {
      var vis = cards.filter(function (c) { return !c.hidden; }).length;
      if (count) count.textContent = "Showing " + vis + " of " + cards.length + " models. Availability changes with every liquidation.";
    };
    document.querySelectorAll(".cat-filters .chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".cat-filters .chip").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        var f = btn.getAttribute("data-filter");
        cards.forEach(function (c) {
          c.hidden = !(f === "all"
            || (f.indexOf("brand:") === 0 && c.getAttribute("data-brand") === f.slice(6))
            || (f.indexOf("type:") === 0 && c.getAttribute("data-type") === f.slice(5)));
        });
        show();
      });
    });
    var sort = document.getElementById("seat-sort");
    if (sort) sort.addEventListener("change", function () {
      var v = sort.value;
      cards.slice().sort(function (a, b2) {
        if (v === "az") return a.getAttribute("data-name").localeCompare(b2.getAttribute("data-name"));
        if (v === "brand") return a.getAttribute("data-brand").localeCompare(b2.getAttribute("data-brand")) || a.getAttribute("data-name").localeCompare(b2.getAttribute("data-name"));
        if (v === "photo") return (b2.getAttribute("data-photo") - a.getAttribute("data-photo")) || (a.getAttribute("data-order") - b2.getAttribute("data-order"));
        return a.getAttribute("data-order") - b2.getAttribute("data-order");
      }).forEach(function (c) { grid.appendChild(c); });
    });
    show();
  }
  $("views").addEventListener("click", function (e) {
    var v = e.target.closest(".wl-view");
    if (!v) return;
    $("photo").innerHTML = thumb(current, v.getAttribute("data-src"));
    dlg.querySelectorAll(".wl-view").forEach(function (b) { b.classList.toggle("on", b === v); });
  });
  dlg.querySelector(".wl-close").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  dlg.addEventListener("close", function () { document.documentElement.classList.remove("wl-lock"); });
  $("switch").addEventListener("change", function () { select(parseInt(this.value, 10)); });
  $("add").addEventListener("click", addCurrent);
  $("items").addEventListener("click", function (e) {
    var r = e.target.closest(".wl-remove");
    if (r) { list.splice(parseInt(r.getAttribute("data-i"), 10), 1); renderList(); }
  });
  // if they submit without pressing "Add", include the chair they configured
  dlg.querySelector(".wl-form").addEventListener("submit", function () {
    if (!list.length && current) addCurrent();
  }, true);
  // clear the list after a successful send
  new MutationObserver(function () {
    var s = dlg.querySelector(".wl-form .form-status");
    if (s && !s.hidden && s.classList.contains("ok")) { list = []; renderList(); }
  }).observe(dlg.querySelector(".wl-form"), { subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
})();
