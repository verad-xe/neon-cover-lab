# Neon Cover Lab

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/verad-xe/neon-cover-lab/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/verad-xe/neon-cover-lab/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your photos and a caption into multi-panel,
GTA-poster-style cover art — white-guttered panels, sunset and neon colour
grades, film grain, and bold original caption lettering — exported as a PNG
at 1080 × 1080, 1080 × 1350 or 1920 × 1080. Everything runs on your own
machine: photos are read locally and never uploaded, and the app loads no
network resource. All artwork, lettering and code are original; the caption
font is Anton (SIL Open Font License), shipped under `app/fonts/`.

Built for make.fun's [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
bounty.

## Use it

Serve `app/` with any static file server, for example:

```
node serve.ts
```

then open http://localhost:8080. Add photos, click a panel to select it,
drag inside the panel to reposition its photo, scroll to zoom, pick a
layout (9-panel grid, hero + 3, quad, full bleed), a colour grade and a
caption, and export the PNG in the size you want.

## Hand it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies `app/` and `screenshots/` to the output directory and writes the
entry's `dossier.json` with the vendored make.fun library.
