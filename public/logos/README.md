# Custom Channel Logos Directory

You can place your high-quality channel logo images here (e.g. `LaLigaTV.png`, `T_Sports.png`, `Star_Sports_1.png`).

### How it works:
1. If an image named `{Channel_Slug}.png` or `{Channel_Slug}.jpg` exists in this `public/logos/` folder, it will be automatically served at `https://ireentvsportspremium.pages.dev/logos/{Channel_Slug}.png`.
2. The M3U playlist generator will automatically inject this logo into `playlist.m3u` (`tvg-logo="https://ireentvsportspremium.pages.dev/logos/..."`).
3. You can also define direct URLs in `custom_logos.json`.
