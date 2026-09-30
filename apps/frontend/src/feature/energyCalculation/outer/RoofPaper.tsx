import { FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { buildingOrNewerYearOptions } from '@/lib/state/inputs/general';
import {
  roofAreaField,
  roofConstructionTypeField,
  roofConstructionTypeOptions,
  roofHasInsulationField,
  roofInsulationThicknessField,
  RoofInsulationType,
  roofInsulationTypeField,
  roofYearField,
} from '@/lib/state/inputs/roof';
import { useStore } from '@nanostores/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import EnergyBooleanInput from '../EnergyBooleanInput';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoDialogButton, InfoTooltipButton } from '../InfoButton';
import BuildingPartInfoButton from './BuildingPartInfoButton';

export default function RoofPaper() {
  const { t } = useTranslation('energyCalculation');

  const roofHasInsulationValue = useStore(roofHasInsulationField.$store);
  const roofHasInsulationPlaceholder = useStore(
    roofHasInsulationField.$placeholder,
  );
  const roofHasInsulation =
    roofHasInsulationValue ?? roofHasInsulationPlaceholder;

  const roofInsulationTypeOptions = useMemo(
    () => [
      {
        value: RoofInsulationType.BETWEEN_RAFTER,
        label: t('outerParts.roof.insulationTypes.betweenRafter'),
      },
      {
        value: RoofInsulationType.ABOVE_RAFTER,
        label: t('outerParts.roof.insulationTypes.aboveRafter'),
      },
    ],
    [t],
  );

  return (
    <Paper
      id="roof"
      variant="outlined"
      className="flex flex-col gap-6 pt-4 pr-5 pb-5 pl-5"
    >
      <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FieldLegend className="col-span-full flex items-center gap-2">
          <Typography as="span" variant="h4">
            {t('outerParts.roof.roof')}
          </Typography>
          <BuildingPartInfoButton part="roof" />
        </FieldLegend>
        <Separator className="col-span-full" />
        <EnergySelectInput
          field={roofYearField}
          labelKey="outerParts.roof.year"
          rangeBandStore={buildingOrNewerYearOptions}
          info={
            <InfoTooltipButton content={t('outerParts.roof.tooltips.year')} />
          }
        />
        <EnergyNumberInput
          field={roofAreaField}
          labelKey="outerParts.roof.area"
          suffix=" m²"
          decimalScale={1}
          allowNegative={false}
          info={
            <InfoTooltipButton content={t('outerParts.roof.tooltips.area')} />
          }
        />
        <EnergySelectInput
          field={roofConstructionTypeField}
          labelKey="outerParts.roof.constructionType"
          selectionStore={roofConstructionTypeOptions}
          sortAlphabetically
          info={
            <InfoDialogButton
              title={t('outerParts.roof.tooltips.constructionTypeTitle')}
              content={t('outerParts.roof.tooltips.constructionTypeContent')}
              media={
                <div className="flex gap-4">
                  <figure className="flex flex-1 flex-col items-center gap-2">
                    <img
                      src="/assets/buildingParts/roofGabled.png"
                      alt={t(
                        'outerParts.roof.tooltips.constructionTypeGabledRoof',
                      )}
                      className="rounded-surface w-full object-contain"
                    />
                    <figcaption className="text-sm font-medium">
                      {t('outerParts.roof.tooltips.constructionTypeGabledRoof')}
                    </figcaption>
                  </figure>
                  <figure className="flex flex-1 flex-col items-center gap-2">
                    <img
                      src="/assets/buildingParts/roofFlat.png"
                      alt={t(
                        'outerParts.roof.tooltips.constructionTypeFlatRoof',
                      )}
                      className="rounded-surface w-full object-contain"
                    />
                    <figcaption className="text-sm font-medium">
                      {t('outerParts.roof.tooltips.constructionTypeFlatRoof')}
                    </figcaption>
                  </figure>
                </div>
              }
            />
          }
        />
      </FieldSet>
      <FieldSeparator />
      <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FieldLegend variant="label" className="col-span-full font-bold">
          {t('outerParts.insulation')}
        </FieldLegend>
        <EnergyBooleanInput
          field={roofHasInsulationField}
          labelKey="outerParts.roof.hasInsulation"
          trueKey={{ ns: 'energyCalculation', key: 'booleanLabels.insulated' }}
          falseKey={{
            ns: 'energyCalculation',
            key: 'booleanLabels.notInsulated',
          }}
          info={
            <InfoTooltipButton
              content={t('outerParts.roof.tooltips.hasInsulation')}
            />
          }
        />
        {roofHasInsulation && (
          <>
            <EnergyNumberInput
              field={roofInsulationThicknessField}
              labelKey="outerParts.roof.insulationThickness"
              displayFactor={100}
              suffix=" cm"
              decimalScale={0}
              allowNegative={false}
              className="col-start-1"
              info={
                <InfoTooltipButton
                  content={t('outerParts.roof.tooltips.insulationThickness')}
                />
              }
            />
            <EnergySelectInput
              field={roofInsulationTypeField}
              labelKey="outerParts.roof.insulationType"
              options={roofInsulationTypeOptions}
              sortAlphabetically
              info={
                <InfoDialogButton
                  title={t('outerParts.roof.tooltips.insulationTypeTitle')}
                  content={t('outerParts.roof.tooltips.insulationTypeContent')}
                  media={
                    <div className="flex gap-4">
                      <figure className="flex flex-1 flex-col items-center gap-2">
                        <img
                          src="/assets/buildingParts/roofInsulationBetweenRafters.png"
                          alt={t(
                            'outerParts.roof.insulationTypes.betweenRafter',
                          )}
                          className="rounded-surface w-full object-contain"
                        />
                        <figcaption className="text-sm font-medium">
                          {t('outerParts.roof.insulationTypes.betweenRafter')}
                        </figcaption>
                      </figure>
                      <figure className="flex flex-1 flex-col items-center gap-2">
                        <img
                          src="/assets/buildingParts/roofInsulationAboveRafters.png"
                          alt={t('outerParts.roof.insulationTypes.aboveRafter')}
                          className="rounded-surface w-full object-contain"
                        />
                        <figcaption className="text-sm font-medium">
                          {t('outerParts.roof.insulationTypes.aboveRafter')}
                        </figcaption>
                      </figure>
                    </div>
                  }
                />
              }
            />
          </>
        )}
      </FieldSet>
    </Paper>
  );
}
