/** Checks each backend once, after the page has loaded and only when its pill is on screen. */

type State = 'checking' | 'live' | 'waking' | 'offline';

const LABEL: Record<State, string> = {
  checking: 'checking',
  live: 'live',
  waking: 'waking up',
  offline: 'offline',
};

/** What the tooltip says in each state. */
const TIP: Record<State, string> = {
  checking: 'Checking the backend now.',
  live: 'Live: the backend answered just now. Select to open the app.',
  waking:
    "Waking up: this page is pinging the backend right now. It runs on Render's free tier, which sleeps when nobody is using it, so the first request starts it. This cold start can take up to a minute, and the status changes to live when it answers.",
  offline:
    "Offline: the backend did not answer within a minute. It runs on Render's free tier, so it may still be starting. Try opening the app.",
};

const QUICK_MS = 4000;
const WAKE_MS = 75_000;
const RETRY_MS = 20_000;

async function ping(url: string, timeout: number): Promise<'ok' | 'timeout' | 'failed'> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(timeout),
    });
    return response.ok ? 'ok' : 'failed';
  } catch (error) {
    return error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'failed';
  }
}

async function check(url: string, show: (state: State) => void) {
  show('checking');
  const first = await ping(url, QUICK_MS);
  if (first === 'ok') return show('live');
  // A sleeping backend is slow, or answers with an error for a moment while it starts.
  show('waking');
  if (first === 'failed') await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
  show((await ping(url, WAKE_MS)) === 'ok' ? 'live' : 'offline');
}

export function startStatus() {
  const pills = [...document.querySelectorAll<HTMLElement>('[data-health]')];
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const pill = entry.target as HTMLElement;
      const url = pill.dataset.health;
      if (!entry.isIntersecting || !url) continue;
      observer.unobserve(pill);
      // Without a connection there is nothing to learn about the backend.
      if (!navigator.onLine) continue;
      const tip = pill.closest('[data-status]')?.querySelector('[data-tip]');
      void check(url, (state) => {
        pill.dataset.state = state;
        const label = pill.querySelector('[data-label]');
        if (label) label.textContent = LABEL[state];
        if (tip) tip.textContent = TIP[state];
      });
    }
  });

  const begin = () => {
    for (const pill of pills) observer.observe(pill);
  };
  const whenIdle = () =>
    'requestIdleCallback' in window ? requestIdleCallback(begin) : setTimeout(begin, 500);
  if (document.readyState === 'complete') whenIdle();
  else addEventListener('load', whenIdle, { once: true });
}
