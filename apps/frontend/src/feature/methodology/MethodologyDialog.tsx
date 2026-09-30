import {
  $automaticDialog,
  $consentView,
  $resumePending,
} from '@/lib/consent/dialog-state';
import { hasSeenNotice, markNoticeSeen } from '@/lib/state/session/storage';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { municipality } from '@/config/municipality';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldLabel } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import EnergyNumberInput from '@/feature/energyCalculation/EnergyNumberInput';
import { InfoDialogButton } from '@/feature/energyCalculation/InfoButton';
import makeFieldStore from '@/lib/field-store';
import { $config } from '@/lib/state/calculation-config';
import { $step, Step } from '@/lib/state/ui/progress';
import { useStore } from '@nanostores/react';
import { BookOpenText, Database } from 'lucide-react';
import { atom } from 'nanostores';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const NOTICE_STORAGE_KEY = 'det_methodology_notice_seen_v1';
const DEMO_AUTOMATIC_AREA = 140;

type DemoInputState = {
  livingArea?: number;
};

function OpenPoint({ children }: { children: ReactNode }) {
  const { t } = useTranslation('methodology');

  return (
    <Callout variant="warning" title={t('draft.openPoint')}>
      <Typography>{children}</Typography>
    </Callout>
  );
}

function MethodologyAccordionContent({ children }: { children: ReactNode }) {
  return <AccordionContent className="h-auto">{children}</AccordionContent>;
}

function DemoInput() {
  const { t, i18n } = useTranslation('methodology');
  const inputId = useId();

  // These stores intentionally live inside the dialog content. Radix unmounts
  // this component when the dialog closes, so every opening starts fresh.
  const [inputStore] = useState(() => atom<DemoInputState>({}));
  const [automaticValueStore] = useState(() =>
    atom<DemoInputState>({ livingArea: DEMO_AUTOMATIC_AREA }),
  );
  const [livingAreaField] = useState(() =>
    makeFieldStore({
      store: inputStore,
      placeholderStore: automaticValueStore,
      getValue: (state) => state.livingArea,
      setValue: (draft, value: number | undefined) => {
        draft.livingArea = value;
      },
      resettable: true,
    }),
  );

  const userValue = useStore(livingAreaField.$store);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Typography as="h3" variant="h4">
          {t('demo.inputExplanationTitle')}
        </Typography>
        <Typography>{t('demo.inputExplanationText')}</Typography>
      </div>

      <Separator />

      <div className="flex w-full max-w-2xl flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Database
              className="text-muted-foreground size-5"
              aria-hidden="true"
            />
            <Typography as="span" variant="small" className="font-bold">
              {t('demo.automaticValueLabel')}
            </Typography>
          </div>
          <Typography variant="h4">
            {DEMO_AUTOMATIC_AREA.toLocaleString(i18n.language)} m²
          </Typography>
          <Typography>{t('demo.automaticValueHint')}</Typography>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex w-fit items-center gap-2">
            <FieldLabel htmlFor={inputId}>{t('demo.inputLabel')}</FieldLabel>
            <InfoDialogButton
              title={t('demo.infoDialog.title')}
              content={t('demo.infoDialog.description')}
            />
          </div>
          <EnergyNumberInput
            field={livingAreaField}
            id={inputId}
            aria-label={t('demo.inputLabel')}
            suffix=" m²"
            decimalScale={1}
            allowNegative={false}
            isAllowed={({ floatValue }) =>
              floatValue == null || floatValue >= 0
            }
          />
        </div>
        <Typography>
          {userValue == null
            ? t('demo.automaticExplanation')
            : t('demo.userValueExplanation')}
        </Typography>
      </div>
    </div>
  );
}

