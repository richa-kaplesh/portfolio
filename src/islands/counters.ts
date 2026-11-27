/** Counts a metric from its "before" to its "after" value the first time it is seen. */

const DURATION_MS = 1300;

export function startCounters() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const animate = (el: HTMLElement) => {
    const { from, to, suffix = '', decimals = '0' } = el.dataset;
    const final = el.textContent ?? '';
    const start = Number(from);
    const end = Number(to);
    const begin = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - begin) / DURATION_MS, 1);
      const eased = 1 - (1 - t) ** 3;
      // The last frame restores the exact text from the content file.
      el.textContent =
        t < 1 ? `${(start + (end - start) * eased).toFixed(Number(decimals))}${suffix}` : final;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        animate(entry.target as HTMLElement);
      }
    },
    { threshold: 1 },
  );
  for (const el of document.querySelectorAll<HTMLElement>('[data-count]')) observer.observe(el);
}
