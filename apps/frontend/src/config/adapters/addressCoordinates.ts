export type GeographicCoordinates = {
  lat: number;
  lon: number;
};

export type AddressCoordinateTransform = (
  cx: number,
  cy: number,
) => GeographicCoordinates;

type UtmCoordinateSystem = {
  zone: number;
  hemisphere: 'north' | 'south';
};

/** Create an adapter from WGS84/ETRS89 UTM coordinates to WGS84 degrees. */
export function createUtmToWgs84Transform({
  zone,
  hemisphere,
}: UtmCoordinateSystem): AddressCoordinateTransform {
  if (!Number.isInteger(zone) || zone < 1 || zone > 60) {
    throw new RangeError('UTM zone must be an integer between 1 and 60');
  }

  const centralMeridianDegrees = (zone - 1) * 6 - 180 + 3;

  return (cx, cy) => {
    const semiMajorAxis = 6378137;
    const flattening = 1 / 298.257223563;
    const scaleFactor = 0.9996;
    const eccentricitySquared = 2 * flattening - flattening ** 2;
    const secondEccentricitySquared =
      eccentricitySquared / (1 - eccentricitySquared);
    const x = cx - 500000;
    const y = hemisphere === 'south' ? cy - 10000000 : cy;
    const meridionalArc = y / scaleFactor;
    const footprintLatitudeRatio =
      (1 - Math.sqrt(1 - eccentricitySquared)) /
      (1 + Math.sqrt(1 - eccentricitySquared));
    const mu =
      meridionalArc /
      (semiMajorAxis *
        (1 -
          eccentricitySquared / 4 -
          (3 * eccentricitySquared ** 2) / 64 -
          (5 * eccentricitySquared ** 3) / 256));
    const footprintLatitude =
      mu +
      ((3 * footprintLatitudeRatio) / 2 -
        (27 * footprintLatitudeRatio ** 3) / 32) *
        Math.sin(2 * mu) +
      ((21 * footprintLatitudeRatio ** 2) / 16 -
        (55 * footprintLatitudeRatio ** 4) / 32) *
        Math.sin(4 * mu) +
      ((151 * footprintLatitudeRatio ** 3) / 96) * Math.sin(6 * mu) +
      ((1097 * footprintLatitudeRatio ** 4) / 512) * Math.sin(8 * mu);
    const sinFootprintLatitude = Math.sin(footprintLatitude);
    const cosFootprintLatitude = Math.cos(footprintLatitude);
    const tangentSquared = Math.tan(footprintLatitude) ** 2;
    const eccentricityTerm =
      secondEccentricitySquared * cosFootprintLatitude ** 2;
    const radiusOfCurvature =
      semiMajorAxis /
      Math.sqrt(1 - eccentricitySquared * sinFootprintLatitude ** 2);
    const meridionalRadius =
      (semiMajorAxis * (1 - eccentricitySquared)) /
      (1 - eccentricitySquared * sinFootprintLatitude ** 2) ** 1.5;
    const normalizedEasting = x / (radiusOfCurvature * scaleFactor);
    const eccentricityTermSquared = eccentricityTerm ** 2;
    const tangentFourth = tangentSquared ** 2;
    const latitudeRadians =
      footprintLatitude -
      ((radiusOfCurvature * Math.tan(footprintLatitude)) / meridionalRadius) *
        (normalizedEasting ** 2 / 2 -
          ((5 +
            3 * tangentSquared +
            10 * eccentricityTerm -
            4 * eccentricityTermSquared -
            9 * secondEccentricitySquared) *
            normalizedEasting ** 4) /
            24 +
          ((61 +
            90 * tangentSquared +
            298 * eccentricityTerm +
            45 * tangentFourth -
            252 * secondEccentricitySquared -
            3 * eccentricityTermSquared) *
            normalizedEasting ** 6) /
            720);
    const longitudeRadians =
      (centralMeridianDegrees * Math.PI) / 180 +
      (normalizedEasting -
        ((1 + 2 * tangentSquared + eccentricityTerm) * normalizedEasting ** 3) /
          6 +
        ((5 -
          2 * eccentricityTerm +
          28 * tangentSquared -
          3 * eccentricityTermSquared +
          8 * secondEccentricitySquared +
          24 * tangentFourth) *
          normalizedEasting ** 5) /
          120) /
        cosFootprintLatitude;

    return {
      lat: (latitudeRadians * 180) / Math.PI,
      lon: (longitudeRadians * 180) / Math.PI,
    };
  };
}
