// The asteroids: each streaks across the top of the sky on a gentle wave, shedding embers
// from its tail, and comes round again once it's gone off the far side. Hovering one
// slows it right down so it's easy to catch; a click sends it tumbling and says "soon!"
// (or goes to the game). The crow knocks them off course if it flies through one.
const crowBird = document.querySelector('.crow');
const sky = document.querySelector('.asteroids');
const hushed = matchMedia('(prefers-reduced-motion: reduce)').matches;

const roids = [...document.querySelectorAll('.roid')].map((el, i) => ({
  el,
  rock: el.querySelector('.rock'),
  dir: Number(el.dataset.dir) || 1,
  lane: Number(el.dataset.lane) || 0.15,
  cross: Number(el.dataset.cross) || 30, // seconds to cross the screen
  start: Number(el.dataset.start) || 0.5,
  phase: i * 2.3,
  x: 0,
  jitter: 0, // a little up or down from its lane, new each pass
  knock: 0, // how far the crow has knocked it off its path, springing back
  knockSpeed: 0,
  pace: 1, // 1 is cruising; eases toward the target below
  held: false, // hovered or focused
  heading: Number(el.dataset.dir) < 0 ? 180 : 0, // tail trailing the right way from the very first frame
  ember: 0,
  bumped: 0,
}));

const WAVE = 0.022; // how far it rises and falls along the way, as a share of the height
const JITTER = 0.03;

let w = innerWidth;
let h = innerHeight;
let size = roids[0]?.el.offsetWidth || 120;

function onResize() {
  const nw = innerWidth;
  for (const r of roids) r.x *= nw / w;
  w = nw;
  h = innerHeight;
  size = roids[0]?.el.offsetWidth || size;
  if (hushed) place();
}

/** How far off screen it goes before coming round, so the whole tail is gone. */
const margin = () => size * 2.6;

/** Its lane, nudged by this pass's jitter: the high one only goes higher, the low one lower, so they never collide. */
function newJitter(r) {
  r.jitter = Math.random() * JITTER * (r.lane < 0.25 ? -1 : 1);
}

/** A little ember, drifting off from (x, y) by (dx, dy). */
function spark(x, y, dx, dy, s, life) {
  const p = document.createElement('i');
  p.className = 'spark';
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  p.style.setProperty('--dx', `${dx}px`);
  p.style.setProperty('--dy', `${dy}px`);
  p.style.setProperty('--s', `${s}px`);
  p.style.setProperty('--life', `${life}ms`);
  sky.appendChild(p);
  p.addEventListener('animationend', () => p.remove());
}

/** A ring of embers bursting off the rock. */
function burst(r, y) {
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
    const d = size * (0.5 + Math.random() * 0.5);
    spark(r.x, y, Math.cos(a) * d, Math.sin(a) * d, 2 + Math.random() * 3, 700 + Math.random() * 400);
  }
}

function restart(el, name) {
  el.classList.remove(name);
  void el.offsetWidth;
  el.classList.add(name);
}

/** Where it is on its wave, for a given x. */
function waveY(r, x) {
  return (r.lane + r.jitter) * h + Math.sin((x / w) * Math.PI * 1.3 + r.phase) * WAVE * h;
}

for (const r of roids) {
  r.x = r.start * w;
  const hold = (on) => () => (r.held = on);
  r.el.addEventListener('pointerenter', hold(true));
  r.el.addEventListener('pointerleave', hold(false));
  r.el.addEventListener('focus', hold(true));
  r.el.addEventListener('blur', hold(false));

  r.el.addEventListener('click', (e) => {
    restart(r.el, 'spin');
    if (!hushed) {
      burst(r, waveY(r, r.x) + r.knock);
      r.pace = 3.5; // a kick of speed, before it settles (or gets caught again)
    }
    const href = r.el.dataset.href;
    // Ctrl/Cmd-click opens the game in a new tab, like any link; otherwise it goes once the tumble's begun.
    if (href && (e.ctrlKey || e.metaKey)) open(href, '_blank', 'noopener');
    else if (href) setTimeout(() => (location.href = href), hushed ? 0 : 600);
    else restart(r.el, 'soon');
  });
  r.el.addEventListener('animationend', (e) => {
    if (e.animationName === 'tumble') r.el.classList.remove('spin');
    if (e.animationName === 'caw') r.el.classList.remove('soon');
  });
}

