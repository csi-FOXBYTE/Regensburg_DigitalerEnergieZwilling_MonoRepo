# Whitelabeling the frontend

This guide describes the changes required **in this repository** to adapt the
Digitaler Energie Zwilling frontend for another municipality. Work through the
sections in order: the later checks assume that the municipality's assets,
translations, map data, and building metadata have already been configured.

## 1. Replace the application identity

Edit `src/config/brand.ts`:

- `applicationName` is the product name shown in the header.
- `pageTitle` is the browser tab title.
- `municipalityWebsite` is the destination of the municipality logo link.
- `logo.src` and `logo.alt` configure the header and PDF logo.
- `favicon` configures the browser icon.

Put the replacement logo under `public/assets/` and the favicon under `public/`,
or adjust the paths in `brand.ts`. Public asset paths start with `/`; for
example, `public/assets/logo.png` is referenced as `/assets/logo.png`. Check the
logo both in the responsive header and in a generated energy report because the
same source image is used in both contexts.

Edit `src/config/footerPartners.ts` to add, remove, reorder, or replace partner
and funding logos. Store these files under `public/assets/footer/` and provide a
meaningful `alt` value for every entry. The footer renders every configured
entry, so no component edit is needed when only the list changes.

The illustrations in `public/assets/buildingParts/` explain roof types and
insulation. They are not municipal logos, but they should still be reviewed for
visual and technical suitability before a release.

## 2. Apply the municipality's visual theme

### Web interface

The web theme is defined in `src/styles/global.css`. Replace the
municipality-specific primitives at the top of `:root` and then review all
semantic tokens that refer to them. In particular, check:

- brand, neutral, background, foreground, and border colors;
- primary, hover, focus-ring, destructive, and status colors;
- the dedicated compass-north color;
- footer and chart colors;
- control, surface, dialog, toolbar, badge, and floating-control radii;
- typography, content width, header heights, and spacing if the new logo or
  design system requires different dimensions.

Components consume semantic Tailwind utilities such as `bg-primary`,
`text-primary-foreground`, `border-border`, `bg-footer`, and
`text-muted-foreground`. Prefer changing their backing variables rather than
replacing colors in individual components. The `@theme inline` block documents
the purpose of each token and exposes it to Tailwind; keep that mapping intact
unless a new semantic role is deliberately introduced.

Configure component geometry with `--control-radius`, `--surface-radius`,
`--dialog-radius`, `--toolbar-radius`, `--badge-radius`, and
`--floating-control-radius`. These values back the corresponding
`rounded-control`, `rounded-surface`, `rounded-dialog`, `rounded-toolbar`,
`rounded-badge`, and `rounded-floating-control` utilities. Do not restore a
single base radius with arithmetic offsets: each role is independent so a
municipality can vary the roles intentionally. Regensburg uses
`--floating-control-radius: 9999px` to keep square floating controls circular
and wider controls, such as the “Hinweise” button, pill-shaped. Circular radio
and switch indicators remain fixed because their shape communicates their
function.

`--compass-north` controls the north half of the map compass independently of
`--primary`. Keep it aligned with the navigational convention even when the
municipality's primary action color changes.

`--landing-map-fade-start` and `--landing-map-fade-end` position the welcome
page's transition from the fixed-height map to the opaque page background.
Their percentages are relative to the map's `--content-height`. Adjust these
layout variables when necessary; do not move the gradient to the landing panel
or redesign that panel as a floating card.

The web font is imported and assigned to `--font-sans` in the same file. If the
font changes, update both places and make sure the font is actually available to
the application.

### PDF report

PDF rendering does not inherit the CSS theme. Edit `src/config/pdfTheme.ts` so
the report's foreground, muted, border, primary, positive, negative, inactive,
background, and on-solid colors match the chosen design and remain legible.

Changing only `fontFamily` or `symbolFontFamily` is not sufficient. The font
files and weights are registered in
`src/feature/export/registerPdfFonts.ts`; update those imports and registrations
as well if a different PDF font is required. Generate a report containing
symbols, energy classes, links, and renovation comparisons to verify the result.

## 3. Localize municipality-specific content

Municipality-specific translated values are collected in one namespace per
locale:

- `src/i18n/locales/de/municipality.json`
- `src/i18n/locales/en/municipality.json`

