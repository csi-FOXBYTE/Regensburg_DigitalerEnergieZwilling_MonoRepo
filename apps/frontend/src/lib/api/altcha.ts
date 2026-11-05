// Altcha proof of work for the public writes (TA-51). The backend accepts a
// submission or feedback only with a solved, unused challenge in the X-Altcha
// header, so every request solves a fresh one.
//
// The widget is self-hosted (npm package, no CDN). Its "external" build has
// no inline styles and no blob workers; the PBKDF2 worker is bundled by Vite
// as a same-origin file.

export const ALTCHA_CHALLENGE_URL = '/api/public/altcha/challenge';
export const ALTCHA_HEADER = 'X-Altcha';

/** Returns the base64 payload to send in the X-Altcha header. */
export type SolveAltcha = () => Promise<string>;

let loading: Promise<void> | undefined;

function loadWidget(): Promise<void> {
  loading ??= (async () => {
    await import('altcha/external');
    const { default: Pbkdf2Worker } =
      await import('altcha/workers/pbkdf2?worker');
    globalThis.$altcha.algorithms.set(
      'PBKDF2/SHA-256',
      () => new Pbkdf2Worker(),
    );
    globalThis.$altcha.defaults.set({
      // No pointer or scroll data is collected; the challenge needs none.
      humanInteractionSignature: false,
      // Citizens wait only for the proof of work itself.
      minDuration: 0,
    });
  })().catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}

async function whenMounted(widget: HTMLElement & { verify?: unknown }) {
  // The custom element creates its component a microtask after connecting.
  for (let attempt = 0; typeof widget.verify !== 'function'; attempt++) {
    if (attempt >= 100) throw new Error('Altcha widget did not start');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/**
 * Solves a new challenge in the background. The widget stays hidden: the
 * submit buttons already show that the request is in progress, and errors
 * surface through the caller's error message.
 */
export const solveAltcha: SolveAltcha = async () => {
  await loadWidget();
  const widget = document.createElement('altcha-widget');
  widget.setAttribute('challenge', ALTCHA_CHALLENGE_URL);
  widget.setAttribute('auto', 'off');
  widget.setAttribute('display', 'invisible');
  widget.hidden = true;
  document.body.append(widget);
  try {
    await whenMounted(widget);
    const result = await widget.verify();
    if (!result?.payload) throw new Error('Altcha verification failed');
    return result.payload;
  } finally {
    widget.remove();
  }
};
