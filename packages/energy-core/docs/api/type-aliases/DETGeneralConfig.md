[**@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore**](../README.md)

***

[@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore](../README.md) / DETGeneralConfig

# Type Alias: DETGeneralConfig

> **DETGeneralConfig** = `object`

Defined in: [types/config/general.ts:6](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L6)

## Properties

### supportedLocales

> **supportedLocales**: `string`[]

Defined in: [types/config/general.ts:7](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L7)

***

### generalYearBands

> **generalYearBands**: [`Ranges`](Ranges.md)

Defined in: [types/config/general.ts:8](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L8)

***

### energyEfficiencyClasses

> **energyEfficiencyClasses**: [`RangeBands`](RangeBands.md)\<[`EnergyEfficiencyClass`](../enumerations/EnergyEfficiencyClass.md)\>

Defined in: [types/config/general.ts:9](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L9)

***

### assumedFloorSlabThickness

> **assumedFloorSlabThickness**: `number`

Defined in: [types/config/general.ts:11](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L11)

***

### assumedInteriorStoryHeight

> **assumedInteriorStoryHeight**: `number`

Defined in: [types/config/general.ts:12](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L12)

***

### heatedAirVolumeCorrectionFactor

> **heatedAirVolumeCorrectionFactor**: [`RangeBands`](RangeBands.md)\<`number`\>

Defined in: [types/config/general.ts:14](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L14)

***

### usableFloorAreaFactor

> **usableFloorAreaFactor**: `number`

Defined in: [types/config/general.ts:15](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L15)

***

### netFloorAreaFromUsableFloorAreaFactor

> **netFloorAreaFromUsableFloorAreaFactor**: [`KeyedValues`](KeyedValues.md)\<[`BuildingType`](../enumerations/BuildingType.md), [`KeyedValues`](KeyedValues.md)\<`boolean`, `number`\>\>

Defined in: [types/config/general.ts:17](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L17)

***

### netFloorAreaFromLivingAreaFactor

> **netFloorAreaFromLivingAreaFactor**: `number`

Defined in: [types/config/general.ts:21](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/42b8c1ede7650169c66dcc8be8ee8e455bf9d1b6/src/types/config/general.ts#L21)
