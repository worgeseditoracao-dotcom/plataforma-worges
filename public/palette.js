(() => {
  const root = document.documentElement;
  root.dataset.accent='cyan';
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    const targets = document.querySelectorAll(".hero-grid > div, .strip .wrap, .section-head, .campaign-banner, .package, .secondary, .catalog .wrap, .how > div, .cta > div");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -36px 0px" });
    targets.forEach(target => { target.classList.add("reveal"); observer.observe(target); });
    root.classList.add("js-motion");
  }
})();
