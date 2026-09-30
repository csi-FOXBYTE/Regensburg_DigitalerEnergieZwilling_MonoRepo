import { $step, Step } from '@/lib/state/ui/progress';
import { useStore } from '@nanostores/react';
import { ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';

export default function ScrollToTopButton() {
  const { t } = useTranslation('energyCalculation');
  const step = useStore($step);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const visible = step >= Step.GeneralData && scrolled;

  return (
    <Button
      type="button"
      variant="elevated"
      size="icon"
      className={`text-primary hover:text-primary-hover rounded-floating-control fixed right-6 bottom-6 z-50 h-15 w-15 shadow-[0_4px_12px_0px_rgba(0,0,0,0.22)] transition-all duration-300 hover:bg-white hover:shadow-[0_0_12px_4px_rgba(0,0,0,0.15)] ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('scrollToTop')}
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
    >
      <ChevronUp aria-hidden="true" strokeWidth={3} />
    </Button>
  );
}
