# SnapFit

**Browser photo resize + compress for social apps.** Private, offline-capable static site. Price: **$2.99 lifetime unlock**.

Your photos never leave the device — all processing uses Canvas / browser APIs.

## Open locally

**Option A — double-click**

Open `index.html` in Chrome, Edge, Firefox, or Safari.

**Option B — local server (recommended if a browser blocks `file://`)**

```bash
cd /path/to/snapfit
python3 -m http.server 8765
```

Then visit: http://localhost:8765/

No build step. No Node. No paid APIs.

## Features

- Drag/drop or file picker (JPG, PNG, WebP, GIF → export JPG/WebP/PNG)
- Presets: Instagram post/portrait/story, X/Twitter post & header, LinkedIn, TikTok/Reels, Facebook, YouTube thumbnail
- Custom width/height + keep aspect ratio
- Quality slider (JPEG/WebP)
- Live preview + single or batch download
- Free tier limits + $2.99 lifetime unlock via license key (localStorage)

## Free vs paid

| | Free | Unlocked ($2.99 lifetime) |
|---|---|---|
| Long-side max | 1280px | Full resolution |
| Quality | Capped at 0.75 | Up to 1.0 |
| Watermark | Small “SnapFit” on export | None |
| Ads | Shown | Hidden |
| Offline | Yes | Yes |

## Unlock / license keys (MVP)

Keys are checked **client-side** against `VALID_KEYS` in `app.js`. Unlock persists in `localStorage` (`snapfit_unlocked_v1`) only when the stored value is a valid key. **No honor / “I paid” unlock.**

1. Sell on Gumroad / Lemon Squeezy at **$2.99** — see `PAYMENTS.md`.
2. Deliver a unique key from `KEYS.PRIVATE.md` (do not link that file from the site; never commit it).
3. Buyer pastes the key in the unlock modal. Free tier shows ads; unlock hides every `[data-ad]`.
4. Paste the store checkout URL into `config.js` → `checkoutUrl`, then redeploy.

Demo unlock is hidden unless you open the site with `?demo=1` (key: `SF-DEMO-UNLOCK-2026`).

When keys run low: add codes to `KEYS.PRIVATE.md` and `VALID_KEYS` in `app.js`, upload to the store, push to `main`.

To reset unlock while testing: DevTools → Application → Local Storage → delete `snapfit_unlocked_v1`.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell + ad regions |
| `config.js` | checkoutUrl + AdSense (operator edits) |
| `app.js` | Resize, compress, license unlock, ads |
| `styles.css` | UI + loud free-tier ads |
| `favicon.svg` | Icon |
| `KEYS.PRIVATE.md` | Private sale key pool (gitignored) |
| `PAYMENTS.md` | Gumroad / LS / AdSense setup |
| `BRAND.md` | Brand & positioning |
| `README.md` | This file |

## Live

GitHub Pages: https://299nhs7sjg-netizen.github.io/snapfit/

## License

Proprietary product for Wes Green / $0 digital business. Ship as a paid download or hosted static site.
