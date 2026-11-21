# Neon Cover Lab

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/verad-xe/neon-cover-lab/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/verad-xe/neon-cover-lab/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Cover Lab is an offline web app that takes your own photos plus a
caption and composes them into multi-panel cover art in the style of a
GTA poster. Panels are separated by clean white gutters, images can be
finished with sunset or neon colour grades and a layer of film grain,
and the caption is set in bold, original lettering. Finished artwork
exports as a PNG at 1080 × 1080, 1080 × 1350, or 1920 × 1080. Your
photos are read locally in the browser and are never uploaded anywhere,
and the app loads no network resources at all. The caption typeface is
Anton, released under the SIL Open Font License, and is shipped locally
under `app/fonts/`.

Built for make.fun's [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty.

## Features

- Layouts: 9-panel grid, hero + 3, quad, and full bleed
- Click a panel to select it
- Drag inside a panel to reposition its photo
- Scroll to zoom the photo within its panel
- Colour grades, including sunset and neon looks
- Editable caption with bold original lettering
- One-click PNG export in three sizes: 1080 × 1080, 1080 × 1350, and 1920 × 1080
- Runs fully offline from static files, with no network resources

## Use it

Serve `app/` with any static file server, for example:

```
node serve.ts
```

then open http://localhost:8080. Add photos, select panels, adjust each
photo and caption, and export your cover art as a PNG.

## Hand it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

## License

This project is MIT licensed (see LICENSE).
