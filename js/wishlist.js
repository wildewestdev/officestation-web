// Seating wish list: pick a chair, choose variations, build a multi-chair list, submit through the lead form.
(function () {
  var dataEl = document.getElementById("chair-data");
  var dlg = document.getElementById("wishlist");
  if (!dataEl || !dlg) return;
  var DATA = JSON.parse(dataEl.textContent);
  var chairs = DATA.chairs;
  var $ = function (k) { return dlg.querySelector('[data-wl="' + k + '"]'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var list = [];
  var current = null;
  try { list = JSON.parse(sessionStorage.getItem("os-wishlist") || "[]"); } catch (e) {}
  var persist = function () { try { sessionStorage.setItem("os-wishlist", JSON.stringify(list)); } catch (e) {} };

  var thumb = function (c) {
    return c.img
      ? '<img src="' + esc(c.img) + '" alt="' + esc(c.brand + " " + c.model) + '">'
      : '<div class="wl-studio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M7 3h10v8H7zM6 11h12v3H6zM12 14v4M8 21l4-3 4 3M9 18h6"/></svg><span>' + esc(c.model) + "</span></div>";
  };

  // model switcher + condition list
  $("switch").innerHTML = chairs.map(function (c, i) { return '<option value="' + i + '">' + esc(c.brand + " " + c.model) + "</option>"; }).join("");
  $("condition").innerHTML = DATA.conditions.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("");

  function select(i) {
    current = chairs[i];
    $("switch").value = String(i);
    $("photo").innerHTML = thumb(current);
    $("brand").textContent = current.brand;
    $("model").textContent = current.model;
    $("qty").value = 1;
    $("options").innerHTML = Object.keys(current.options).map(function (group, gi) {
      return '<fieldset class="fieldset wl-group"><legend>' + esc(group) + '</legend><div class="opts">' +
        current.options[group].map(function (v, vi) {
          return '<label class="opt"><input type="radio" name="wlopt' + gi + '" value="' + esc(v) + '" data-group="' + esc(group) + '"' + (vi === 0 ? " checked" : "") + "><span><b>" + esc(v) + "</b></span></label>";
        }).join("") + "</div></fieldset>";
    }).join("");
  }

  function renderList() {
    var ul = $("items");
    if (!list.length) { ul.innerHTML = '<li class="wl-empty">Add chairs to build your list.</li>'; }
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
    setTimeout(function () { btn.textContent = "Add to wish list"; }, 2200);
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
    if (b) { e.preventDefault(); open(b.getAttribute("data-model")); }
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
