(() => {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = [
    [235, 230, 218],
    [196, 214, 232],
    [158, 214, 186],
    [212, 176, 106],
  ];

  let width = 0;
  let height = 0;
  let stars = [];
  let tickCount = 0;

  function starCount() {
    return Math.round(Math.min(260, Math.max(90, (width * height) / 8500)));
  }

  function makeStar() {
    const tint = palette[(Math.random() * palette.length) | 0];
    return {
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: Math.random() * width,
      tint,
      twinkle: Math.random() * Math.PI * 2,
    };
  }

  function resetStar(star) {
    star.x = (Math.random() - 0.5) * width;
    star.y = (Math.random() - 0.5) * height;
    star.z = width;
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
    stars = Array.from({ length: starCount() }, makeStar);
  }

  function draw(animate) {
    ctx.fillStyle = "#07090c";
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const depth = Math.max(width, height);

    for (const star of stars) {
      if (animate) {
        star.z -= 0.22;
        if (star.z < 8) resetStar(star);
      }

      const scale = depth / star.z;
      const x = star.x * scale + cx;
      const y = star.y * scale + cy;
      if (x < -8 || x > width + 8 || y < -8 || y > height + 8) continue;

      const closeness = 1 - star.z / depth;
      const twinkle = animate ? 0.72 + 0.28 * Math.sin(star.twinkle + tickCount * 0.008) : 0.85;
      const alpha = Math.min(1, 0.18 + closeness * 0.95) * twinkle;
      const size = 0.35 + closeness * 1.7;
      const [r, g, b] = star.tint;

      if (closeness > 0.55 && animate) {
        const trail = closeness * 7;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.28})`;
        ctx.lineWidth = size * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - star.x * 0.004 * trail, y - star.y * 0.004 * trail);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick() {
    tickCount += 1;
    draw(true);
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  draw(!reduceMotion);
  if (!reduceMotion) tick();
})();