For every supported locale, review every value in `municipality.json`:

- `name`: localized municipality display name.
- `administration`: official and generic localized names of the municipal
  administration.
- `dataSubmission.server`: localized name used for the system that stores
  submitted building data.
- `energyAdvice.providerName`: localized name of the local energy-advice
  provider.
- `buildingData`: municipality key, localized publisher attribution, source
  link label, and source update frequency.
- `imprint`: contact, publisher, content responsibility, system administration,
  addresses, legal descriptions, and identification numbers.

Keep the same key structure in every locale. Values do not have to be literal
translations when an organization has a different established name in another
language.

Feature translations include these shared values using i18next nesting. For
example:

```json
{
  "placeHolder": "Adresse suchen in $t(municipality:name)..."
}
```

Do not replace nested municipality values with values from the TypeScript
configuration. Display names may vary by locale, for example `Köln` in German
and `Cologne` in English.

Changing the municipality namespace replaces repeated names and facts, but it
does not make every surrounding sentence correct. Review all namespace files
under `src/i18n/locales/<locale>/`, paying particular attention to:

- `landingPage.json`: purpose, scope, calls to action, and introductory claims.
- `energyCalculation.json`: consent, voluntary data submission, deletion,
  municipal heat-planning purpose, privacy summary, subsidies, and local
  energy-advice wording.
- `map.json`: selection instructions, address search, map errors, data deletion,
  and municipal-server wording.
- `methodology.json`: data sources, publisher, update frequency, processing,
  calculation assumptions, and limitations.
- `common.json`: footer, feedback, privacy, imprint labels, and other shared
  legal wording.
- `progressBar.json`: step names and navigation text.

Preserve interpolation placeholders such as `{{year}}` and i18next nesting such
as `$t(municipality:name)` while editing. Also keep the same translation key
structure in every supported locale.

### Legal content

The imprint uses the localized `municipality:imprint` values. Verify every
organization, responsible person, address, email address, website, legal-form
statement, statutory reference, and tax identifier in each locale.

The full privacy notice is maintained separately in
`src/content/privacy-notice.de.md`. It contains municipality-, infrastructure-,
provider-, data-source-, retention-, and jurisdiction-specific text that cannot
use i18next nesting. Review the entire document, including every placeholder,
URL, data-flow claim, legal basis, recipient, retention period, and revision
date. The privacy page currently renders this German source for every locale.
Supporting localized notices requires adding corresponding content files and
selecting the appropriate file in `src/pages/[...locale]/privacy.astro`.

### Adding or removing a locale

For a new locale, create all existing namespace files under
`src/i18n/locales/<locale>/`, including `municipality.json`, and register the
locale in `astro.config.mjs`. The `municipality` namespace is already registered
globally and typed in `src/i18next.d.ts`; update those files only if the namespace
set or typing source changes. When removing a locale, remove it from the Astro
configuration and delete or update any locale-specific routing assumptions in
the same file.

## 4. Configure municipal links and contact data

Edit `src/config/municipality.ts`:

- `methodology.buildingDataSourceUrl` is the source link shown in the
  methodology dialog.
- `energyAdvice.url` is the advice link used in the result page and PDF.
- `energyAdvice.contact` is the multiline contact block printed in both places.

These values are not localized. If the new application needs locale-specific
links or contact blocks, move the relevant values into the locale namespaces
and update their consumers rather than embedding locale checks in components.

## 5. Configure the map for the municipality

Edit `src/config/map.ts`:

- `baseLayer.urlTemplate` selects the imagery layer. It must retain the
  `{z}/{x}/{y}` placeholders expected by the map provider.
- `baseLayer.credit` is the visible attribution for that layer. Make it match
  the actual provider and license.
- `selectableBuildingFunctionPrefix` determines which 3D features users may
  select.
- `featureColors.selected` highlights the active building;
  `featureColors.nonTarget` de-emphasizes non-selectable features.
- `initialView` sets the Cesium camera position and orientation in degrees and
  metres.
- `sessionTargetBounds` defines the west, south, east, and north limits used to
  accept saved or restored camera and building positions.

Choose `sessionTargetBounds` large enough to contain every selectable building
and intended camera target, but not so large that invalid session coordinates
are accepted. Check the initial camera on desktop and mobile, and verify that
the imagery attribution remains accurate and visible.

