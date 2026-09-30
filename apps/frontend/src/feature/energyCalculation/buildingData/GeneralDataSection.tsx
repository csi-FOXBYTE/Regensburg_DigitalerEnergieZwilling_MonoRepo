import { $resolvedGeneralInput } from '@/lib/state/computed/resolved-input';
import {
  BuildingType,
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

/** Step 2: the general data of the building. */
export default function GeneralDataSection() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const general = useStore($resolvedGeneralInput);

  const buildingType =
    general.type === BuildingType.SINGLE_FAMILY
      ? t('generalData.buildingType.singleFamily')
      : general.type === BuildingType.MULTI_FAMILY
        ? t('generalData.buildingType.multiFamily')
        : (general.type ?? MISSING_VALUE);

  return (
    <BuildingDataSection step={2}>
      <BuildingDataGroup>
        <BuildingDataValue
          label={t('export.labels.general.constructionYear')}
          value={format.range(general.buildingYear as RangeKey)}
        />
        <BuildingDataValue
          label={t('export.labels.general.buildingType')}
          value={buildingType}
        />
        <BuildingDataValue
          label={t('export.labels.general.numberOfFloors')}
          value={format.number(general.numberOfStories, 0)}
        />
        <BuildingDataValue
          label={t('export.labels.general.livingArea')}
          value={format.number(general.livingArea, 1, 'm²')}
        />
      </BuildingDataGroup>
    </BuildingDataSection>
  );
}
