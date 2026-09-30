import ArrowIcon from '@/components/ArrowIcon';
import { Callout } from '@/components/ui/callout';
import { Typography } from '@/components/ui/typography';
import { Calculator, FileText, MapPin, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ICON_MAP = { MapPin, Calculator, Wrench, FileText } as const;
type IconName = keyof typeof ICON_MAP;

export default function LandingPageContent() {
  const { t } = useTranslation('landingPage');
  const features = t('features', { returnObjects: true });
  return (
    <>
      <div className="flex flex-col gap-4">
        {features.map(({ icon, title, description }) => {
          const Icon = ICON_MAP[icon as IconName];
          return (
            <div key={icon} className="flex gap-4">
              <Icon
                className="text-primary mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <Typography as="h2" variant="h4">
                  {title}
                </Typography>
                <Typography variant="body">{description}</Typography>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        data-next-step
        className="group/button bg-primary text-primary-foreground hover:bg-primary-hover flex w-full cursor-pointer items-center justify-center gap-2 px-7 py-3 transition-colors active:translate-y-px active:scale-[0.985]"
      >
        {t('startButton')}
        <ArrowIcon />
      </button>

      <Callout
        variant="info"
        size="large"
        title={t('remarkTitle')}
        className="bg-background"
      >
        <Typography variant="body">{t('remarkContent')}</Typography>
      </Callout>
    </>
  );
}
