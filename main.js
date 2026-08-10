/* Apprend Technologies — products.aiknol.com
   Small, dependency-free behaviours: header state, menus, scroll reveal,
   and the pointer-tracked bloom on product cards.

   Everything below is wrapped in safe(): the page hides .rv content until it
   is revealed, so a failure in one behaviour must never take the reveal — and
   with it the whole page's copy — down with it. */

(function () {
  "use strict";

  function safe(fn) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.warn) console.warn("[apprend]", err);
    }
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Scroll reveal (first: it controls whether content is visible) ---- */
  safe(function () {
    var revealables = document.querySelectorAll(".rv");

    if (reduced || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    /* Stagger siblings inside any [data-stagger] container so a grid resolves
       as a wave rather than all at once. */
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var step = parseInt(group.getAttribute("data-stagger"), 10) || 55;
      Array.prototype.forEach.call(group.children, function (child, i) {
        if (child.classList.contains("rv")) {
          child.style.setProperty("--d", Math.min(i * step, 560) + "ms");
        }
      });
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealables.forEach(function (el) {
      io.observe(el);
    });
  });

  /* ---- Header: solidify once the page has scrolled off the top ---------- */
  safe(function () {
    var header = document.querySelector(".header");
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  });

  /* ---- Products dropdown and mobile drawer ------------------------------ */
  safe(function () {
    var menuBtn = document.querySelector("[data-menu-btn]");
    var menuPanel = document.querySelector("[data-menu-panel]");
    var burger = document.querySelector("[data-burger]");
    var nav = document.querySelector("[data-nav]");

    function closeMenu() {
      if (!menuBtn || !menuPanel) return;
      menuBtn.setAttribute("aria-expanded", "false");
      menuPanel.classList.remove("is-open");
    }

    function closeNav() {
      if (!burger || !nav) return;
      burger.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }

    if (menuBtn && menuPanel) {
      menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = menuBtn.getAttribute("aria-expanded") === "true";
        menuBtn.setAttribute("aria-expanded", String(!open));
        menuPanel.classList.toggle("is-open", !open);
      });

      document.addEventListener("click", function (e) {
        if (!menuPanel.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
      });
    }

    if (burger && nav) {
      burger.addEventListener("click", function () {
        var open = burger.getAttribute("aria-expanded") === "true";
        burger.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("is-open", !open);
        if (open) closeMenu();
      });

      // Any navigation from inside the drawer should dismiss it.
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
          closeNav();
          closeMenu();
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      closeMenu();
      closeNav();
    });
  });

  /* ---- Pointer-tracked bloom on cards ----------------------------------- */
  safe(function () {
    if (reduced || !window.matchMedia("(hover: hover)").matches) return;

    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener(
        "pointermove",
        function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
          card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
        },
        { passive: true }
      );
    });
  });

  /* ---- Footer year ------------------------------------------------------ */
  safe(function () {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  });
})();
