(() => {
  const cube = document.getElementById("cube");
  if (!cube) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let rx = -18;
  let ry = 28;
  let rz = 10;
  let vx = 0.08;
  let vy = 0.11;
  let vz = -0.03;
  let tvx = vx;
  let tvy = vy;
  let tvz = vz;
  let nextChange = 0;

  function apply() {
    cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
  }

  function retarget(now) {
    tvx = (Math.random() - 0.5) * 0.22;
    tvy = (Math.random() - 0.5) * 0.3;
    tvz = (Math.random() - 0.5) * 0.14;
    nextChange = now + 3200 + Math.random() * 5200;
  }

  function tick(now) {
    if (now >= nextChange) retarget(now);

    vx += (tvx - vx) * 0.018;
    vy += (tvy - vy) * 0.018;
    vz += (tvz - vz) * 0.018;

    rx += vx;
    ry += vy;
    rz += vz;
    apply();
    requestAnimationFrame(tick);
  }

  apply();
  if (prefersReduced) return;
  retarget(performance.now());
  requestAnimationFrame(tick);
})();
