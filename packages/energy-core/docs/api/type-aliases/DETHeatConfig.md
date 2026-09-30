[**@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore**](../README.md)

***

[@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore](../README.md) / DETHeatConfig

# Type Alias: DETHeatConfig

> **DETHeatConfig** = `object`

Defined in: [types/config/heat.ts:13](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L13)

## Properties

### primaryEnergyCarriers

> **primaryEnergyCarriers**: [`Selection`](Selection.md)[]

Defined in: [types/config/heat.ts:14](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L14)

***

### heatingSystemTypes

> **heatingSystemTypes**: [`Selection`](Selection.md)[]

Defined in: [types/config/heat.ts:15](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L15)

***

### heatingSurfaceTypes

> **heatingSurfaceTypes**: [`Selection`](Selection.md)[]

Defined in: [types/config/heat.ts:16](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L16)

***

### allowedHeatingSystemTypesByCarrier

> **allowedHeatingSystemTypesByCarrier**: [`SelectionFilter`](SelectionFilter.md)

Defined in: [types/config/heat.ts:17](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L17)

***

### hotWaterEnergyDemandFromAreaFactor

> **hotWaterEnergyDemandFromAreaFactor**: `number`

Defined in: [types/config/heat.ts:19](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L19)

***

### ventilationHeatLossCorrectionFactor

> **ventilationHeatLossCorrectionFactor**: `number`

Defined in: [types/config/heat.ts:20](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L20)

***

### heatingDegreeDays

> **heatingDegreeDays**: `number`

Defined in: [types/config/heat.ts:21](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L21)

***

### defaultPrimaryEnergyCarrier

> **defaultPrimaryEnergyCarrier**: `string`

Defined in: [types/config/heat.ts:22](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L22)

***

### defaultHeatingSystemType

> **defaultHeatingSystemType**: `string`

Defined in: [types/config/heat.ts:23](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L23)

***

### defaultHeatingSurfaceType

> **defaultHeatingSurfaceType**: `string`

Defined in: [types/config/heat.ts:24](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L24)

***

### heatingPerformanceFactor

> **heatingPerformanceFactor**: [`KeyedValues`](KeyedValues.md)\<`string`, [`YearBands`](YearBands.md)\<[`RangeBands`](RangeBands.md)\<`number`\>\>\>

Defined in: [types/config/heat.ts:25](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L25)

***

### temperatureControlPerformanceFactor

> **temperatureControlPerformanceFactor**: [`KeyedValues`](KeyedValues.md)\<`string`, [`YearBands`](YearBands.md)\<[`KeyedValues`](KeyedValues.md)\<`string`, `number`\>\>\>

Defined in: [types/config/heat.ts:26](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L26)

***

### primaryEnergyCarrierEfficiencyFactor

> **primaryEnergyCarrierEfficiencyFactor**: [`KeyedValues`](KeyedValues.md)\<`string`, `number`\>

Defined in: [types/config/heat.ts:27](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L27)

***

### co2Factor

> **co2Factor**: [`KeyedValues`](KeyedValues.md)\<`string`, `number`\>

Defined in: [types/config/heat.ts:28](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L28)

***

### primaryEnergyCarrierData

> **primaryEnergyCarrierData**: [`KeyedValues`](KeyedValues.md)\<`string`, [`PrimaryEnergyCarrierData`](PrimaryEnergyCarrierData.md)\>

Defined in: [types/config/heat.ts:29](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L29)

***

### innerSurfaceThermalResistance

> **innerSurfaceThermalResistance**: [`KeyedValues`](KeyedValues.md)\<[`HeatFlowDirection`](../enumerations/HeatFlowDirection.md), `number`\>

Defined in: [types/config/heat.ts:30](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L30)

***

### outerSurfaceThermalResistance

> **outerSurfaceThermalResistance**: [`KeyedValues`](KeyedValues.md)\<[`HeatFlowDirection`](../enumerations/HeatFlowDirection.md), `number`\>

Defined in: [types/config/heat.ts:31](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/heat.ts#L31)