The frontend obtains `terrainBaseUrl`, `tilesBaseUrl`, and
`addressDatabaseUrl` from `/api/public/map-resources`; their use and validation
are defined in `src/lib/api/public.ts`. If the frontend-facing response shape or
resource layout differs, adapt that repository-local client code. The tiles URL
is treated as a base URL containing `tileset.json`.

## 6. Adapt address search coordinates

Edit `src/config/addressDb.ts`:

- Set `cityName` to the name appended to address-search results.
- Set `transformCoordinates` to convert the address database's `cx` and `cy`
  values to WGS84 latitude and longitude.

The supplied `createUtmToWgs84Transform` helper supports WGS84/ETRS89 UTM
coordinates. For UTM data, set the correct zone and hemisphere. For another
coordinate reference system, implement an `AddressCoordinateTransform` in
`src/config/adapters/addressCoordinates.ts` (or another adapter module) and
select it in `addressDb.ts`.

The repository-local address search expects the SQLite tables and fields queried
in `src/lib/addressDb/index.ts`, including building ID, street, house number,
`cx`, and `cy`. If the supplied database schema differs, update those queries and
the result mapping there. Test at least one known address near each edge of the
municipality to catch wrong coordinate zones, swapped axes, or unsuitable
bounds.

## 7. Adapt 3D building metadata

`src/config/adapters/buildingFeature.ts` is the boundary between the
municipality's 3D Tiles metadata and the frontend's stable building model. Update
the property names, conversions, and derivations in `adaptBuildingFeature` to
match the new tileset. The adapter must return the `AdaptedBuildingFeature`
contract declared in `src/lib/state/building/index.ts`:

- a stable string `id` that matches address-search building IDs;
- `isValidBuilding`, which controls whether a feature is selectable;
- height and roof properties;
- an optional street, postcode, and city;
- digital-energy-twin values for volume, areas, roof pitch, height, adjacent
  wall area, construction year, and geothermal availability.

Missing source values should normally map to `undefined`, allowing the existing
calculation flow to request or infer missing inputs. Do not silently substitute
municipality-specific defaults in the adapter unless that behavior is part of
the intended calculation model. If address metadata uses a different format,
replace `addressProperty` and `addressEntries` accordingly.

The same building ID must be used by address-search rows and 3D features;
otherwise selecting a search result cannot reliably find the corresponding
feature.

## 8. Update repository-local tests and defaults

Update the focused fixtures whenever their assumptions change:

- `tests/address-db-coordinates.test.ts` for the configured coordinate system
  and known reference points.
- `tests/building-feature-adapter.test.ts` for the exact 3D metadata schema,
  selection rule, conversions, missing values, and address parsing.
- `tests/e2e/*.spec.ts` for known municipality addresses, visible content, and
  legal-page expectations.
- `tests/session-restore-codec.test.ts` for any municipality-specific address or
  coordinate fixtures.
- `playwright.config.ts` or `PLAYWRIGHT_BASE_URL` when end-to-end tests should no
  longer default to the current Regensburg deployment.

Also review repository metadata and documentation that a user or distributor
will see, especially `README.md`, `NOTICE`, and the image metadata in
`Dockerfile`. A dependency name may still contain `regensburg` because it names
the calculation-core package; do not rename imports unless the dependency itself
has actually changed.

## 9. Verify the whitelabel

Before release:

1. Search the repository for `Regensburg` and related city-specific names,
   domains, postal codes, municipality keys, regional authorities, and brand
   color names. Classify every remaining match as intentional or replace it.
2. Run the formatter, build, focused adapter tests, and end-to-end tests in the
   project's development environment.
3. Inspect both locales at desktop, tablet, mobile, 200% text size, and keyboard
   navigation. Check contrast, focus indicators, overflow, the logo, footer
   partners, map attribution, address search, and building selection.
4. Complete an energy calculation and inspect the result, energy-advice links,
   voluntary data-submission text, deletion flow, generated PDF, imprint, and
   privacy notice.
5. Reload a saved session and open a shared recovery link to confirm that the
   configured bounds and building identifiers work with the municipality's
   coordinates.

A whitelabel is complete only when the final repository-wide audit has no
unexplained municipality-specific values and the UI, map, address database, 3D
metadata, legal text, and PDF all agree on the new municipality.
