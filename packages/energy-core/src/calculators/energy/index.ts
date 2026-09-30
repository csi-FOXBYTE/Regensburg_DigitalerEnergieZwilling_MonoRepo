import { createCalculator } from "../../engine";
import type { DETConfig } from "../../types/config";
import type { DETInput } from "../../types/input";
import buildingInputs from "./resolvers/buildingInputs";
import buildingGeometry from "./resolvers/buildingGeometry";
import heatingSystem from "./resolvers/heatingSystem";
import primaryEnergyCarrier from "./resolvers/primaryEnergyCarrier";
import heatingDegreeDays from "./resolvers/heatingDegreeDays";
import ventilationHeatLoss from "./resolvers/ventilationHeatLoss";
import renovation from "./resolvers/renovation";
import heatingDemand from "./resolvers/heatingDemand";
import internalGains from "./resolvers/internalGains";
import energyDemandSplit from "./resolvers/energyDemandSplit";
import thermalEnergy from "./resolvers/thermalEnergy";
import electricalEnergy from "./resolvers/electricalEnergy";
import totals from "./resolvers/totals";
import exteriorWallWindowsInputs from "./resolvers/exteriorWallWindows/exteriorWallWindowsInputs";
import exteriorWallWindowsHeatLoss from "./resolvers/exteriorWallWindows/exteriorWallWindowsHeatLoss";
import exteriorWallWindowsHeatingDemand from "./resolvers/exteriorWallWindows/exteriorWallWindowsHeatingDemand";
import topFloorInputs from "./resolvers/topFloor/topFloorInputs";
import topFloorUValue from "./resolvers/topFloor/topFloorUValue";
import topFloorHeatLoss from "./resolvers/topFloor/topFloorHeatLoss";
import topFloorHeatingDemand from "./resolvers/topFloor/topFloorHeatingDemand";
import roofInputs from "./resolvers/roof/roofInputs";
import roofUValue from "./resolvers/roof/roofUValue";
import roofHeatLoss from "./resolvers/roof/roofHeatLoss";
import roofHeatingDemand from "./resolvers/roof/roofHeatingDemand";
import outerWallInputs from "./resolvers/outerWall/outerWallInputs";
import outerWallUValue from "./resolvers/outerWall/outerWallUValue";
import outerWallHeatLoss from "./resolvers/outerWall/outerWallHeatLoss";
import outerWallHeatingDemand from "./resolvers/outerWall/outerWallHeatingDemand";
import bottomFloorInputs from "./resolvers/bottomFloor/bottomFloorInputs";
import bottomFloorUValue from "./resolvers/bottomFloor/bottomFloorUValue";
import bottomFloorHeatLoss from "./resolvers/bottomFloor/bottomFloorHeatLoss";
import bottomFloorHeatingDemand from "./resolvers/bottomFloor/bottomFloorHeatingDemand";
import roofWindowsInputs from "./resolvers/roofWindows/roofWindowsInputs";
import roofWindowsHeatLoss from "./resolvers/roofWindows/roofWindowsHeatLoss";
import roofWindowsHeatingDemand from "./resolvers/roofWindows/roofWindowsHeatingDemand";

export interface DETCalculatorRegistry {}

export interface DETCalculatorContext {
  config: DETConfig;
  input: DETInput;
}

export const DETEnergyCaluclator = createCalculator<
  DETCalculatorContext,
  DETCalculatorRegistry
>([
  ...buildingInputs,
  ...buildingGeometry,
  ...heatingSystem,
  ...primaryEnergyCarrier,
  heatingDegreeDays,
  ...ventilationHeatLoss,
  ...renovation,
  ...exteriorWallWindowsInputs,
  ...exteriorWallWindowsHeatLoss,
  exteriorWallWindowsHeatingDemand,
  ...topFloorInputs,
  ...topFloorUValue,
  ...topFloorHeatLoss,
  topFloorHeatingDemand,
  ...roofInputs,
  ...roofUValue,
  ...roofHeatLoss,
  roofHeatingDemand,
  ...outerWallInputs,
  ...outerWallUValue,
  ...outerWallHeatLoss,
  outerWallHeatingDemand,
  ...bottomFloorInputs,
  ...bottomFloorUValue,
  ...bottomFloorHeatLoss,
  bottomFloorHeatingDemand,
  ...roofWindowsInputs,
  ...roofWindowsHeatLoss,
  roofWindowsHeatingDemand,
  ...heatingDemand,
  ...internalGains,
  ...energyDemandSplit,
  ...thermalEnergy,
  ...electricalEnergy,
  ...totals,
]);
