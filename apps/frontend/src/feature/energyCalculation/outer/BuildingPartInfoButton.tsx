import { useTranslation } from 'react-i18next';
import { InfoDialogButton } from '../InfoButton';

export type BuildingPart =
  | 'roof'
  | 'roofWindows'
  | 'topFloor'
  | 'outerWall'
  | 'windows'
  | 'bottomFloor';

export type BottomFloorContext = 'default' | 'heated' | 'noBasement';

const buildingPartInfo = {
  roof: {
    image: '/assets/buildingParts/roof.png',
    titleKey: 'outerParts.roof.info.title',
    descriptionKey: 'outerParts.roof.info.description',
    imageAltKey: 'outerParts.roof.info.imageAlt',
  },
  roofWindows: {
    image: '/assets/buildingParts/roofWindows.png',
    titleKey: 'outerParts.roofWindows.info.title',
    descriptionKey: 'outerParts.roofWindows.info.description',
    imageAltKey: 'outerParts.roofWindows.info.imageAlt',
  },
  topFloor: {
    image: '/assets/buildingParts/topFloor.png',
    titleKey: 'outerParts.topFloor.info.title',
    descriptionKey: 'outerParts.topFloor.info.description',
    imageAltKey: 'outerParts.topFloor.info.imageAlt',
  },
  outerWall: {
    image: '/assets/buildingParts/outerWall.png',
    titleKey: 'outerParts.outerWall.info.title',
    descriptionKey: 'outerParts.outerWall.info.description',
    imageAltKey: 'outerParts.outerWall.info.imageAlt',
  },
  windows: {
    image: '/assets/buildingParts/windows.png',
    titleKey: 'outerParts.windows.info.title',
    descriptionKey: 'outerParts.windows.info.description',
    imageAltKey: 'outerParts.windows.info.imageAlt',
  },
} as const;

// Which graphic marks the bottom floor depends on the basement answers: without
// a basement the floor slab is the thermal boundary, with an unheated basement
// it is the basement ceiling, and with a heated basement the basement floor.
const bottomFloorInfo = {
  noBasement: {
    image: '/assets/buildingParts/bottomFloor.png',
    descriptionKey: 'outerParts.bottomFloor.info.description.noBasement',
    imageAltKey: 'outerParts.bottomFloor.info.imageAlt.noBasement',
  },
  default: {
    image: '/assets/buildingParts/bottomFloorBasement.png',
    descriptionKey: 'outerParts.bottomFloor.info.description.default',
    imageAltKey: 'outerParts.bottomFloor.info.imageAlt.default',
  },
  heated: {
    image: '/assets/buildingParts/basementFloor.png',
    descriptionKey: 'outerParts.bottomFloor.info.description.heated',
    imageAltKey: 'outerParts.bottomFloor.info.imageAlt.heated',
  },
} as const;

type BuildingPartInfoButtonProps =
  | { part: Exclude<BuildingPart, 'bottomFloor'>; context?: never }
  | { part: 'bottomFloor'; context: BottomFloorContext };

export default function BuildingPartInfoButton(
  props: BuildingPartInfoButtonProps,
) {
  const { t } = useTranslation('energyCalculation');

  const { image, titleKey, descriptionKey, imageAltKey } =
    props.part === 'bottomFloor'
      ? ({
          titleKey: 'outerParts.bottomFloor.info.title',
          ...bottomFloorInfo[props.context],
        } as const)
      : buildingPartInfo[props.part];

  return (
    <InfoDialogButton
      iconClassName="size-4.5"
      contentClassName="sm:max-w-lg"
      title={t(titleKey)}
      content={t(descriptionKey)}
      media={
        <img
          src={image}
          alt={t(imageAltKey)}
          loading="lazy"
          className="max-h-[45vh] w-full rounded-md object-contain"
        />
      }
    />
  );
}
