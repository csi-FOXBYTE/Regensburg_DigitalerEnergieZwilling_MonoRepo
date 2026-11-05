export type CapabilityPage = 'delete' | 'download';

type LocationLike = Pick<Location, 'pathname' | 'hash'>;
type HistoryLike = Pick<History, 'replaceState'>;

function decodeToken(value: string): string | null {
  try {
    const token = decodeURIComponent(value);
    return token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function capabilityLink(
  origin: string,
  locale: string,
  page: CapabilityPage,
  token: string,
): string {
  return `${origin}/${locale}/${page}#${encodeURIComponent(token)}`;
}

/**
 * Reads the submission token from the URL fragment (`/de/delete#<token>`).
 * Browsers never send the fragment to a server, so it stays out of access
 * logs. Older PDFs carry `/de/delete/<token>`: that form is still accepted
 * and rewritten to the fragment form, which also keeps the token out of the
 * history entry's path and of later Referer headers.
 */
export function readCapabilityLink(
  page: CapabilityPage,
  location: LocationLike = window.location,
  history: HistoryLike = window.history,
): { locale: 'de' | 'en'; token: string | null } {
  const path = location.pathname;
  const locale = /^\/de(?:\/|$)/.test(path) ? 'de' : 'en';

  if (new RegExp(`^/(de|en)/${page}/?$`).test(path)) {
    return { locale, token: decodeToken(location.hash.slice(1)) };
  }

  const legacy =
    page === 'delete' ? /^\/(de|en)\/delete\/([^/]+)$/.exec(path) : null;
  if (!legacy) return { locale, token: null };

  const token = decodeToken(legacy[2]);
  if (token) {
    history.replaceState(null, '', capabilityLink('', locale, page, token));
  }
  return { locale, token };
}
