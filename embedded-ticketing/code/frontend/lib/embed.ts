/**
 * Embed mode for the event page.
 *
 * The loader at /embed/v1.js opens `/event/:id?embed=1&register=1&host=<origin>`
 * in an overlay on the organiser's site. In that mode the event page hides
 * the peakst8 chrome, opens the registration drawer straight away and tells
 * the host page when a booking completes, so the organiser's GA4 and Meta
 * pixel can record it.
 */

export const EMBED_MESSAGE_SOURCE = 'peakst8-embed';

const EMBED_SESSION_KEY = 'peakst8:embedHost';

export type EmbedMessageType = 'ready' | 'close' | 'purchase';

export interface EmbedParams {
  isEmbedded: boolean;
  openRegistration: boolean;
  hostOrigin: string | null;
  passId: string | null;
  quantity: number;
}

type SearchParamsLike = { get(name: string): string | null };

function parseOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function readEmbedParams(searchParams: SearchParamsLike): EmbedParams {
  const isEmbedded = searchParams.get('embed') === '1';
  const quantity = Number(searchParams.get('qty') ?? '1');
  const hostOrigin = parseOrigin(searchParams.get('host'));
  if (isEmbedded && hostOrigin && typeof window !== 'undefined') {
    try {
      // Razorpay and the OTP step can navigate within the iframe; keep the
      // host so the ticket page can still report the purchase.
      window.sessionStorage.setItem(EMBED_SESSION_KEY, hostOrigin);
    } catch {
      // Storage can be blocked in third-party iframes; reporting is best effort.
    }
  }
  return {
    isEmbedded,
    openRegistration: isEmbedded && searchParams.get('register') === '1',
    hostOrigin,
    passId: searchParams.get('pass'),
    quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
  };
}

export function isInsideEmbed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function storedHostOrigin(): string | null {
  try {
    return window.sessionStorage.getItem(EMBED_SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Sends a message to the organiser's page. Only the origin the loader passed
 * in `host` receives it, so nothing leaks to other frames.
 */
export function postToEmbedHost(
  type: EmbedMessageType,
  payload: Record<string, unknown> = {},
  hostOrigin: string | null = storedHostOrigin(),
): void {
  if (!isInsideEmbed() || !hostOrigin) return;
  window.parent.postMessage(
    { source: EMBED_MESSAGE_SOURCE, type, payload },
    hostOrigin,
  );
}
