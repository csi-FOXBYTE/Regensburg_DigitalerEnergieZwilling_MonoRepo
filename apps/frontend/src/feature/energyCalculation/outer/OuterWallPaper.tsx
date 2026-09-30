import { FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { buildingOrNewerYearOptions } from '@/lib/state/inputs/general';
import {
  $allowsAdditionalOuterWallInsulation,
  $isAdjacentWallAreaInvalid,
  outerWallAdjacentWallAreaField,
  outerWallAreaField,
  outerWallConstructionTypeField,
  outerWallConstructionTypeOptions,
  outerWallHasInsulationField,
  outerWallInsulationThicknessField,
  outerWallYearField,
} from '@/lib/state/inputs/outer-wall';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import EnergyBooleanInput from '../EnergyBooleanInput';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoTooltipButton } from '../InfoButton';
import BuildingPartInfoButton from './BuildingPartInfoButton';

export default function OuterWallPaper() {
  const { t } = useTranslation('energyCalculation');
  const adjacentWallAreaInvalid = useStore($isAdjacentWallAreaInvalid);
  const allowsAdditionalInsulation = useStore(
    $allowsAdditionalOuterWallInsulation,
  );
  const outerWallHasInsulationValue = useStore(
    outerWallHasInsulationField.$store,
  );
  const outerWallHasInsulationPlaceholder = useStore(
    outerWallHasInsulationField.$placeholder,
  );
  const outerWallHasInsulation =
    outerWallHasInsulationValue ?? outerWallHasInsulationPlaceholder;

  return (
    <Paper
      id="outerWall"
      variant="outlined"
      className="flex flex-col gap-6 pt-4 pr-5 pb-5 pl-5"
    >
      <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FieldLegend className="col-span-full flex items-center gap-2">
          <Typography as="span" variant="h4">
            {t('outerParts.outerWall.outerWall')}
          </Typography>
          <BuildingPartInfoButton part="outerWall" />
        </FieldLegend>
        <Separator className="col-span-full" />
        <EnergySelectInput
          field={outerWallYearField}
          labelKey="outerParts.outerWall.year"
          rangeBandStore={buildingOrNewerYearOptions}
          info={
            <InfoTooltipButton
              content={t('outerParts.outerWall.tooltips.year')}
            />
          }
        />
        <EnergyNumberInput
          field={outerWallAreaField}
          labelKey="outerParts.outerWall.area"
          suffix=" m²"
          decimalScale={1}
          allowNegative={false}
          info={
            <InfoTooltipButton
              content={t('outerParts.outerWall.tooltips.area')}
            ></InfoTooltipButton>
          }
        />
        <EnergyNumberInput
          field={outerWallAdjacentWallAreaField}
          labelKey="outerParts.outerWall.adjacentWallArea"
          suffix=" m²"
          decimalScale={1}
          allowNegative={false}
          error={
            adjacentWallAreaInvalid
              ? t('outerParts.outerWall.errors.adjacentAreaExceedsWallArea')
              : undefined
          }
          info={
            <InfoTooltipButton
              content={t('outerParts.outerWall.tooltips.adjacentWallArea')}
            />
          }
        />
        <EnergySelectInput
          field={outerWallConstructionTypeField}
          labelKey="outerParts.outerWall.constructionType"
          selectionStore={outerWallConstructionTypeOptions}
          info={
            <InfoTooltipButton
              content={t('outerParts.outerWall.tooltips.constructionType')}
            ></InfoTooltipButton>
          }
        />
      </FieldSet>
      {allowsAdditionalInsulation && (
        <>
          <FieldSeparator />
          <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FieldLegend variant="label" className="col-span-full font-bold">
              {t('outerParts.insulation')}
            </FieldLegend>
            <EnergyBooleanInput
              field={outerWallHasInsulationField}
              labelKey="outerParts.outerWall.hasInsulation"
              trueKey={{
                ns: 'energyCalculation',
                key: 'booleanLabels.insulated',
              }}
              falseKey={{
                ns: 'energyCalculation',
                key: 'booleanLabels.notInsulated',
              }}
              info={
                <InfoTooltipButton
                  content={t('outerParts.outerWall.tooltips.hasInsulation')}
                ></InfoTooltipButton>
              }
            />
            {outerWallHasInsulation && (
              <EnergyNumberInput
                field={outerWallInsulationThicknessField}
                labelKey="outerParts.outerWall.insulationThickness"
                displayFactor={100}
                suffix=" cm"
                decimalScale={0}
                allowNegative={false}
                className="col-start-1"
                info={
                  <InfoTooltipButton
                    content={t(
                      'outerParts.outerWall.tooltips.insulationThickness',
                    )}
                  ></InfoTooltipButton>
                }
              />
            )}
          </FieldSet>
        </>
      )}
    </Paper>
  );
}
