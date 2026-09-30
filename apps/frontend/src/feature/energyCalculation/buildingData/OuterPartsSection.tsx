import { $config } from '@/lib/state/calculation-config';
import {
  $resolvedBottomFloorInput,
  $resolvedExteriorWallWindowsInput,
  $resolvedOuterWallInput,
  $resolvedRoofInput,
  $resolvedRoofWindowsInput,
  $resolvedTopFloorInput,
} from '@/lib/state/computed/resolved-input';
import { $allowsAdditionalOuterWallInsulation } from '@/lib/state/inputs/outer-wall';
import {
  RoofInsulationType,
  type RangeKey,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import {
  BuildingDataGroup,
  BuildingDataSection,
  BuildingDataValue,
} from './BuildingDataSection';
import { MISSING_VALUE, useBuildingDataFormat } from './useBuildingDataFormat';

function metersToCentimeters(value: number | null | undefined) {
  return value == null ? value : value * 100;
}

function RoofGroup() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const config = useStore($config);
  const roof = useStore($resolvedRoofInput);
  const topFloor = useStore($resolvedTopFloorInput);

  const insulationType =
    roof.insulationType === RoofInsulationType.BETWEEN_RAFTER
      ? t('outerParts.roof.insulationTypes.betweenRafter')
      : roof.insulationType === RoofInsulationType.ABOVE_RAFTER
        ? t('outerParts.roof.insulationTypes.aboveRafter')
        : (roof.insulationType ?? MISSING_VALUE);

  return (
    <BuildingDataGroup title={t('outerParts.roof.roof')}>
      <BuildingDataValue
        label={t('export.labels.roof.year')}
        value={format.range(roof.year as RangeKey)}
      />
      <BuildingDataValue
        label={t('export.labels.roof.area')}
        value={format.number(roof.area, 1, 'm²')}
      />
      <BuildingDataValue
        label={t('export.labels.roof.constructionType')}
        value={format.option(
          config.roof.constructionTypes,
          roof.constructionType,
        )}
      />
      <BuildingDataValue
        label={t('export.labels.roof.hasAttic')}
        value={format.boolean(topFloor.hasAttic)}
      />
      {topFloor.hasAttic && (
        <BuildingDataValue
          label={t('export.labels.roof.isAtticHeated')}
          value={format.boolean(
            topFloor.isAtticHeated,
            'energyCalculation:booleanLabels.heated',
            'energyCalculation:booleanLabels.notHeated',
          )}
        />
      )}
      <BuildingDataValue
        label={t('export.labels.roof.hasInsulation')}
        value={format.boolean(
          roof.hasInsulation,
          'energyCalculation:booleanLabels.insulated',
          'energyCalculation:booleanLabels.notInsulated',
        )}
      />
      {roof.hasInsulation && (
        <>
          <BuildingDataValue
            label={t('export.labels.roof.insulationThickness')}
            value={format.number(
              metersToCentimeters(roof.insulationThickness),
              0,
              'cm',
            )}
          />
          <BuildingDataValue
            label={t('export.labels.roof.insulationType')}
            value={insulationType}
          />
        </>
      )}
    </BuildingDataGroup>
  );
}

function TopFloorGroup() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const config = useStore($config);
  const topFloor = useStore($resolvedTopFloorInput);

  return (
    <BuildingDataGroup title={t('outerParts.topFloor.topFloor')}>
      <BuildingDataValue
        label={t('export.labels.topFloor.year')}
        value={format.range(topFloor.year as RangeKey)}
      />
      <BuildingDataValue
        label={t('export.labels.topFloor.area')}
        value={format.number(topFloor.area, 1, 'm²')}
      />
      <BuildingDataValue
        label={t('export.labels.topFloor.type')}
        value={format.option(
          config.topFloor.topFloorTypes,
          topFloor.topFloorType,
        )}
      />
      <BuildingDataValue
        label={t('export.labels.topFloor.hasInsulation')}
        value={format.boolean(
          topFloor.hasInsulation,
          'energyCalculation:booleanLabels.insulated',
          'energyCalculation:booleanLabels.notInsulated',
        )}
      />
      {topFloor.hasInsulation && (
        <BuildingDataValue
          label={t('export.labels.topFloor.insulationThickness')}
          value={format.number(
            metersToCentimeters(topFloor.insulationThickness),
            0,
            'cm',
          )}
        />
      )}
    </BuildingDataGroup>
  );
}

function RoofWindowsGroup() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const config = useStore($config);
  const roofWindows = useStore($resolvedRoofWindowsInput);

  return (
    <BuildingDataGroup title={t('outerParts.roofWindows.roofWindows')}>
      <BuildingDataValue
        label={t('export.labels.roofWindows.year')}
        value={format.range(roofWindows.year as RangeKey)}
      />
      <BuildingDataValue
        label={t('export.labels.roofWindows.area')}
        value={format.number(roofWindows.area, 1, 'm²')}
      />
      <BuildingDataValue
        label={t('export.labels.roofWindows.windowType')}
        value={format.option(
          config.windows.windowTypes,
          roofWindows.windowType,
        )}
      />
      <BuildingDataValue
        label={t('export.labels.roofWindows.uValue')}
        value={format.number(roofWindows.uValue, 2, 'W/m²K')}
      />
    </BuildingDataGroup>
  );
}

