export const mapConfig = {
  baseLayer: {
    urlTemplate:
      'https://intergeo38.bayernwolke.de/betty/g_topopluslight/{z}/{x}/{y}',
    credit:
      'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
  },
  selectableBuildingFunctionPrefix: '31001_1000',
  featureColors: {
    selected: '#fff200',
    nonTarget: '#e5e5e5',
  },
  initialView: {
    longitudeDegrees: 12.09303665836369,
    latitudeDegrees: 49.02157200002277,
    heightMeters: 502.1862266683654,
    headingDegrees: 123.36360472086916,
    pitchDegrees: -18.459972601788056,
    rollDegrees: 359.99982576214444,
  },
  sessionTargetBounds: {
    westDegrees: 11.5,
    southDegrees: 48.5,
    eastDegrees: 13,
    northDegrees: 49.5,
  },
} as const;
