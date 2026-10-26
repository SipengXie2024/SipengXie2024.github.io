/* Study notes pages — progressive enhancement only.
   Scroll-spy for the section nav + reveal-on-scroll. Without JS every block is visible. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll-spy: highlight the nav link for the section currently in view. */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".page-nav a[href^='#']"));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      return el ? { id: id, el: el, link: link } : null;
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var match = sections.find(function (s) { return s.el === entry.target; });
          if (!match) return;
          sections.forEach(function (s) { s.link.classList.toggle("active", s === match); });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { spy.observe(s.el); });
  }

  /* Reveal-on-scroll: only blocks that start below the fold are hidden, and only
     once this script runs, so nothing already on screen flashes. */
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal")).filter(function (el) {
    return el.getBoundingClientRect().top > window.innerHeight;
  });

  var revealer = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-pending");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );
  revealEls.forEach(function (el) {
    el.classList.add("is-pending");
    revealer.observe(el);
  });
})();
