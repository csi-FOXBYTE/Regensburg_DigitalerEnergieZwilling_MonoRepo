import { Typography } from '@/components/ui/typography';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Die Seite wird statisch vorgerendert: ein Math.random() im Astro-Frontmatter
 * wuerde den Titel einmalig beim Build festschreiben und danach bis zum
 * naechsten Deployment gleich bleiben. Die Auswahl muss deshalb im Browser
 * passieren - im useEffect, damit SSR und Hydration denselben Startwert sehen.
 */
export default function LandingPageTitle() {
  const { t } = useTranslation('landingPage');
  const variations = t('titleVariations', { returnObjects: true }) as string[];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * variations.length));
  }, [variations.length]);

  return (
    <Typography as="h1" variant="h1">
      {variations[index]}
    </Typography>
  );
}