function ScopeContent() {
  const { t } = useTranslation('methodology');

  return (
    <div className="flex flex-col gap-4">
      <Typography>{t('sections.scope.intro')}</Typography>
      <Typography as="h4" variant="h4">
        {t('sections.scope.providesTitle')}
      </Typography>
      <Typography as="ul" className="list-disc space-y-1 pl-5">
        <li>{t('sections.scope.providesOrientation')}</li>
        <li>{t('sections.scope.providesComparison')}</li>
        <li>{t('sections.scope.providesNextSteps')}</li>
      </Typography>
      <Typography as="h4" variant="h4">
        {t('sections.scope.notProvidesTitle')}
      </Typography>
      <Typography as="ul" className="list-disc space-y-1 pl-5">
        <li>{t('sections.scope.notProvidesConsulting')}</li>
        <li>{t('sections.scope.notProvidesCertificate')}</li>
        <li>{t('sections.scope.notProvidesPlanning')}</li>
        <li>{t('sections.scope.notProvidesFunding')}</li>
      </Typography>
      <Typography>{t('sections.scope.conclusion')}</Typography>
      <Typography>{t('sections.scope.resultsPageHint')}</Typography>
    </div>
  );
}

function DataContent() {
  const { t } = useTranslation('methodology');

  return (
    <div className="flex flex-col gap-4">
      <Typography>
        {t('sections.data.sourcePrefix')}{' '}
        <a
          href={municipality.methodology.buildingDataSourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t('sections.data.sourceLink')}
        </a>
        {t('sections.data.sourceSuffix')}
      </Typography>
      <Typography>{t('sections.data.processing')}</Typography>
      <Typography as="h4" variant="h4">
        {t('sections.data.derivedTitle')}
      </Typography>
      <Typography as="ul" className="list-disc space-y-1 pl-5">
        <li>{t('sections.data.derivedGround')}</li>
        <li>{t('sections.data.derivedWalls')}</li>
        <li>{t('sections.data.derivedRoof')}</li>
        <li>{t('sections.data.derivedHeight')}</li>
        <li>{t('sections.data.derivedLivingArea')}</li>
      </Typography>
      <Typography as="h4" variant="h4">
        {t('sections.data.buildingPartsTitle')}
      </Typography>
      <Typography>{t('sections.data.buildingParts')}</Typography>
      <Typography as="h4" variant="h4">
        {t('sections.data.notContainedTitle')}
      </Typography>
      <Typography>{t('sections.data.notContained')}</Typography>
      <Typography>{t('sections.data.constructionYear')}</Typography>
      <OpenPoint>{t('sections.data.dataStatusOpen')}</OpenPoint>
    </div>
  );
}

function InputsContent() {
  const { t } = useTranslation('methodology');

  return (
    <div className="flex flex-col gap-4">
      <Typography>{t('sections.inputs.intro')}</Typography>
      <Typography as="h4" variant="h4">
        {t('sections.inputs.priorityTitle')}
      </Typography>
      <Typography as="ol" className="list-decimal space-y-1 pl-5">
        <li>{t('sections.inputs.priorityDefault')}</li>
        <li>{t('sections.inputs.priorityAutomatic')}</li>
        <li>{t('sections.inputs.priorityManual')}</li>
      </Typography>
      <Typography>{t('sections.inputs.reset')}</Typography>
      <Typography as="h4" variant="h4">
        {t('sections.inputs.originTitle')}
      </Typography>
      <Typography as="ul" className="list-disc space-y-1 pl-5">
        <li>{t('sections.inputs.originAutomatic')}</li>
        <li>{t('sections.inputs.originEstimated')}</li>
        <li>{t('sections.inputs.originManual')}</li>
      </Typography>
      <Typography>{t('sections.inputs.livingAreaExample')}</Typography>
    </div>
  );
}

function ModelContent() {
  const { t } = useTranslation('methodology');

  return (
    <div className="flex flex-col gap-4">
      <Typography>{t('sections.model.intro')}</Typography>
      <Typography as="h4" variant="h4">
        {t('sections.model.chainTitle')}
      </Typography>
      <Typography as="ol" className="list-decimal space-y-1 pl-5">
        <li>{t('sections.model.chainGeometry')}</li>
        <li>{t('sections.model.chainEnvelope')}</li>
        <li>{t('sections.model.chainVentilation')}</li>
        <li>{t('sections.model.chainHeating')}</li>
        <li>{t('sections.model.chainTotals')}</li>
      </Typography>
      <Typography as="h4" variant="h4">
        {t('sections.model.referencesTitle')}
      </Typography>
      <Typography>{t('sections.model.references')}</Typography>
      <OpenPoint>{t('sections.model.referencesOpen')}</OpenPoint>
    </div>
  );
}