function OuterWallGroup() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const config = useStore($config);
  const outerWall = useStore($resolvedOuterWallInput);
  const allowsAdditionalInsulation = useStore(
    $allowsAdditionalOuterWallInsulation,
  );

  return (
    <BuildingDataGroup title={t('outerParts.outerWall.outerWall')}>
      <BuildingDataValue
        label={t('export.labels.outerWall.year')}
        value={format.range(outerWall.year as RangeKey)}
      />
      <BuildingDataValue
        label={t('export.labels.outerWall.area')}
        value={format.number(outerWall.area, 1, 'm²')}
      />
      <BuildingDataValue
        label={t('export.labels.outerWall.adjacentWallArea')}
        value={format.number(outerWall.adjacentWallArea, 1, 'm²')}
      />
      <BuildingDataValue
        label={t('export.labels.outerWall.constructionType')}
        value={format.option(
          config.outerWall.constructionTypes,
          outerWall.constructionType,
        )}
      />
      {allowsAdditionalInsulation && (
        <>
          <BuildingDataValue
            label={t('export.labels.outerWall.hasInsulation')}
            value={format.boolean(
              outerWall.hasInsulation,
              'energyCalculation:booleanLabels.insulated',
              'energyCalculation:booleanLabels.notInsulated',
            )}
          />
          {outerWall.hasInsulation && (
            <BuildingDataValue
              label={t('export.labels.outerWall.insulationThickness')}
              value={format.number(
                metersToCentimeters(outerWall.insulationThickness),
                0,
                'cm',
              )}
            />
          )}
        </>
      )}
    </BuildingDataGroup>
  );
}

function WindowsGroup() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const config = useStore($config);
  const windows = useStore($resolvedExteriorWallWindowsInput);

  return (
    <BuildingDataGroup title={t('outerParts.windows.windows')}>
      <BuildingDataValue
        label={t('export.labels.windows.year')}
        value={format.range(windows.year as RangeKey)}
      />
      <BuildingDataValue
        label={t('export.labels.windows.area')}
        value={format.number(windows.area, 1, 'm²')}
      />
      <BuildingDataValue
        label={t('export.labels.windows.windowType')}
        value={format.option(config.windows.windowTypes, windows.windowType)}
      />
      <BuildingDataValue
        label={t('export.labels.windows.uValue')}
        value={format.number(windows.uValue, 2, 'W/m²K')}
      />
    </BuildingDataGroup>
  );
}

function BottomFloorGroup() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const config = useStore($config);
  const bottomFloor = useStore($resolvedBottomFloorInput);

  // The bottom floor is named after what it closes off, exactly as in the form.
  const context = !bottomFloor.hasBasement
    ? 'noBasement'
    : bottomFloor.isBasementHeated
      ? 'heated'
      : 'default';

  return (
    <BuildingDataGroup title={t('outerParts.bottomFloor.bottomFloor')}>
      <BuildingDataValue
        label={t(`export.labels.bottomFloor.year.${context}`)}
        value={format.range(bottomFloor.year as RangeKey)}
      />
      <BuildingDataValue
        label={t('export.labels.bottomFloor.hasBasement')}
        value={format.boolean(bottomFloor.hasBasement)}
      />
      {bottomFloor.hasBasement && (
        <BuildingDataValue
          label={t('export.labels.bottomFloor.isBasementHeated')}
          value={format.boolean(
            bottomFloor.isBasementHeated,
            'energyCalculation:booleanLabels.heated',
            'energyCalculation:booleanLabels.notHeated',
          )}
        />
      )}
      <BuildingDataValue
        label={t(`export.labels.bottomFloor.area.${context}`)}
        value={format.number(bottomFloor.area, 1, 'm²')}
      />
      <BuildingDataValue
        label={t('export.labels.bottomFloor.constructionType')}
        value={format.option(
          config.bottomFloor.constructionTypes,
          bottomFloor.constructionType,
        )}
      />
      <BuildingDataValue
        label={t('export.labels.bottomFloor.hasInsulation')}
        value={format.boolean(
          bottomFloor.hasInsulation,
          'energyCalculation:booleanLabels.insulated',
          'energyCalculation:booleanLabels.notInsulated',
        )}
      />
      {bottomFloor.hasInsulation && (
        <BuildingDataValue
          label={t('export.labels.bottomFloor.insulationThickness')}
          value={format.number(
            metersToCentimeters(bottomFloor.insulationThickness),
            0,
            'cm',
          )}
        />
      )}
    </BuildingDataGroup>
  );
}

/** Step 3: the parts of the building envelope. */
export default function OuterPartsSection() {
  const topFloor = useStore($resolvedTopFloorInput);

  // An unheated attic is closed off by the top floor, otherwise by the roof
  // itself – the same rule that decides which Paper the form shows.
  const showTopFloor = topFloor.hasAttic === true && !topFloor.isAtticHeated;

  return (
    <BuildingDataSection step={3}>
      <RoofGroup />
      {showTopFloor ? <TopFloorGroup /> : <RoofWindowsGroup />}
      <OuterWallGroup />
      <WindowsGroup />
      <BottomFloorGroup />
    </BuildingDataSection>
  );
}
