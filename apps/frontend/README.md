# Astro Starter Kit: Minimal

```sh
pnpm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm test:e2e`        | Run Playwright tests in all responsive viewports |
| `pnpm test:e2e:ui`     | Open Playwright's interactive test runner        |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## End-to-end tests

`pnpm test:e2e` runs the same smoke and responsive checks against
`https://det.rg.foxbyte.de` in the locally installed Microsoft Edge at desktop,
tablet, and mobile viewport sizes. Set `PLAYWRIGHT_BASE_URL` to target another
deployment. The tests cover the landing page, address search, selection of a
known building, the transition to the first data-entry step, horizontal
overflow, 200% user font sizing, Windows forced-colors mode, and automated
color-contrast checks. The generated HTML report and test artifacts are stored
in `playwright-report/` and `test-results/`.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Folder Structure

```
/src
  ├── /shared
  │   └── /locales             # GLOBAL NAMESPACES
  │       ├── common.json      # "Save", "Cancel", "Back"
  │       └── validation.json  # "Field required", "Invalid email"
  │
  ├── /modules
  │   ├── /cart
  │   │   ├── /components
  │   │   ├── /context
  │   │   └── /locales         # MODULE NAMESPACE
  │   │       ├── de.json      # Keys: "subtotal", "checkout_btn", "empty_cart"
  │   │       └── en.json
  │   │
  │   └── /user-profile
  │       └── /locales
  │           ├── de.json      # Keys: "change_password", "bio"
  │           └── en.json
```

## Create a new module

```
pnpm create:module <module_name>
```

## Software bill of materials

The checked-in `SBOM.cdx.json` is a CycloneDX 1.6 inventory and `SBOM.csv`
contains the same components in a review-friendly format. The inventory includes
application runtime dependencies, packages needed by the production build, and
the Node and NGINX container software declared by the Dockerfile. Test, lint,
formatting, scaffolding, and local-development-only packages are excluded.

Regenerate both files with pnpm 11 or newer and the installed dependency tree:

```bash
pnpm run sbom
```

Keep `sbom.config.json` synchronized with build-tool imports and the Dockerfile.
For every Git tag, the image workflow regenerates the CycloneDX file with the
tag as its component version and publishes it as a signed SBOM attestation for
the exact GHCR image digest.