function EnergyContent() {
  const { t } = useTranslation('methodology');

  return (
    <div className="flex flex-col gap-4">
      <Typography as="h4" variant="h4">
        {t('sections.energy.finalTitle')}
      </Typography>
      <Typography>{t('sections.energy.final')}</Typography>
      <Typography>{t('sections.energy.finalCalculation')}</Typography>
      <Separator />
      <Typography as="h4" variant="h4">
        {t('sections.energy.primaryTitle')}
      </Typography>
      <Typography>{t('sections.energy.primary')}</Typography>
      <Typography>{t('sections.energy.primaryCalculation')}</Typography>
      <Separator />
      <Typography as="h4" variant="h4">
        {t('sections.energy.emissionsTitle')}
      </Typography>
      <Typography>{t('sections.energy.emissions')}</Typography>
      <Typography>{t('sections.energy.display')}</Typography>
      <Typography>{t('sections.energy.interpretation')}</Typography>
    </div>
  );
}

function localizeSelection(
  selections: Array<{ value: string; localization: Record<string, string> }>,
  key: string,
  language: string,
): string {
  const selection = selections.find((item) => item.value === key);
  const baseLanguage = language.split('-')[0];
  return (
    selection?.localization[language] ??
    selection?.localization[baseLanguage] ??
    selection?.localization.en ??
    key
  );
}

