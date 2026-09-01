(() => {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_Z = 1.8;
  const MIN_Z = 0.12;
  const SPEED = 0.0034;

  let width = 0;
  let height = 0;
  let focal = 320;
  let stars = [];

  function starCount() {
    return Math.round(Math.min(380, Math.max(160, (width * height) / 4800)));
  }

  function resetStar(star, scatterZ) {
    star.x = (Math.random() - 0.5) * 1.15;
    star.y = (Math.random() - 0.5) * 1.15;
    star.z = scatterZ ? MIN_Z + Math.random() * (MAX_Z - MIN_Z) : MAX_Z;
  }

  function spawn() {
    stars = Array.from({ length: starCount() }, () => {
      const star = { x: 0, y: 0, z: 0 };
      resetStar(star, true);
      return star;
    });
  }

  function project(star, z) {
    const depth = z ?? star.z;
    const scale = focal / depth;
    return {
      x: width / 2 + star.x * scale,
      y: height / 2 + star.y * scale,
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    focal = Math.min(width, height) * 0.52;
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
        star.z -= SPEED;
      }

      const point = project(star);
      const offscreen =
        point.x < -20 || point.x > width + 20 || point.y < -20 || point.y > height + 20;

      if (star.z < MIN_Z || offscreen) {
        resetStar(star, false);
        continue;
      }

      const closeness = 1 - star.z / MAX_Z;
      const size = 0.7 + closeness * 2.3;
      const alpha = 0.28 + closeness * 0.72;

      if (closeness > 0.35) {
        const tail = project(star, star.z + 0.08);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        ctx.lineWidth = Math.max(1, size * 0.55);
        ctx.beginPath();
        ctx.moveTo(tail.x, tail.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
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
