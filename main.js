(function () {
  "use strict";

  function safe(fn) {
    try { fn(); } catch (err) { if (window.console && console.warn) console.warn("[doaide]", err); }
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Mobile menu ---- */
  safe(function () {
    var burger = document.querySelector(".burger");
    var nav = document.getElementById("site-nav");
    if (!burger || !nav) return;
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---- Category filter ---- */
  safe(function () {
    var tabs = document.querySelectorAll(".cat-tab");
    var cards = document.querySelectorAll(".product-card");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        var cat = tab.getAttribute("data-cat");
        cards.forEach(function (card) {
          card.style.display = (cat === "all" || card.getAttribute("data-cat") === cat) ? "" : "none";
        });
      });
    });
  });

  /* ---- FAQ accordion ---- */
  safe(function () {
    document.querySelectorAll(".faq-item__q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq-item");
        var isOpen = item.classList.contains("open");
        document.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
        if (!isOpen) item.classList.add("open");
      });
    });
  });

  /* ---- Scroll reveal ---- */
  safe(function () {
    var els = document.querySelectorAll(".rv");
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { obs.observe(el); });
  });

  /* ---- Header solidify ---- */
  safe(function () {
    var header = document.querySelector(".header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 12); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  });

  /* ---- Animated stat counters ---- */
  safe(function () {
    var counters = document.querySelectorAll(".stat__n[data-count]");
    if (!counters.length || reduced) return;
    var animated = new Set();
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || animated.has(e.target)) return;
        animated.add(e.target);
        var target = parseInt(e.target.getAttribute("data-count"), 10);
        var suffix = e.target.textContent.replace(/[\d,]+/, "").trim();
        var duration = 1200;
        var start = performance.now();
        function tick(now) {
          var p = Math.min((now - start) / duration, 1);
          var ease = 1 - Math.pow(1 - p, 3);
          var val = Math.round(target * ease);
          e.target.textContent = val.toLocaleString("en-IN") + (suffix ? suffix : "");
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { obs.observe(el); });
  });
})();
