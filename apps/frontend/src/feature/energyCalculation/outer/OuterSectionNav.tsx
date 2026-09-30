import {
  hasAtticField,
  isAtticHeatedField,
} from '@/lib/state/inputs/top-floor';
import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';

const SECTION_IDS = [
  'roof',
  'roofWindows',
  'topFloor',
  'outerWall',
  'windows',
  'bottomFloor',
] as const;

type SectionId = (typeof SECTION_IDS)[number];

function getStickyContainer(nav: HTMLElement | null) {
  const ownContainer = nav?.closest<HTMLElement>('[data-sticky-container]');
  const compactContainer =
    ownContainer?.previousElementSibling?.querySelector<HTMLElement>(
      '[data-compact-sticky] > [data-sticky-container]',
    );

  return compactContainer ?? ownContainer;
}

export default function OuterSectionNav() {
  const [active, setActive] = useState<SectionId | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const { t } = useTranslation('energyCalculation');

  const hasAtticValue = useStore(hasAtticField.$store);
  const hasAtticPlaceholder = useStore(hasAtticField.$placeholder);
  const isAtticHeatedValue = useStore(isAtticHeatedField.$store);
  const isAtticHeatedPlaceholder = useStore(isAtticHeatedField.$placeholder);

  const showTopFloor =
    !!(hasAtticValue ?? hasAtticPlaceholder) &&
    !(isAtticHeatedValue ?? isAtticHeatedPlaceholder);

  useEffect(() => {
    const sticky = getStickyContainer(navRef.current);

    const update = () => {
      // Detection line sits just below the sticky container — the same
      // position scrollTo aligns a section's top to.
      const line = (sticky?.getBoundingClientRect().height ?? 0) + 8;

      // At the very bottom of the page the last sections can never push their
      // top up to the line (not enough content below them to scroll). In that
      // case fall back to the section whose top is closest to the line.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;

      let current: SectionId | null = null;

      if (atBottom) {
        let bestDist = Infinity;
        for (const id of SECTION_IDS) {
          const el = document.getElementById(id);
          if (!el) continue;
          const dist = Math.abs(el.getBoundingClientRect().top - line);
          if (dist < bestDist) {
            bestDist = dist;
            current = id;
          }
        }
      } else {
        for (const id of SECTION_IDS) {
          const el = document.getElementById(id);
          // The last section whose top has crossed the line is the active one.
          if (el && el.getBoundingClientRect().top <= line + 2) current = id;
        }
      }

      setActive(current ?? SECTION_IDS[0]);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [
    hasAtticValue,
    hasAtticPlaceholder,
    isAtticHeatedValue,
    isAtticHeatedPlaceholder,
  ]);

  const scrollTo = (id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;

    const sticky = getStickyContainer(navRef.current);
    const stickyHeight = sticky?.getBoundingClientRect().height ?? 0;

    const top =
      el.getBoundingClientRect().top + window.scrollY - stickyHeight - 8;

    window.scrollTo({ top, behavior: 'smooth' });
  };

  const isActive = (id: SectionId) => active === id;
  // Draw the border using box-shadow, because using "border" leads to render issues where the borders don't survive repaint
  // when scrolling up, the upper border disappears, appears again when hovering the button
  const borderFix =
    'border-transparent hover:border-transparent shadow-[inset_0_0_0_1px_var(--color-primary)] hover:shadow-[inset_0_0_0_1px_var(--color-primary-hover)]';

  return (
    <nav
      ref={navRef}
      aria-label={t('outerParts.sectionNavigationLabel')}
      className="hidden min-w-0 transform-gpu gap-2 overflow-x-auto backface-hidden md:flex"
    >
      <Button
        type="button"
        className={borderFix}
        variant={isActive('roof') ? 'primary' : 'secondary'}
        onClick={() => scrollTo('roof')}
      >
        {t('outerParts.roof.roof')}
      </Button>
      {showTopFloor ? (
        <Button
          type="button"
          className={borderFix}
          variant={isActive('topFloor') ? 'primary' : 'secondary'}
          onClick={() => scrollTo('topFloor')}
        >
          {t('outerParts.topFloor.topFloor')}
        </Button>
      ) : (
        <Button
          type="button"
          className={borderFix}
          variant={isActive('roofWindows') ? 'primary' : 'secondary'}
          onClick={() => scrollTo('roofWindows')}
        >
          {t('outerParts.roofWindows.roofWindows')}
        </Button>
      )}
      <Button
        type="button"
        className={borderFix}
        variant={isActive('outerWall') ? 'primary' : 'secondary'}
        onClick={() => scrollTo('outerWall')}
      >
        {t('outerParts.outerWall.outerWall')}
      </Button>
      <Button
        type="button"
        className={borderFix}
        variant={isActive('windows') ? 'primary' : 'secondary'}
        onClick={() => scrollTo('windows')}
      >
        {t('outerParts.windows.windows')}
      </Button>
      <Button
        type="button"
        className={borderFix}
        variant={isActive('bottomFloor') ? 'primary' : 'secondary'}
        onClick={() => scrollTo('bottomFloor')}
      >
        {t('outerParts.bottomFloor.bottomFloor')}
      </Button>
    </nav>
  );
}
