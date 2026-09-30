import { computed } from 'nanostores';
import { $isExteriorWallWindowsAreaInvalid } from './exterior-wall-windows';
import { $isAdjacentWallAreaInvalid } from './outer-wall';
import { $isRoofWindowsAreaInvalid } from './roof-windows';
import { $isTopFloorAreaInvalid } from './top-floor';

export const $canProgressOuterPartsStep = computed(
  [
    $isRoofWindowsAreaInvalid,
    $isTopFloorAreaInvalid,
    $isExteriorWallWindowsAreaInvalid,
    $isAdjacentWallAreaInvalid,
  ],
  (
    roofWindowsAreaInvalid,
    topFloorAreaInvalid,
    exteriorWallWindowsAreaInvalid,
    adjacentWallAreaInvalid,
  ) =>
    !roofWindowsAreaInvalid &&
    !topFloorAreaInvalid &&
    !exteriorWallWindowsAreaInvalid &&
    !adjacentWallAreaInvalid,
);
