import { Badge } from '@/components/ui/badge';
import { Paper } from '@/components/ui/paper';
import { Typography } from '@/components/ui/typography';
import type {
  SubsidyFinancing,
  SubsidyWithFinancing,
} from '@/lib/state/calculation-config';
import type { SubsidyBenefit } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function formatBenefit(
  benefit: SubsidyBenefit,
  labels: { upTo: string; max: string },
): string {
  const num = (n: number) => n.toLocaleString('de-DE');
  const forSuffix = benefit.for ? ` ${benefit.for}` : '';

  if (benefit.type === 'range') {
    const cap = benefit.to ? ` (${labels.max} ${num(benefit.to)} €)` : '';
    return `${num(benefit.from)} ${benefit.unit}${forSuffix}${cap}`;
  }
  const prefix = benefit.type === 'upTo' ? `${labels.upTo} ` : '';
  return `${prefix}${num(benefit.value)} ${benefit.unit}${forSuffix}`;
}

const FINANCING_LABEL_KEY = {
  loan: 'subsidy.financingLoan',
  grant: 'subsidy.financingGrant',
} as const satisfies Record<SubsidyFinancing, string>;

export function SubsidyCard({
  title,
  financing,
  content,
  href,
  benefits,
}: SubsidyWithFinancing) {
  const { t } = useTranslation('energyCalculation');
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  const benefitText = formatBenefit(benefits, {
    upTo: t('subsidy.benefitUpTo'),
    max: t('subsidy.benefitMax'),
  });
  // Die Förder-Config wird ungeprüft übernommen — fehlt `financing` noch,
  // bleibt die Bubble beim reinen Betrag statt "undefined:" anzuzeigen.
  const financingKey = FINANCING_LABEL_KEY[financing];

  return (
    <Paper className="flex flex-col gap-3 p-4">
      <Badge className="h-auto border-green-600 bg-green-600/10 whitespace-normal wrap-anywhere text-green-600">
        {financingKey ? `${t(financingKey)}: ${benefitText}` : benefitText}
      </Badge>
      <Typography as="h3" variant="h4">
        {title}
      </Typography>
      <div className="relative">
        <div
          id={contentId}
          className={`text-foreground overflow-hidden text-sm transition-[max-height] duration-300 ease-in-out [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_ol]:my-1 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-1 ${
            isOpen ? 'max-h-[600px]' : 'max-h-[4.5rem]'
          }`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {!isOpen && (
          <div className="from-card pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-t to-transparent" />
        )}
      </div>
      {isOpen && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary flex w-fit items-center gap-1 text-sm underline-offset-4 hover:underline"
        >
          {t('subsidy.moreInfo')}
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
      <button
        type="button"
        className="mt-auto flex cursor-pointer items-center justify-between"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-label={t(
          isOpen ? 'subsidy.collapseDetails' : 'subsidy.expandDetails',
          { title },
        )}
      >
        <ChevronDown
          className={`text-muted-foreground size-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
    </Paper>
  );
}
