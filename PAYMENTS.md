# SnapFit payments & monetization

Hosting stays **GitHub Pages** (static, $0). No backend required for MVP.

Unlock is **license-key only**. There is no “I paid — unlock” honor button.

---

## 1. Sell $2.99 lifetime unlock (required)

Create a free account on **Lemon Squeezy** or **Gumroad**.

1. Create a product: **SnapFit Lifetime Unlock** — price **$2.99** (one-time).
2. Deliver **license keys** after purchase:
   - Upload codes from **`KEYS.PRIVATE.md` on the operator machine only** (never commit this file; never put it in the public repo).
   - Gumroad: use license keys / unique codes feature, or email a key from the list.
   - Lemon Squeezy: use license keys / custom files / email delivery of a code.
3. Copy the product **checkout URL**.
4. Paste it into `config.js`:

```js
checkoutUrl: "https://your-store-link-here",
```

5. Commit and push to `main` so GitHub Pages redeploys.

Buyers pay → receive a key → paste it in SnapFit → `VALID_KEYS` validates → unlock (ads + caps + watermark off).

**Note:** Any older Gumroad “imagebuff” checkout URL is **retired** for this brand. Create a fresh SnapFit product (or rename the store listing) and point `checkoutUrl` at it. PayPal/Gumroad history can stay in operator notes; primary brand is SnapFit.

### When keys run low

1. Generate more `SF-LIFE-XXXX-XXXX` codes into **`KEYS.PRIVATE.md`** (local only).
2. Add the new codes to `VALID_KEYS` in `app.js`.
3. Upload the new codes to Gumroad / Lemon Squeezy.
4. Redeploy (push to `main`).

The first ~15 sale keys from `KEYS.PRIVATE.md` are seeded in `app.js` so early sales work once the store is live.

---

## 2. Google AdSense (free-tier revenue)

1. Create / apply for [Google AdSense](https://www.google.com/adsense/).
2. When approved, paste your publisher id into `config.js`:

```js
adsenseClient: "ca-pub-XXXXXXXXXXXXXXXX",
adSlots: { top: "SLOT", mid: "SLOT", download: "SLOT", footer: "SLOT" },
```

3. Redeploy. Until AdSense is approved, the site shows **loud placeholder ads** so free users feel the free tier immediately.
4. Unlocked users: all `[data-ad]` regions are hidden.

---

## 3. Why PayPal.me alone cannot verify payment

PayPal.me is a simple payment link. It does **not**:

- Call back to your static site
- Prove who paid
- Issue a unique license automatically

Anyone could click “I paid” without paying. That honor path is **removed**.

Optional: keep PayPal.me (`https://www.paypal.me/wesgreen77/2.99`) as a manual fallback note for yourself until Gumroad/LS is live — but the **Buy** button uses `config.checkoutUrl` only, and unlock still requires a key from `VALID_KEYS`.

---

## 4. Redeploy checklist

After any `config.js` or `app.js` key change:

```bash
git add -A && git commit -m "Update SnapFit config / keys" && git push origin main
```

**Never** `git add KEYS.PRIVATE.md` or `KEYS.md`. Both are gitignored.

Live site (GitHub Pages): `https://299nhs7sjg-netizen.github.io/snapfit/`

---

## Security note (MVP)

`VALID_KEYS` lives in `app.js` (client-side) — only the seeded batch, not the full stock.

- **Keys stock file:** `KEYS.PRIVATE.md` on the operator machine only. Never commit. Upload to Gumroad/LS from that file.
- **Public `KEYS.md`:** do not create it in the repo.
- **Rotation:** regenerate `KEYS.PRIVATE.md`, replace `VALID_KEYS`, redeploy. Old keys stop working immediately.
- For higher security later: signed tokens or a tiny paid key API — not required for MVP.
