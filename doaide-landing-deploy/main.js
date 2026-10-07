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

  /* ---- Hero GST Calculator ---- */
  safe(function () {
    var amtInput = document.getElementById("calc-amount");
    var rateSelect = document.getElementById("calc-rate");
    if (!amtInput || !rateSelect) return;

    function fmt(n) {
      return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function calc() {
      var amount = parseFloat(amtInput.value) || 0;
      var rate = parseFloat(rateSelect.value) || 18;
      var halfRate = rate / 2;
      var gstAmt = amount * rate / 100;
      var half = amount * halfRate / 100;
      var total = amount + gstAmt;

      document.getElementById("calc-base").textContent = fmt(amount);
      document.getElementById("calc-cgst").textContent = fmt(half);
      document.getElementById("calc-sgst").textContent = fmt(half);
      document.getElementById("calc-total").textContent = fmt(total);

      var cgstLabel = document.querySelector("#calc-result .hero-calc__result-row:nth-child(2) span:first-child");
      var sgstLabel = document.querySelector("#calc-result .hero-calc__result-row:nth-child(3) span:first-child");
      if (cgstLabel) cgstLabel.textContent = "CGST (" + halfRate + "%)";
      if (sgstLabel) sgstLabel.textContent = "SGST (" + halfRate + "%)";
    }

    amtInput.addEventListener("input", calc);
    rateSelect.addEventListener("change", calc);
    calc();
  });
})();
