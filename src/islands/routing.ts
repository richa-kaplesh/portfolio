/**
 * A small model of LLM Gateway: each request goes to the less busy of two random healthy keys.
 * A key that is rate-limited refuses requests, and they fail over to another key.
 */

const GATEWAY = { x: 150, y: 125 };
const KEY_X = 292;
const SPAWN_MS = 640;
const COOLDOWN_MS = 7000;
const AUTO_LIMIT_MS = 6500;
const MAX_WAITING = 5;
const DURATION = { in: 1000, out: 950, back: 450 };

interface Key {
  name: string;
  y: number;
  button: HTMLButtonElement;
  state: HTMLElement;
  path: Element;
  limitedUntil: number;
  inFlight: number;
}

interface Dot {
  el: SVGCircleElement;
  stage: 'in' | 'out' | 'back' | 'waiting';
  t: number;
  key?: Key;
}

const bezier = (t: number, a: number, b: number, c: number, d: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

export function startRouting(root: HTMLElement) {
  const find = <T extends Element>(selector: string) => root.querySelector<T>(selector);
  const layer = find<SVGGElement>('[data-dots]');
  const announce = find<HTMLElement>('[data-announce]');
  const pause = find<HTMLButtonElement>('[data-pause]');
  if (!layer || !announce || !pause) return;

  const paths = [...root.querySelectorAll('[data-path]')];
  const keys = [...root.querySelectorAll<HTMLButtonElement>('.key')].map((button, i): Key => {
    const state = button.querySelector<HTMLElement>('[data-state]');
    const path = paths[i];
    if (!state || !path) throw new Error('The routing scene is missing a part.');
    return {
      name: button.dataset.key ?? `key-${i + 1}`,
      y: 35 + i * 60,
      button,
      state,
      path,
      limitedUntil: 0,
      inFlight: 0,
    };
  });

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const stillFrame = [...layer.children];
  let dots: Dot[] = [];
  let clock = 0;
  let nextSpawn = 0;
  let nextAutoLimit = AUTO_LIMIT_MS;
  let last = 0;
  let frame = 0;
  let onScreen = false;
  let paused = false;

  const isLimited = (key: Key) => key.limitedUntil > clock;
  const healthy = () => keys.filter((key) => !isLimited(key));

  const pick = (avoid?: Key): Key | undefined => {
    const options = healthy().filter((key) => key !== avoid);
    const pool = options.length ? options : healthy();
    const first = pool[Math.floor(Math.random() * pool.length)];
    const second = pool[Math.floor(Math.random() * pool.length)];
    if (!first || !second) return undefined;
    return first.inFlight <= second.inFlight ? first : second;
  };

  const setText = (el: HTMLElement, text: string) => {
    if (el.textContent !== text) el.textContent = text;
  };

  const drawKeys = () => {
    for (const key of keys) {
      const limited = isLimited(key);
      const pressed = String(limited);
      if (key.button.getAttribute('aria-pressed') !== pressed) {
        key.button.setAttribute('aria-pressed', pressed);
        key.path.classList.toggle('limited', limited);
      }
      const seconds = Math.ceil((key.limitedUntil - clock) / 1000);
      setText(key.state, !limited ? 'ready' : seconds < 100 ? `429, ${seconds} s` : '429');
    }
  };

  const drawDots = () => {
    let waiting = 0;
    for (const dot of dots) {
      let x = GATEWAY.x;
      let y = GATEWAY.y;
      if (dot.stage === 'in') x = GATEWAY.x * dot.t;
      else if (dot.stage === 'waiting') x -= 24 + 14 * waiting++;
      else if (dot.key) {
        x = bezier(dot.t, GATEWAY.x, 215, 225, KEY_X);
        y = bezier(dot.t, GATEWAY.y, GATEWAY.y, dot.key.y, dot.key.y);
      }
      dot.el.setAttribute('cx', x.toFixed(1));
      dot.el.setAttribute('cy', y.toFixed(1));
    }
  };

  const route = (dot: Dot, avoid?: Key) => {
    const key = pick(avoid);
    dot.el.classList.remove('refused');
    dot.t = 0;
    dot.key = key;
    dot.stage = key ? 'out' : 'waiting';
    if (key) key.inFlight += 1;
  };

  const step = (ms: number) => {
    clock += ms;

    if (clock >= nextSpawn) {
      nextSpawn = clock + SPAWN_MS;
      if (
        dots.filter((dot) => dot.stage === 'waiting' || dot.stage === 'in').length < MAX_WAITING
      ) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('class', 'dot');
        el.setAttribute('r', '5');
        layer.append(el);
        dots.push({ el, stage: 'in', t: 0 });
      }
    }

    if (clock >= nextAutoLimit) {
      nextAutoLimit = clock + AUTO_LIMIT_MS;
      const options = healthy();
      const key = options[Math.floor(Math.random() * options.length)];
      if (key && options.length >= 3) key.limitedUntil = clock + COOLDOWN_MS * 0.6;
    }

    for (const dot of dots) {
      if (dot.stage === 'waiting') {
        if (healthy().length) route(dot);
        continue;
      }
      dot.t += ((dot.stage === 'back' ? -1 : 1) * ms) / DURATION[dot.stage];
      if (dot.stage === 'in' && dot.t >= 1) route(dot);
      else if (dot.stage === 'back' && dot.t <= 0) route(dot, dot.key);
      else if (dot.stage === 'out' && dot.t >= 1 && dot.key) {
        dot.key.inFlight -= 1;
        if (isLimited(dot.key)) {
          dot.stage = 'back';
          dot.t = 1;
          dot.el.classList.add('refused');
        } else {
          dot.el.remove();
        }
      }
    }
    dots = dots.filter((dot) => dot.el.isConnected);
  };

  const tick = (time: number) => {
    step(Math.min(time - last, 50));
    last = time;
    drawKeys();
    drawDots();
    frame = requestAnimationFrame(tick);
  };

  const update = () => {
    const run = onScreen && !paused && !document.hidden && !motion.matches;
    if (run && !frame) {
      for (const el of stillFrame) el.remove();
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    pause.hidden = motion.matches;
  };

  for (const key of keys) {
    key.button.disabled = false;
    key.button.addEventListener('click', () => {
      const limit = !isLimited(key);
      // With motion off there is no clock, so the key stays limited until it is selected again.
      key.limitedUntil = limit ? clock + (motion.matches ? 1e9 : COOLDOWN_MS) : 0;
      nextAutoLimit = clock + AUTO_LIMIT_MS;
      drawKeys();
      const left = healthy().length;
      announce.textContent = !limit
        ? `${key.name} is ready again.`
        : left
          ? `${key.name} is rate-limited. Traffic fails over to ${left} other ${left === 1 ? 'key' : 'keys'}.`
          : 'Every key is rate-limited. Requests wait at the gateway.';
    });
  }

  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? 'Play animation' : 'Pause animation';
    update();
  });

  new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? false;
    update();
  }).observe(root);
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', () => {
    for (const key of keys) key.limitedUntil = 0;
    drawKeys();
    update();
  });
  update();
}
