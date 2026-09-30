import {
  type DETConfig,
  type Ranges,
  type Selection,
  type SelectionFilter,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import type { ReadableAtom } from 'nanostores';
import { computed } from 'nanostores';
import type { FieldStore } from './field-store';
import { $config } from './state/calculation-config';
import { rangesToOptions, type RangeBandOption } from './yearHelper/rangeBandOptions';

type ValueOption<T> = { value: T };

/**
 * Keeps a field value valid for a reactive option list without relying on a
 * mounted form component. Invalid values are cleared, while a sole option is
 * selected automatically to preserve the existing select behavior.
 */
export function bindFieldToOptions<T>(
  field: FieldStore<T | undefined>,
  optionsStore: ReadableAtom<ValueOption<T>[]>,
  isEqual: (a: T, b: T) => boolean = Object.is,
): void {
  let options: readonly ValueOption<T>[] = optionsStore.get();

  const synchronize = (value: T | undefined) => {
    const onlyOption = options.length === 1 ? options[0] : undefined;
    if (onlyOption) {
      if (value == null || !isEqual(value, onlyOption.value)) {
        field.setValue(onlyOption.value);
      }
      return;
    }

    if (
      value != null &&
      !options.some((option) => isEqual(value, option.value))
    ) {
      field.setValue(undefined);
    }
  };

  optionsStore.subscribe((nextOptions) => {
    options = nextOptions;
    synchronize(field.$store.get());
  });
  field.$store.subscribe(synchronize);
}

type FilterConfig<T, K> = {
  $store: ReadableAtom<T>;
  getKey: (state: T) => K | undefined | null;
  getFilter: (config: DETConfig) => SelectionFilter<K>;
};

type RangeBandStoreOptions<T> =
  | {
      getRanges: (config: DETConfig) => Ranges;
      formatLabel?: (range: { from?: number; to?: number }) => string;
    }
  | {
      $store: ReadableAtom<T>;
      getRanges: (config: DETConfig, state: T) => Ranges;
      formatLabel?: (range: { from?: number; to?: number }) => string;
    };

export function makeRangeBandStore<T = never>(
  options: RangeBandStoreOptions<T>,
): ReadableAtom<RangeBandOption[]> {
  if ('$store' in options) {
    return computed([$config, options.$store], (config, state) =>
      rangesToOptions(options.getRanges(config, state), options.formatLabel),
    );
  }
  return computed($config, (config) =>
    rangesToOptions(options.getRanges(config), options.formatLabel),
  );
}

export function makeSelectionStore<T, K = string>(
  getOptions: (config: DETConfig) => Selection[],
  filter?: FilterConfig<T, K>,
): ReadableAtom<Selection[]> {
  if (!filter) {
    return computed($config, (config) => getOptions(config));
  }

  return computed([$config, filter.$store], (config, state) => {
    const options = getOptions(config);
    const key = filter.getKey(state);
    if (key == null) return options;
    const entry = filter.getFilter(config).find((f) => f.key === key);
    return entry
      ? options.filter((o) => entry.allowedValues.includes(o.value))
      : options;
  });
}
