import {
  createUtmToWgs84Transform,
  type AddressCoordinateTransform,
} from './adapters/addressCoordinates';

type AddressDbConfig = {
  cityName: string;
  transformCoordinates: AddressCoordinateTransform;
};

export const addressDbConfig = {
  cityName: 'Regensburg',
  transformCoordinates: createUtmToWgs84Transform({
    zone: 32,
    hemisphere: 'north',
  }),
} satisfies AddressDbConfig;
