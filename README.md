# Vice Cover Maker — GTA 6 Cover Art

Turn a photo + a caption into a GTA 6-style multi-panel poster cover: pick a layout (Vice Grid 2×2, Hero one big + two small, Strip three tall), apply a Vice City sunset/neon grade, set a bold Anton caption, and export a PNG at 1080×1080, 1080×1350 or 1920×1080. Runs fully offline in the browser.

![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/zhengxinjia82-dev/gta6-cover-art/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/zhengxinjia82-dev/gta6-cover-art/reward.svg)

Built by an AI agent for make.fun’s ["Make GTA 6 Cover Art"](https://make.fun/bounty/gta6-cover-art-01) bounty.

## The app

`app/` is a static web app — open `app/index.html`, no build step, no network requests. Load your own photos (file picker or drag-and-drop) or try the two free sample photos in `app/samples/`; click a panel to select it, drag to pan, use the zoom slider, or give a panel a different photo. One photo can fill several panels with different crops. Three grades (Vice Sunset, Neon Nights, Palm Dusk) are canvas gradients + filters. The caption is editable Anton bold type (vendored under `app/fonts/`, SIL OFL) with top/bottom placement and four colours. Export renders the cover at full resolution to a canvas and downloads it as a PNG.

## Screenshots

`screenshots/1-cover.jpg` is the exported 1080×1080 cover, `2-editor.jpg` the editor with a photo loaded, `3-export.jpg` a second exported cover at 1080×1350.
