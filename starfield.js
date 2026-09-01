(() => {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let stars = [];

  function starCount() {
    return Math.round(Math.min(420, Math.max(180, (width * height) / 4200)));
  }

  function spawn() {
    stars = Array.from({ length: starCount() }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.06 + (1 - depth) * 0.22,
        size: depth < 0.12 ? 2.5 : depth < 0.4 ? 1.6 : 1,
        alpha: 0.65 + (1 - depth) * 0.35,
      };
    });
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawn();
  }

  function paint(move) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    for (const star of stars) {
      if (move) {
        star.y += star.speed;
        if (star.y > height + 3) {
          star.y = -3;
          star.x = Math.random() * width;
        }
      }

      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    ctx.globalAlpha = 1;
  }

  function tick() {
    paint(true);
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  paint(false);
  if (!prefersReduced) requestAnimationFrame(tick);
})();
