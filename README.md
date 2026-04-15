# GoodData MapLibre Sprites on GitHub Pages

This repository builds a MapLibre-compatible sprite set from SVG icons in [`./icons`](./icons) and publishes the generated assets from [`./dist`](./dist) to GitHub Pages.

The build produces these files:

- `dist/sprite.json`
- `dist/sprite.png`
- `dist/sprite@2x.json`
- `dist/sprite@2x.png`

## Requirements

- Node.js 20+

## Quick start

```bash
npm install --no-package-lock
npm run build
npm run verify
```

To preview the generated assets locally:

```bash
npm run preview
```

Then open `http://localhost:4173/`.

## Repository layout

- [`icons`](./icons): source SVG icons
- [`dist`](./dist): generated sprite sheet, metadata, and preview page
- [`scripts`](./scripts): build, verification, and local preview scripts
- [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml): GitHub Pages deployment

## Adding icons

1. Add one or more `.svg` files into [`./icons`](./icons).
2. Use the filename as the sprite icon name.
3. Run:

```bash
npm run build
npm run verify
```

If you add `icons/warehouse.svg`, `icons/store.svg`, and `icons/restaurant.svg`, the icon names in the sprite metadata will be:

- `warehouse`
- `store`
- `restaurant`

## GitHub Pages deployment

This repository includes a GitHub Actions workflow that:

1. installs dependencies
2. builds the sprite assets into `dist/`
3. uploads `dist/` as the GitHub Pages artifact
4. deploys it to GitHub Pages

To enable it:

1. Push the repository to GitHub.
2. In GitHub, open `Settings -> Pages`.
3. Ensure the source is set to `GitHub Actions`.
4. Let the `Deploy GitHub Pages` workflow run on `main`.

## GoodData usage

After GitHub Pages is enabled, the sprite base URL will look like this:

```text
https://<github-user>.github.io/<repository-name>/sprite
```

MapLibre and GoodData use the sprite **base URL**, not the individual file path. MapLibre will automatically request:

- `<base-url>.json`
- `<base-url>.png`
- `<base-url>@2x.json`
- `<base-url>@2x.png`

Example:

```text
https://acme.github.io/gooddata-spritesets/sprite
```

Then GoodData can reference icon names such as:

- `warehouse`
- `store`
- `restaurant`

Those names come directly from the SVG filenames in [`./icons`](./icons).

## Local preview

The preview server serves `dist/` and includes a simple index page that:

- lists the generated sprite base URL pattern
- shows all icon metadata from `sprite.json`
- displays each icon from the generated `sprite.png`

## Notes

- The build keeps dependencies minimal by using only [`sharp`](https://www.npmjs.com/package/sharp).
- The sprite packing is deterministic, so repeated builds produce stable output ordering based on icon filename.
