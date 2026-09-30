import { produce, type Draft } from 'immer';
import { atom, computed, type ReadableAtom, type WritableAtom } from 'nanostores';

export type FieldStore<TValue> = {
  $store: ReadableAtom<TValue>;
  $placeholder: ReadableAtom<TValue>;
  setValue: (value: TValue) => void;
  resettable: boolean;
};

type FieldStoreOptions<TObject, TValue> = {
  store: WritableAtom<TObject>;
  getValue: (obj: TObject) => TValue;
  setValue: (draft: Draft<TObject>, value: TValue) => void;
  resettable?: boolean;
  placeholderStore?: ReadableAtom<TObject>;
};

export default function makeFieldStore<TObject, TValue>(
  options: FieldStoreOptions<TObject, TValue>,
) {
  const computedStore = computed(options.store, options.getValue);

  const mutateField = (value: TValue) => {
    options.store.set(
      produce(options.store.get(), (draft) => options.setValue(draft, value)),
    );
  };

  const $placeholder: ReadableAtom<TValue> = options.placeholderStore
    ? computed(options.placeholderStore, options.getValue)
    : atom(undefined);

  return {
    $store: computedStore,
    $placeholder,
    setValue: mutateField,
    resettable: options.resettable ?? false,
  } satisfies FieldStore<TValue>;
}
