import { Callout } from '@/components/ui/callout';
import { useStore } from '@nanostores/react';
import { useDebounce } from '@uidotdev/usehooks';
import { Command } from 'cmdk';
import { Search, X } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type AddressResult,
  parseQuery,
  useAddressSearch,
} from '../../lib/addressDb';
import { $building, unselectBuilding } from '../../lib/state/building';
import InvalidBuildingConfirmDialog from './InvalidBuildingConfirmDialog';

function highlight(
  text: string,
  needle: string,
  prefixOnly = false,
): ReactNode {
  if (!needle) return text;
  const idx = prefixOnly
    ? text.toLowerCase().startsWith(needle.toLowerCase())
      ? 0
      : -1
    : text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold">
        {text.slice(idx, idx + needle.length)}
      </strong>
      {text.slice(idx + needle.length)}
    </>
  );
}

export default function AddressSearch({
  onAddressFound,
}: {
  onAddressFound: (
    lat: string,
    lon: string,
    address: {
      buildingId: string;
      allowInvalidBuilding?: boolean;
      street?: string;
      housenumber?: string;
    },
  ) => boolean;
}) {
  const building = useStore($building);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [pendingInvalidAddress, setPendingInvalidAddress] =
    useState<AddressResult | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const { t } = useTranslation('map');

  useEffect(() => {
    if (building !== null) setSearch('');
  }, [building]);

  const debouncedSearch = useDebounce(search, 500) ?? '';
  const {
    data = [],
    isFetching,
    isSuccess,
    isError,
  } = useAddressSearch(debouncedSearch);

  const inputValue =
    search === '' ? (building?.properties.address?.street ?? '') : search;

  const showList = open && search.length >= 2 && !isError && data.length > 0;
  const showNoResults =
    open &&
    debouncedSearch.trim().length >= 2 &&
    !isFetching &&
    !isError &&
    isSuccess &&
    data.length === 0;

  const parsed = parseQuery(debouncedSearch);
  const streetNeedle = parsed.type === 'houseNumberOnly' ? '' : parsed.street;
  const houseNeedle = parsed.type === 'streetOnly' ? '' : parsed.houseNumber;

  function selectAddress(address: AddressResult, allowInvalidBuilding = false) {
    if (!address.isValidBuilding && !allowInvalidBuilding) {
      setOpen(false);
      setPendingInvalidAddress(address);
      return;
    }

    const accepted = onAddressFound(String(address.lat), String(address.lon), {
      buildingId: address.buildingId,
      allowInvalidBuilding,
      street: address.street,
      housenumber: address.houseNumber,
    });
    if (!accepted) return;
    setSearch(`${address.street} ${address.houseNumber}`);
    setOpen(false);
  }

  return (
    <>
      <div className="absolute top-2 right-24 left-2 z-10 max-w-full transition-all duration-300 md:top-4 md:right-4 md:left-4 md:max-w-md">
        <Command
          shouldFilter={false}
          loop
          aria-label={t('addressSearch.ariaFormLabel')}
        >
          <div className="relative flex items-center border border-gray-300 bg-white shadow-lg">
            <Search
              className="absolute left-3 size-4 shrink-0 text-gray-400"
              aria-hidden="true"
            />
            <Command.Input
              value={inputValue}
              onValueChange={(val) => {
                if ($building.get() !== null) unselectBuilding();
                setSearch(val);
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && data.length === 1) {
                  e.preventDefault();
                  e.stopPropagation();
                  selectAddress(data[0]);
                }
                if (e.key === 'Escape') {
                  setOpen(false);
                  e.stopPropagation();
                }
                if (e.key === 'Home' || e.key === 'End') e.stopPropagation();
              }}
              placeholder={t('addressSearch.placeHolder')}
              aria-label={t('addressSearch.ariaInputLabel')}
              className="w-full py-2 pr-9 pl-9 text-base outline-none md:py-3"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  unselectBuilding();
                  setSearch('');
                  setOpen(false);
                }}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
                aria-label={t('addressSearch.ariaDismissLabel')}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {showList && (
            <Command.List className="max-h-72 overflow-y-auto border border-t-0 border-gray-300 bg-white shadow-lg md:max-h-96">
              {data.map((d) => (
                <Command.Item
                  key={`${d.street}-${d.houseNumber}`}
                  value={d.label}
                  onSelect={() => selectAddress(d)}
                  className="cursor-pointer py-2.5 pr-4 pl-9 text-sm aria-selected:bg-gray-100 md:py-3 md:text-base"
                >
                  {highlight(d.street, streetNeedle)}{' '}
                  {highlight(d.houseNumber, houseNeedle, true)}, {d.city}
                </Command.Item>
              ))}
            </Command.List>
          )}

          {showNoResults && (
            <div className="border border-t-0 border-gray-300 bg-white px-9 py-2.5 text-sm text-gray-600 shadow-lg md:py-3 md:text-base">
              {t('addressSearch.noResults')}
            </div>
          )}

          {isError && (
            <Callout
              role="alert"
              variant="danger"
              className="border-t-0 shadow-lg md:text-base"
            >
              <span>{t('addressSearch.loadError')}</span>
            </Callout>
          )}
        </Command>

        {!hintDismissed && !building && (
          <Callout
            variant="info"
            className="mt-2 shadow-lg"
            action={
              <button
                type="button"
                onClick={() => setHintDismissed(true)}
                aria-label={t('addressSearch.ariaDismissLabel')}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            }
          >
            <p className="flex-1">
              <strong>{t('addressSearch.chooseBuilding')}</strong>{' '}
              {t('addressSearch.infoText')}
            </p>
          </Callout>
        )}
      </div>
      <InvalidBuildingConfirmDialog
        open={pendingInvalidAddress !== null}
        onOpenChange={(dialogOpen) => {
          if (!dialogOpen) setPendingInvalidAddress(null);
        }}
        onConfirm={() => {
          if (pendingInvalidAddress) selectAddress(pendingInvalidAddress, true);
          setPendingInvalidAddress(null);
        }}
      />
    </>
  );
}