/** Still, for anyone who'd rather not have things moving: each one parked where it starts. */
function place() {
  for (const r of roids) {
    r.x = r.start * w;
    r.el.style.setProperty('--x', `${r.x}px`);
    r.el.style.setProperty('--y', `${waveY(r, r.x)}px`);
    r.el.style.setProperty('--heading', r.dir > 0 ? '-8deg' : '188deg');
  }
}

/** If the crow flies through one, it gets knocked up or down and sent tumbling. */
function crowKnocks(now) {
  if (!crowBird || !crowBird.classList.contains('flying')) return;
  const c = crowBird.getBoundingClientRect();
  for (const r of roids) {
    if (now - r.bumped < 1500) continue;
    const b = r.rock.getBoundingClientRect();
    const hit = c.left + c.width * 0.3 < b.right && c.right - c.width * 0.3 > b.left && c.top + c.height * 0.3 < b.bottom && c.bottom - c.height * 0.3 > b.top;
    if (!hit) continue;
    r.bumped = now;
    const down = c.top + c.height / 2 < b.top + b.height / 2;
    r.knockSpeed += (down ? 1 : -1) * h * 0.5;
    restart(r.el, 'spin');
    burst(r, b.top + b.height / 2);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  crowKnocks(now);

  for (const r of roids) {
    // Speed: cruising, slowed almost to a stop while held, kicked faster by a click.
    r.pace += ((r.held ? 0.08 : 1) - r.pace) * Math.min(1, dt * (r.pace > 1 ? 1.2 : 3));
    const cruise = (w + 2 * margin()) / r.cross;
    const vx = r.dir * cruise * r.pace;
    r.x += vx * dt;

    // Gone off the far side: round again, from the other edge.
    if (r.dir > 0 && r.x > w + margin()) {
      r.x = -margin();
      newJitter(r);
    } else if (r.dir < 0 && r.x < -margin()) {
      r.x = w + margin();
      newJitter(r);
    }

    // A knock from the crow springs back to its path.
    r.knockSpeed += (-6 * r.knock - 2.5 * r.knockSpeed) * dt;
    r.knock += r.knockSpeed * dt;
    const y = waveY(r, r.x) + r.knock;

    // The tail trails opposite the way it's actually moving.
    const vy = Math.cos((r.x / w) * Math.PI * 1.3 + r.phase) * ((Math.PI * 1.3) / w) * WAVE * h * vx + r.knockSpeed;
    const target = (Math.atan2(vy, vx) * 180) / Math.PI;
    let turn = target - r.heading;
    turn -= Math.round(turn / 360) * 360;
    r.heading += turn * Math.min(1, dt * 8);

    r.el.style.setProperty('--x', `${r.x.toFixed(1)}px`);
    r.el.style.setProperty('--y', `${y.toFixed(1)}px`);
    r.el.style.setProperty('--heading', `${r.heading.toFixed(1)}deg`);
    r.el.style.setProperty('--tilt', `${(Math.sin(t * 1.4 + r.phase) * 4).toFixed(2)}deg`);

    // Embers shed from behind the rock, fewer when it's crawling.
    r.ember -= dt;
    if (r.ember <= 0) {
      r.ember = 0.06 / Math.min(1, r.pace + 0.15);
      const a = (r.heading * Math.PI) / 180;
      const back = size * (0.35 + Math.random() * 0.5);
      const side = (Math.random() - 0.5) * size * 0.35;
      const sx = r.x - Math.cos(a) * back - Math.sin(a) * side;
      const sy = y - Math.sin(a) * back + Math.cos(a) * side;
      const drift = 20 + Math.random() * 40;
      spark(sx, sy, -Math.cos(a) * drift, -Math.sin(a) * drift + (Math.random() - 0.5) * 16, 1.5 + Math.random() * 2.5, 600 + Math.random() * 600);
    }
  }
  requestAnimationFrame(frame);
}

addEventListener('resize', onResize);
if (hushed) place();
else requestAnimationFrame(frame);
