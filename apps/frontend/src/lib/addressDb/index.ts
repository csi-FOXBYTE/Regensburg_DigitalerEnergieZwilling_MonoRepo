import { addressDbConfig } from '@/config/addressDb';
import { useQuery } from '@tanstack/react-query';
import type { Database, QueryExecResult } from 'sql.js';
import initSqlJs from 'sql.js';
import { getMapResources } from '../api/public';

const LIMIT = 100;

let dbPromise: Promise<Database> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = initSqlJs({ locateFile: (f: string) => `/${f}` }).then(
      async (SQL) => {
        const { addressDatabaseUrl } = await getMapResources();
        const buf = await fetch(addressDatabaseUrl).then((r) =>
          r.arrayBuffer(),
        );
        return new SQL.Database(new Uint8Array(buf));
      },
    );
  }
  return dbPromise;
}

export interface AddressResult {
  buildingId: string;
  isValidBuilding: boolean;
  street: string;
  houseNumber: string;
  city: string;
  lat: number;
  lon: number;
  label: string;
}

export type ParsedQuery =
  | { type: 'houseNumberOnly'; houseNumber: string }
  | { type: 'streetOnly'; street: string }
  | { type: 'streetAndHouseNumber'; street: string; houseNumber: string };

function normalizeStreet(street: string): string {
  return street.replace(/str\./gi, 'straße');
}

export function parseQuery(query: string): ParsedQuery {
  const tokens = query.trim().split(/\s+/);
  const lastToken = tokens[tokens.length - 1];
  const lastIsNumber = /^\d/.test(lastToken);

  if (tokens.length === 1 && lastIsNumber)
    return { type: 'houseNumberOnly', houseNumber: lastToken };

  if (tokens.length > 1 && lastIsNumber)
    return {
      type: 'streetAndHouseNumber',
      street: normalizeStreet(tokens.slice(0, -1).join(' ')),
      houseNumber: lastToken,
    };

  return { type: 'streetOnly', street: normalizeStreet(tokens.join(' ')) };
}

function queryByHouseNumber(
  db: Database,
  houseNumber: string,
): QueryExecResult[] {
  return db.exec(
    `SELECT ba.building_id, s.name, ba.house_number, ba.cx, ba.cy,
            ba.is_valid_building
     FROM streets s JOIN building_addresses ba ON ba.street_id = s.id
     WHERE ba.house_number LIKE ?
     ORDER BY s.name, CAST(ba.house_number AS INTEGER), ba.house_number
     LIMIT ${LIMIT}`,
    [`${houseNumber}%`],
  );
}

function queryByStreetAndHouseNumber(
  db: Database,
  street: string,
  houseNumber: string,
): QueryExecResult[] {
  return db.exec(
    `SELECT ba.building_id, s.name, ba.house_number, ba.cx, ba.cy,
            ba.is_valid_building
     FROM streets s JOIN building_addresses ba ON ba.street_id = s.id
     WHERE s.name LIKE ? AND ba.house_number LIKE ?
     ORDER BY CAST(ba.house_number AS INTEGER), ba.house_number
     LIMIT ${LIMIT}`,
    [`%${street}%`, `${houseNumber}%`],
  );
}

function queryByStreet(db: Database, street: string): QueryExecResult[] {
  return db.exec(
    `SELECT ba.building_id, s.name, ba.house_number, ba.cx, ba.cy,
            ba.is_valid_building
     FROM streets s JOIN building_addresses ba ON ba.street_id = s.id
     WHERE s.name LIKE ?
     ORDER BY CAST(ba.house_number AS INTEGER), ba.house_number
     LIMIT ${LIMIT}`,
    [`%${street}%`],
  );
}

function rowsToAddressResults(rows: QueryExecResult[]): AddressResult[] {
  if (!rows.length) return [];
  return rows[0].values.map(
    ([buildingId, street, house, cx, cy, isValidBuilding]) => {
      const { cityName, transformCoordinates } = addressDbConfig;
      const { lat, lon } = transformCoordinates(cx as number, cy as number);
      return {
        buildingId: buildingId as string,
        isValidBuilding: isValidBuilding === 1,
        street: street as string,
        houseNumber: house as string,
        city: cityName,
        lat,
        lon,
        label: `${street} ${house}, ${cityName}`,
      };
    },
  );
}

function searchAddresses(db: Database, query: string): AddressResult[] {
  const parsed = parseQuery(query);
  if (parsed.type === 'houseNumberOnly')
    return rowsToAddressResults(queryByHouseNumber(db, parsed.houseNumber));
  if (parsed.type === 'streetAndHouseNumber')
    return rowsToAddressResults(
      queryByStreetAndHouseNumber(db, parsed.street, parsed.houseNumber),
    );
  return rowsToAddressResults(queryByStreet(db, parsed.street));
}

export function useAddressSearch(query: string) {
  const {
    data: db,
    isError: isDbError,
    isLoading: isDbLoading,
  } = useQuery({
    queryKey: ['address-db'],
    queryFn: getDb,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });

  const search = useQuery<AddressResult[]>({
    queryKey: ['address-search', query],
    queryFn: () => searchAddresses(db!, query),
    enabled: !!db && query.trim().length >= 2,
    staleTime: 0,
  });

  return {
    ...search,
    isError: isDbError || search.isError,
    isDbError,
    isDbLoading,
  };
}