function EnergyAssumptionsContent() {
  const { t, i18n } = useTranslation('methodology');
  const { t: tCommon } = useTranslation('common');
  const config = useStore($config);
  const language = i18n.resolvedLanguage ?? i18n.language;
  const number = (value: number, maximumFractionDigits = 3) =>
    value.toLocaleString(language, { maximumFractionDigits });

  const carrierRows = config.heat.primaryEnergyCarrierData.filter(
    ({ key }) => key !== 'none',
  );

  return (
    <div className="flex flex-col gap-4">
      <Typography>{t('sections.assumptions.intro')}</Typography>

      <Typography as="h4" variant="h4">
        {t('sections.assumptions.carrierTitle')}
      </Typography>
      <div className="overflow-x-auto">
        <table className="w-full min-w-230 border-collapse text-left text-sm">
          <caption className="sr-only">
            {t('sections.assumptions.carrierCaption')}
          </caption>
          <thead className="border-neutral-450 border-b-2">
            <tr>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.carrier')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.energyContent')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.co2')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.primaryFactor')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.unitRate')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.baseRate')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.source')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.date')}
              </th>
            </tr>
          </thead>
          <tbody>
            {carrierRows.map(({ key, value }) => (
              <tr key={key} className="border-b border-neutral-200">
                <td className="px-2 py-2">
                  {localizeSelection(
                    config.heat.primaryEnergyCarriers,
                    key,
                    language,
                  )}
                </td>
                <td className="px-2 py-2">
                  {number(value.energyPerUnit)} kWh/{value.unit}
                </td>
                <td className="px-2 py-2">
                  {number(value.co2Factor)} g CO₂/kWh
                </td>
                <td className="px-2 py-2">
                  {number(value.primaryEnergyFactor)}
                </td>
                <td className="px-2 py-2">
                  {number(value.unitRate)} €/{value.unit}
                </td>
                <td className="px-2 py-2">
                  {number(value.baseRate, 2)} {tCommon('units.eurosPerYear')}
                </td>
                <td className="px-2 py-2">{value.source ?? '–'}</td>
                <td className="px-2 py-2">
                  {value.date
                    ? new Date(value.date).toLocaleDateString(language)
                    : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Typography as="h4" variant="h4">
        {t('sections.assumptions.electricityTitle')}
      </Typography>
      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse text-left text-sm">
          <caption className="sr-only">
            {t('sections.assumptions.electricityCaption')}
          </caption>
          <thead className="border-neutral-450 border-b-2">
            <tr>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.electricityType')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.co2')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.primaryFactor')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.electricityRate')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.baseRate')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.source')}
              </th>
              <th scope="col" className="px-2 py-2 font-bold">
                {t('sections.assumptions.columns.date')}
              </th>
            </tr>
          </thead>
          <tbody>
            {config.heat.electricityTypeData.map(({ key, value }) => (
              <tr key={key} className="border-b border-neutral-200">
                <td className="px-2 py-2">
                  {localizeSelection(
                    config.heat.electricityTypes,
                    key,
                    language,
                  )}
                </td>
                <td className="px-2 py-2">
                  {number(value.co2Factor)} g CO₂/kWh
                </td>
                <td className="px-2 py-2">
                  {number(value.primaryEnergyFactor)}
                </td>
                <td className="px-2 py-2">{number(value.unitRate)} €/kWh</td>
                <td className="px-2 py-2">
                  {number(value.baseRate, 2)} {tCommon('units.eurosPerYear')}
                </td>
                <td className="px-2 py-2">{value.source ?? '–'}</td>
                <td className="px-2 py-2">
                  {value.date
                    ? new Date(value.date).toLocaleDateString(language)
                    : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Typography>{t('sections.assumptions.electricHeating')}</Typography>
      <Typography>{t('sections.assumptions.calculation')}</Typography>
      <OpenPoint>{t('sections.assumptions.sourcesOpen')}</OpenPoint>
    </div>
  );
}

function LimitsContent() {
  const { t } = useTranslation('methodology');

  return (
    <div className="flex flex-col gap-4">
      <Typography>{t('sections.limits.intro')}</Typography>
      <Typography as="ul" className="list-disc space-y-1 pl-5">
        <li>{t('sections.limits.geometry')}</li>
        <li>{t('sections.limits.condition')}</li>
        <li>{t('sections.limits.usage')}</li>
        <li>{t('sections.limits.weather')}</li>
        <li>{t('sections.limits.system')}</li>
        <li>{t('sections.limits.costs')}</li>
        <li>{t('sections.limits.renewables')}</li>
      </Typography>
      <Typography>{t('sections.limits.inputDepth')}</Typography>
      <Typography>{t('sections.limits.conclusion')}</Typography>
    </div>
  );
}

function MethodologyBody() {
  const { t } = useTranslation('methodology');

  return (
    <div className="flex flex-col gap-6">
      <Callout
        variant="warning"
        size="large"
        title={t('draft.title')}
        titleId="methodology-draft-title"
        aria-labelledby="methodology-draft-title"
      >
        <Typography variant="small">{t('draft.description')}</Typography>
      </Callout>

      <section className="flex flex-col gap-3" aria-labelledby="demo-title">
        <div>
          <Typography id="demo-title" as="h2" variant="h3">
            {t('demo.title')}
          </Typography>
          <Typography variant="muted">{t('demo.description')}</Typography>
        </div>
        <DemoInput />
        <Typography>{t('demo.explanation')}</Typography>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="topics-title">
        <div>
          <Typography id="topics-title" as="h2" variant="h3">
            {t('sectionsTitle')}
          </Typography>
          <Typography variant="muted">{t('sectionsDescription')}</Typography>
        </div>

        <Accordion type="multiple" defaultValue={['scope', 'data', 'inputs']}>
          <AccordionItem value="scope">
            <AccordionTrigger>{t('sections.scope.title')}</AccordionTrigger>
            <MethodologyAccordionContent>
              <ScopeContent />
            </MethodologyAccordionContent>
          </AccordionItem>

          <AccordionItem value="data">
            <AccordionTrigger>{t('sections.data.title')}</AccordionTrigger>
            <MethodologyAccordionContent>
              <DataContent />
            </MethodologyAccordionContent>
          </AccordionItem>

          <AccordionItem value="inputs">
            <AccordionTrigger>{t('sections.inputs.title')}</AccordionTrigger>
            <MethodologyAccordionContent>
              <InputsContent />
            </MethodologyAccordionContent>
          </AccordionItem>

          <AccordionItem value="model">
            <AccordionTrigger>{t('sections.model.title')}</AccordionTrigger>
            <MethodologyAccordionContent>
              <ModelContent />
            </MethodologyAccordionContent>
          </AccordionItem>

          <AccordionItem value="energy">
            <AccordionTrigger>{t('sections.energy.title')}</AccordionTrigger>
            <MethodologyAccordionContent>
              <EnergyContent />
            </MethodologyAccordionContent>
          </AccordionItem>

          <AccordionItem value="assumptions">
            <AccordionTrigger>
              {t('sections.assumptions.title')}
            </AccordionTrigger>
            <MethodologyAccordionContent>
              <EnergyAssumptionsContent />
            </MethodologyAccordionContent>
          </AccordionItem>

          <AccordionItem value="limits">
            <AccordionTrigger>{t('sections.limits.title')}</AccordionTrigger>
            <MethodologyAccordionContent>
              <LimitsContent />
            </MethodologyAccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}

export function MethodologyPageContent() {
  const { t } = useTranslation('methodology');

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <Typography as="h1" variant="h1">
          {t('title')}
        </Typography>
        <Typography variant="lead">{t('description')}</Typography>
      </header>

      <MethodologyBody />

      <Typography variant="verySmall">{t('footer')}</Typography>
    </div>
  );
}

function MethodologyDialogContent() {
  const { t } = useTranslation('methodology');

  return (
    <DialogContent className="sm:rounded-dialog top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:top-1/2 sm:left-1/2 sm:h-[min(88dvh,56rem)] sm:w-[calc(100%-3rem)] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border">
      <DialogHeader className="shrink-0 border-b border-neutral-200 px-4 py-4 pr-16 sm:px-6 sm:py-6 sm:pr-16">
        <div className="flex items-center gap-3">
          <BookOpenText
            className="text-primary size-7 shrink-0"
            aria-hidden="true"
          />
          <DialogTitle className="min-w-0 text-(length:--text-h2) leading-(--leading-h2)">
            {t('title')}
          </DialogTitle>
        </div>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6">
        <div className="mx-auto max-w-4xl">
          <MethodologyBody />
        </div>
      </div>

      <div className="bg-background shrink-0 border-t border-neutral-200 px-5 py-3 sm:px-8">
        <Typography variant="verySmall">{t('footer')}</Typography>
      </div>
    </DialogContent>
  );
}

export default function MethodologyDialog() {
  const { t } = useTranslation('methodology');
  const step = useStore($step);
  const [open, setOpen] = useState(false);
  const autoOpenHandled = useRef(false);
  const consentView = useStore($consentView);
  const resumePending = useStore($resumePending);
  const automaticDialog = useStore($automaticDialog);

  useEffect(() => {
    if (
      consentView !== 'closed' ||
      resumePending ||
      $automaticDialog.get() ||
      autoOpenHandled.current ||
      step < Step.GeneralData
    )
      return;

    autoOpenHandled.current = true;
    if (hasSeenNotice(NOTICE_STORAGE_KEY)) return;

    $automaticDialog.set('methodology');
    markNoticeSeen(NOTICE_STORAGE_KEY);
    setOpen(true);
  }, [step, consentView, resumePending, automaticDialog]);

  useEffect(
    () => () => {
      if ($automaticDialog.get() === 'methodology') $automaticDialog.set(null);
    },
    [],
  );

  const changeOpen = (next: boolean) => {
    if (
      next &&
      $automaticDialog.get() &&
      $automaticDialog.get() !== 'methodology'
    )
      return;
    setOpen(next);
    $automaticDialog.set(next ? 'methodology' : null);
  };

  return (
    <Dialog
      open={open && consentView === 'closed' && !resumePending}
      onOpenChange={changeOpen}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="elevated"
          size="default"
          className="text-primary hover:text-primary-hover rounded-floating-control fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-6 z-40 h-14 gap-2 px-4 shadow-[0_4px_12px_0px_rgba(0,0,0,0.22)] hover:bg-white hover:shadow-[0_0_12px_4px_rgba(0,0,0,0.15)]"
          aria-label={t('trigger')}
        >
          <BookOpenText className="size-6" aria-hidden="true" />
          <span className="hidden sm:inline">{t('trigger')}</span>
        </Button>
      </DialogTrigger>
      {open && <MethodologyDialogContent />}
    </Dialog>
  );
}
