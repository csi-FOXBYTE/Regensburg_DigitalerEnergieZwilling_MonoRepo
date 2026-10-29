import { useEffect, useState } from 'react';
import { readCapabilityLink, type CapabilityPage } from '@/lib/capability-link';

const keepHistory = { replaceState: () => {} };

/**
 * Locale and token of a capability page. Follows later changes of the URL
 * fragment, e.g. when another link is pasted into the same tab, and rewrites
 * legacy path links after render instead of during it.
 */
export function useCapabilityLink(page: CapabilityPage) {
  const [link, setLink] = useState(() =>
    readCapabilityLink(page, window.location, keepHistory),
  );

  useEffect(() => {
    // Rewrites a legacy path link into the fragment form.
    readCapabilityLink(page);
    const sync = () => {
      const next = readCapabilityLink(page);
      setLink((current) =>
        current.locale === next.locale && current.token === next.token
          ? current
          : next,
      );
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [page]);

  return link;
}
