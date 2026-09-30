import { useEffect, useState } from 'react';

function useIsDesktop() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);

    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return { mounted, isDesktop };
}
