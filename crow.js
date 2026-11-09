// The crow's habits: it blinks, looks around, caws now and then, and flies a loop when tapped.
const crow = document.querySelector('.crow');
const wire = document.querySelector('.wire');
const stars = document.querySelector('.stars');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

const rand = (min, max) => min + Math.random() * (max - min);
let flying = false;

// A sky full of stars, each twinkling at its own pace.
for (let i = 0; i < 70; i++) {
  const s = document.createElement('i');
  s.style.left = `${rand(0, 100)}%`;
  s.style.top = `${rand(0, 100)}%`;
  const size = rand(1, 2.6);
  s.style.width = s.style.height = `${size}px`;
  s.style.setProperty('--t', `${rand(1.8, 4.5)}s`);
  s.style.setProperty('--d', `${rand(0, 4)}s`);
  stars.appendChild(s);
}

/** Adds a class for a moment. */
function pulse(name, ms) {
  crow.classList.add(name);
  setTimeout(() => crow.classList.remove(name), ms);
}

function blink() {
  pulse('blink', 140);
  // Now and then, a double blink.
  if (Math.random() < 0.25) setTimeout(() => pulse('blink', 140), 260);
  setTimeout(blink, rand(1800, 5200));
}

function habits() {
  if (!flying && !still) {
    const roll = Math.random();
    if (roll < 0.35) pulse('caw', 1100);
    else if (roll < 0.7) pulse('look', rand(900, 1800));
    else pulse('flick', 500);
  }
  setTimeout(habits, rand(3500, 8000));
}

/** A smooth curve through the waypoints (Catmull-Rom), as a function of t from 0 to 1. */
function curve(points) {
  const n = points.length - 1;
  return (t) => {
    const f = Math.min(n - 1e-9, t * n);
    const i = Math.floor(f);
    const u = f - i;
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n, i + 2)];
    const at = (k) =>
      0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u);
    return [at(0), at(1)];
  };
}

/** Off the wire, a loop of the sky past the moon, and back down to land. */
function fly() {
  if (flying || still) return;
  flying = true;
  crow.classList.remove('caw', 'look');
  crow.classList.add('flying');
  wire.classList.remove('twang');
  void wire.getBoundingClientRect();
  wire.classList.add('twang');

  const w = innerWidth;
  const h = innerHeight;
  const up = -h * 0.42;
  const path = curve([
    [0, 0],
    [w * 0.08, up * 0.35],
    [w * 0.3, up * 0.85],
    [w * 0.18, up * 1.05],
    [-w * 0.12, up * 0.9],
    [-w * 0.34, up * 0.55],
    [-w * 0.22, up * 0.2],
    [-w * 0.06, up * 0.05],
    [0, 0],
  ]);
  const ms = 5200;
  const start = performance.now();
  let lastX = 0;

  function frame(now) {
    const t = Math.min(1, (now - start) / ms);
    // Eased at both ends: a hop off the wire, a glide down onto it.
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const [x, y] = path(e);
    crow.style.setProperty('--x', `${x}px`);
    crow.style.setProperty('--y', `${y}px`);
    // It faces the way it's flying.
    if (Math.abs(x - lastX) > 0.5) crow.style.setProperty('--face', x < lastX ? '-1' : '1');
    lastX = x;
    if (t < 1) return requestAnimationFrame(frame);
    // Landed: face forward again, settle, and the wire bounces under it.
    crow.style.setProperty('--x', '0px');
    crow.style.setProperty('--y', '0px');
    crow.style.setProperty('--face', '1');
    crow.classList.remove('flying');
    wire.classList.remove('twang');
    void wire.getBoundingClientRect();
    wire.classList.add('twang');
    flying = false;
    setTimeout(() => pulse('caw', 1100), 400);
  }
  requestAnimationFrame(frame);
}

crow.addEventListener('click', fly);
setTimeout(blink, 1200);
setTimeout(habits, 2500);
