(() => {
  const root = document.documentElement;
  const choices = ["cyan", "magenta", "yellow", "black"];
  let saved;
  try { saved = localStorage.getItem("worges-accent"); } catch {}
  const select = choice => {
    if (!choices.includes(choice)) return;
    root.dataset.accent = choice;
    document.querySelectorAll(".swatch").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.choice === choice));
    });
    try { localStorage.setItem("worges-accent", choice); } catch {}
  };
  document.querySelectorAll(".swatch").forEach(button => {
    button.addEventListener("click", () => select(button.dataset.choice));
  });
  select(choices.includes(saved) ? saved : "cyan");

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
