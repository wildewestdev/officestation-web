// Office Station: nav, header state, scroll reveal, lead forms.
(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); } });
  }
  var onScroll = function () { if (header) header.classList.toggle("scrolled", window.scrollY > 10); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add("in"); });

  // lead forms -> /api/submit-lead
  document.querySelectorAll("form[data-lead]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      var btn = form.querySelector('button[type="submit"]');
      var email = form.querySelector('[name="email"]');
      var name = form.querySelector('[name="name"]');
      var show = function (cls, msg) { status.hidden = false; status.className = "form-status " + cls; status.textContent = msg; };
      if (!name.value.trim() || !email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        show("err", "Please add your name and a valid email.");
        (name.value.trim() ? email : name).focus();
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = data[k] ? [].concat(data[k], v) : v; });
      data.type = form.getAttribute("data-lead");
      data.page = location.pathname;
      try { var snap = sessionStorage.getItem("os-tool"); if (snap) data.tool = JSON.parse(snap); } catch (err) {}
      btn.disabled = true;
      var api = /netlify\.app$|localhost/.test(location.hostname) ? "/api/submit-lead" : "https://officestation.netlify.app/.netlify/functions/submit-lead";
      fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Request failed"); return j; }); })
        .then(function () {
          show("ok", "Thank you. We received your request and will reply within one business day.");
          form.querySelectorAll("input:not([type=radio]):not([type=checkbox]), textarea").forEach(function (i) { if (i.name !== "city") i.value = ""; });
          if (window.gtag) window.gtag("event", "generate_lead", { lead_type: data.type });
        })
        .catch(function () { show("err", "Something went wrong sending that. Please try again in a moment."); })
        .finally(function () { btn.disabled = false; });
    });
  });
})();
