import assert from 'node:assert/strict';
import test from 'node:test';
import { adaptBuildingFeature } from '../src/config/adapters/buildingFeature';
import {
  $building,
  setBuilding,
  unselectBuilding,
  type BuildingFeatureSource,
} from '../src/lib/state/building';

function feature(properties: Record<string, unknown>): BuildingFeatureSource {
  return {
    getProperty: (name) => properties[name],
  };
}

test('adapts the municipality 3D Tiles schema to the building contract', () => {
  const adapted = adaptBuildingFeature(
    feature({
      id: 42,
      function: '31001_1000_foo',
      roofType: '1000',
      measuredHeight: '8.5',
      NiedrigsteTraufeDesGebaeudes: 346.2,
      HoeheGrund: '340.2',
      HoeheDach: 348.7,
      'addresses.0.ThoroughfareName':
        'Berliner Straße 7a,9;Zwickauer Straße 10',
      'addresses.0.Locality': 'Regensburg',
      'addresses.0.PostalCode': '93055',
      'digitalEnergyTwin.volume': '900',
      'digitalEnergyTwin.groundArea': 120,
      'digitalEnergyTwin.upperFloorArea': '240',
      'digitalEnergyTwin.grossExternalWallArea': 300,
      'digitalEnergyTwin.grossExternalWallAreaWithoutAttic': '260',
      'digitalEnergyTwin.grossExternalWallAreaAttic': 40,
      'digitalEnergyTwin.roofArea': '140',
      'digitalEnergyTwin.roofPitchDegrees': 0,
      'digitalEnergyTwin.height': '8.5',
      'digitalEnergyTwin.lowestEavesHeight': '6',
      'digitalEnergyTwin.envelopeArea': 560,
      'digitalEnergyTwin.adjacentBuildings': JSON.stringify([
        {
          sharedWallArea: 20,
          sharedWallAreaWithoutAttic: 16,
          sharedWallAreaAttic: 4,
        },
        {
          sharedWallArea: 15.5,
          sharedWallAreaWithoutAttic: 10,
          sharedWallAreaAttic: 5.5,
        },
      ]),
      'digitalEnergyTwin.constructionYear': '1984',
      'digitalEnergyTwin.geothermalEnergyAvailable': 'TRUE',
    }),
  );

  assert.deepEqual(adapted, {
    id: '42',
    isValidBuilding: true,
    properties: {
      measuredHeight: 8.5,
      lowestEave: 346.2,
      groundHeight: 340.2,
      roofHeight: 348.7,
      isFlatRoof: true,
      address: {
        street: 'Berliner Straße 7a',
        postcode: '93055',
        city: 'Regensburg',
      },
      digitalEnergyTwin: {
        volume: 900,
        groundArea: 120,
        upperFloorArea: 240,
        grossExternalWallArea: 300,
        grossExternalWallAreaWithoutAttic: 260,
        grossExternalWallAreaAttic: 40,
        roofArea: 140,
        roofPitchDegrees: 0,
        height: 8.5,
        lowestEavesHeight: 6,
        envelopeArea: 560,
        adjacentWallArea: 35.5,
        adjacentWallAreaWithoutAttic: 26,
        adjacentWallAreaAttic: 9.5,
        constructionYear: 1984,
        geothermalEnergyAvailable: true,
      },
    },
  });
});

test('marks non-target features invalid and tolerates missing metadata', () => {
  const adapted = adaptBuildingFeature(
    feature({
      id: 'other-1',
      function: 'garage',
      measuredHeight: 'not a number',
      'digitalEnergyTwin.adjacentBuildings': 'invalid JSON',
      'digitalEnergyTwin.geothermalEnergyAvailable': 'unknown',
    }),
  );

  assert.equal(adapted.id, 'other-1');
  assert.equal(adapted.isValidBuilding, false);
  assert.deepEqual(adapted.properties, {
    measuredHeight: undefined,
    lowestEave: undefined,
    groundHeight: undefined,
    roofHeight: undefined,
    isFlatRoof: undefined,
    address: undefined,
    digitalEnergyTwin: {
      volume: undefined,
      groundArea: undefined,
      upperFloorArea: undefined,
      grossExternalWallArea: undefined,
      grossExternalWallAreaWithoutAttic: undefined,
      grossExternalWallAreaAttic: undefined,
      roofArea: undefined,
      roofPitchDegrees: undefined,
      height: undefined,
      lowestEavesHeight: undefined,
      envelopeArea: undefined,
      adjacentWallArea: undefined,
      adjacentWallAreaWithoutAttic: undefined,
      adjacentWallAreaAttic: undefined,
      constructionYear: undefined,
      geothermalEnergyAvailable: undefined,
    },
  });
});

test('selects an invalid building only with an explicit override', () => {
  const invalidBuilding = feature({
    id: 'other-1',
    function: 'garage',
    'addresses.0.ThoroughfareName': 'Nebenstraße 2',
    'addresses.0.Locality': 'Regensburg',
  });
  const coordinates = { lon: 12.1, lat: 49.1 };

  unselectBuilding();
  setBuilding(invalidBuilding, coordinates);
  assert.equal($building.get(), null);

  setBuilding(invalidBuilding, coordinates, { allowInvalidBuilding: true });
  assert.deepEqual($building.get(), {
    id: 'other-1',
    coordinates,
    properties: adaptBuildingFeature(invalidBuilding).properties,
  });
  unselectBuilding();
});
