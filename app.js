/**
 * SnapFit — client-side resize & compress for social apps
 * Unlock ONLY via valid license key (no honor / "I paid" path).
 * VALID_KEYS: seed from KEYS.PRIVATE.md (operator machine only; never commit).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "snapfit_unlocked_v1";
  const SOURCE_KEY = "snapfit_unlock_src_v1";
  const DEMO_KEY = "SF-DEMO-UNLOCK-2026";
  /* Seed sale keys from KEYS.PRIVATE.md + demo (?demo=1 only). */
  const VALID_KEYS = new Set([
    "SF-DEMO-UNLOCK-2026",
    "SF-LIFE-1LXG-HT97",
    "SF-LIFE-QAOM-PJBT",
    "SF-LIFE-X6NE-5BYK",
    "SF-LIFE-ER9U-LXME",
    "SF-LIFE-DAIO-MC53",
    "SF-LIFE-POFV-75E4",
    "SF-LIFE-DXD5-8T0O",
    "SF-LIFE-OJ0D-EYF8",
    "SF-LIFE-NS3O-CJUG",
    "SF-LIFE-16FX-S572",
    "SF-LIFE-WN9B-NH2U",
    "SF-LIFE-BFNA-S5GT",
    "SF-LIFE-K8JN-PJI5",
    "SF-LIFE-ANU1-BJL2",
    "SF-LIFE-WJIU-R8EG"
  ]);

  const FREE = { maxLongSide: 1280, maxQuality: 0.75, watermark: true };

  const PRESETS = {
    original: null,
    "ig-post": { w: 1080, h: 1080 },
    "ig-portrait": { w: 1080, h: 1350 },
    "ig-story": { w: 1080, h: 1920 },
    "x-post": { w: 1600, h: 900 },
    "x-header": { w: 1500, h: 500 },
    linkedin: { w: 1200, h: 627 },
    tiktok: { w: 1080, h: 1920 },
    facebook: { w: 1200, h: 630 },
    "yt-thumb": { w: 1280, h: 720 },
    custom: "custom",
  };

  const CFG = (typeof window !== "undefined" && window.SNAPFIT_CONFIG) || {};
  const PLACEHOLDER_ADS = {
    top: "<strong>Sponsored</strong> — Resize faster. Unlock SnapFit lifetime for $2.99 → no watermark, full resolution.",
    mid: "<strong>FakeSponsor Pro</strong> — Cloud photo tools that upload your files. Or stay private with SnapFit Unlock ($2.99).",
    download: "<strong>Resize faster — Unlock SnapFit $2.99</strong><br />No caps. No watermark. One license key after checkout.",
    sidebar: "<strong>PixelPush Ads</strong><br />Your free preview includes ads. Unlock to hide every ad forever — $2.99 lifetime.",
    footer: "<strong>Sponsored · SnapFit Unlock</strong> — Creators: kill ads + watermark with one $2.99 license key from the store.",
    modal: "Tired of ads? Buy once — unlock hides every ad on this page.",
  };

  let items = [];
  let activeIndex = -1;
  let unlocked = false;
  const $ = (id) => document.getElementById(id);

  const els = {
    dropZone: $("dropZone"), dropEmpty: $("dropEmpty"), fileInput: $("fileInput"),
    pickBtn: $("pickBtn"), thumbs: $("thumbs"), preset: $("preset"),
    customSize: $("customSize"), width: $("width"), height: $("height"),
    keepAspect: $("keepAspect"), format: $("format"), quality: $("quality"),
    qualityLabel: $("qualityLabel"), qualityField: $("qualityField"),
    freeNote: $("freeNote"), freeDimLabel: $("freeDimLabel"), freeQLabel: $("freeQLabel"),
    downloadBtn: $("downloadBtn"), downloadAllBtn: $("downloadAllBtn"), clearBtn: $("clearBtn"),
    preview: $("preview"), previewMeta: $("previewMeta"), unlockBtn: $("unlockBtn"),
    unlockLink: $("unlockLink"), footerUnlock: $("footerUnlock"), unlockBadge: $("unlockBadge"),
    unlockModal: $("unlockModal"), modalClose: $("modalClose"), licenseKey: $("licenseKey"),
    applyKeyBtn: $("applyKeyBtn"), keyField: $("keyField"),
    demoUnlockBtn: $("demoUnlockBtn"), unlockError: $("unlockError"),
    checkoutBuyBtn: $("checkoutBuyBtn"), checkoutHint: $("checkoutHint"),
  };

  function normalizeKey(raw) {
    return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  /** Unlock if seed VALID_KEYS or a previously Gumroad-verified key (never bare "1"). */
  function isUnlocked() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) return false;
      const k = normalizeKey(v);
      if (!k || k === "1") return false;
      if (VALID_KEYS.has(k)) return true;
      return localStorage.getItem(SOURCE_KEY) === "gumroad";
    } catch (e) {
      return false;
    }
  }

  function setUnlocked(key, viaGumroad) {
    const k = normalizeKey(key);
    if (!k || k === "1") return false;
    if (!viaGumroad && !VALID_KEYS.has(k)) return false;
    unlocked = true;
    try {
      localStorage.setItem(STORAGE_KEY, k);
      localStorage.setItem(SOURCE_KEY, viaGumroad ? "gumroad" : "seed");
    } catch (e) {}
    refreshUnlockUI();
    scheduleRender();
    return true;
  }

  async function verifyGumroadLicense(rawKey) {
    const productId = String(CFG.productId || CFG.product_id || "").trim();
    const permalink = String(CFG.productPermalink || CFG.product_permalink || "").trim();
    if (!productId && !permalink) {
      return { ok: false, message: "Product not configured for license verify." };
    }
    const body = new URLSearchParams();
    if (productId) body.set("product_id", productId);
    else body.set("product_permalink", permalink);
    body.set("license_key", String(rawKey || "").trim());
    const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (data && data.success === true) {
      const p = data.purchase || {};
      if (p.refunded || p.chargebacked || p.disputed) {
        return { ok: false, message: "This license is no longer valid." };
      }
      return { ok: true, data: data };
    }
    return {
      ok: false,
      message: (data && (data.message || data.error)) || "Invalid key. Buy from the store to receive a license key, then paste it here."
    };
  }

  function hideAllAds() {
    document.querySelectorAll("[data-ad]").forEach(function (el) {
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
    });
  }

  function showAllAds() {
    document.querySelectorAll("[data-ad]").forEach(function (el) {
      el.hidden = false;
      el.removeAttribute("aria-hidden");
    });
  }

  function renderAds() {
    const client = (CFG.adsenseClient || "").trim();
    const slots = CFG.adSlots || {};
    document.querySelectorAll("[data-ad]").forEach(function (region) {
      const kind = region.getAttribute("data-ad") || "";
      const slotKey = region.getAttribute("data-ad-slot") || kind;
      const slotId = (slots[slotKey] || "").trim();
      const creative = region.querySelector("[data-ad-creative]");
      if (client && slotId && creative) {
        creative.innerHTML = "";
        const ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.display = "block";
        ins.setAttribute("data-ad-client", client);
        ins.setAttribute("data-ad-slot", slotId);
        ins.setAttribute("data-ad-format", "auto");
        ins.setAttribute("data-full-width-responsive", "true");
        creative.appendChild(ins);
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {}
      } else if (creative && !creative.innerHTML.trim()) {
        creative.innerHTML = PLACEHOLDER_ADS[kind] || PLACEHOLDER_ADS.top;
      }
    });
    if (client && !document.querySelector('script[data-snapfit-adsense]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(client);
      s.crossOrigin = "anonymous";
      s.setAttribute("data-snapfit-adsense", "1");
      document.head.appendChild(s);
    }
  }

  function wireCheckoutButton() {
    const btn = els.checkoutBuyBtn;
    const hint = els.checkoutHint;
    if (!btn) return;
    const url = (CFG.checkoutUrl || "").trim();
    if (url) {
      btn.href = url;
      btn.removeAttribute("aria-disabled");
      btn.classList.remove("is-disabled");
      if (hint) {
        hint.textContent = "After checkout, your store email includes a license key. Paste it below.";
      }
      btn.onclick = null;
    } else {
      btn.href = "#";
      btn.setAttribute("aria-disabled", "true");
      btn.classList.add("is-disabled");
      if (hint) {
        hint.textContent = "Checkout URL not set — paste your Gumroad or Lemon Squeezy product URL into config.js → checkoutUrl, then redeploy.";
      }
      btn.onclick = function (e) {
        e.preventDefault();
        if (els.unlockError) {
          els.unlockError.textContent = "Checkout URL not set. Create a Gumroad or Lemon Squeezy product ($2.99) and paste the URL into config.js.";
          els.unlockError.hidden = false;
        }
      };
    }
  }

  function refreshUnlockUI() {
    unlocked = isUnlocked();
    if (unlocked) {
      els.unlockBadge.textContent = "Unlocked";
      els.unlockBadge.className = "badge pro";
      els.unlockBtn.textContent = "Unlocked ✓";
      els.unlockBtn.disabled = true;
      els.freeNote.hidden = true;
      els.quality.max = "1";
      hideAllAds();
    } else {
      els.unlockBadge.textContent = "Free";
      els.unlockBadge.className = "badge free";
      els.unlockBtn.textContent = "Unlock $2.99";
      els.unlockBtn.disabled = false;
      els.freeNote.hidden = false;
      els.freeDimLabel.textContent = String(FREE.maxLongSide);
      els.freeQLabel.textContent = String(FREE.maxQuality);
      if (parseFloat(els.quality.value) > FREE.maxQuality) {
        els.quality.value = String(FREE.maxQuality);
      }
      showAllAds();
    }
    els.qualityLabel.textContent = Number(els.quality.value).toFixed(2);
    updateQualityVisibility();
  }

  function updateQualityVisibility() {
    const fmt = els.format.value;
    els.qualityField.style.opacity = fmt === "image/png" ? "0.45" : "1";
    els.quality.disabled = fmt === "image/png";
  }

  function openModal() {
    els.unlockError.hidden = true;
    if (els.licenseKey) els.licenseKey.value = "";
    wireCheckoutButton();
    /* Demo unlock hidden in production; enable only with ?demo=1 */
    if (els.demoUnlockBtn) {
      const showDemo = /[?&]demo=1(?:&|$)/.test(location.search);
      els.demoUnlockBtn.hidden = !showDemo;
    }
    els.unlockModal.hidden = false;
    if (els.licenseKey) els.licenseKey.focus();
  }

  function closeModal() {
    els.unlockModal.hidden = true;
  }

  async function tryUnlock(key) {
    const raw = String(key || "").trim();
    const k = normalizeKey(raw);
    if (!k) {
      els.unlockError.textContent = "Paste your license key from the store receipt, then tap Apply.";
      els.unlockError.hidden = false;
      return false;
    }
    if (VALID_KEYS.has(k)) {
      setUnlocked(k, false);
      closeModal();
      return true;
    }
    if (els.applyKeyBtn) els.applyKeyBtn.disabled = true;
    els.unlockError.textContent = "Checking license…";
    els.unlockError.hidden = false;
    try {
      const result = await verifyGumroadLicense(raw);
      if (result.ok) {
        setUnlocked(k, true);
        closeModal();
        return true;
      }
      els.unlockError.textContent = result.message || "Invalid key. Buy from the store to receive a license key, then paste it here.";
      els.unlockError.hidden = false;
      return false;
    } catch (e) {
      els.unlockError.textContent = "Could not verify license. Check your connection and try again.";
      els.unlockError.hidden = false;
      return false;
    } finally {
      if (els.applyKeyBtn) els.applyKeyBtn.disabled = false;
    }
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("fail"));
      };
      img.src = url;
    });
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(function (f) {
      return /^image\/(jpeg|png|webp|gif)$/i.test(f.type);
    });
    if (!files.length) return;
    for (const file of files) {
      try {
        items.push({ file: file, img: await loadImage(file), name: file.name });
      } catch (e) {}
    }
    if (!items.length) return;
    activeIndex = items.length - 1;
    renderThumbs();
    els.dropEmpty.hidden = true;
    els.thumbs.hidden = false;
    els.downloadBtn.disabled = false;
    els.downloadAllBtn.disabled = items.length < 2;
    els.clearBtn.disabled = false;
    scheduleRender();
  }

  function renderThumbs() {
    els.thumbs.innerHTML = "";
    items.forEach(function (item, i) {
      const div = document.createElement("button");
      div.type = "button";
      div.className = "thumb" + (i === activeIndex ? " active" : "");
      div.title = item.name;
      const img = document.createElement("img");
      img.src = item.img.src;
      img.alt = item.name;
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = item.name;
      div.appendChild(img);
      div.appendChild(name);
      div.addEventListener("click", function () {
        activeIndex = i;
        renderThumbs();
        scheduleRender();
      });
      els.thumbs.appendChild(div);
    });
  }

  function getTargetSize(srcW, srcH) {
    const key = els.preset.value;
    var boxW, boxH;
    if (key === "original") {
      boxW = srcW;
      boxH = srcH;
    } else if (key === "custom") {
      boxW = Math.max(1, parseInt(els.width.value, 10) || srcW);
      boxH = Math.max(1, parseInt(els.height.value, 10) || srcH);
    } else {
      boxW = PRESETS[key].w;
      boxH = PRESETS[key].h;
    }
    if (els.keepAspect.checked) {
      const fit = Math.min(boxW / srcW, boxH / srcH);
      return {
        w: Math.max(1, Math.round(srcW * fit)),
        h: Math.max(1, Math.round(srcH * fit)),
        boxW: boxW,
        boxH: boxH,
      };
    }
    return { w: boxW, h: boxH, boxW: boxW, boxH: boxH };
  }

  function applyFreeCaps(w, h, quality) {
    if (unlocked) return { w: w, h: h, quality: quality, capped: false };
    var cw = w,
      ch = h;
    const long = Math.max(cw, ch);
    if (long > FREE.maxLongSide) {
      const s = FREE.maxLongSide / long;
      cw = Math.max(1, Math.round(cw * s));
      ch = Math.max(1, Math.round(ch * s));
    }
    return { w: cw, h: ch, quality: Math.min(quality, FREE.maxQuality), capped: true };
  }

  function drawWatermark(ctx, w, h) {
    if (unlocked || !FREE.watermark) return;
    const text = "SnapFit";
    const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.045));
    ctx.save();
    ctx.font = "700 " + fontSize + "px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = Math.max(1, fontSize / 12);
    const pad = fontSize * 0.6;
    const metrics = ctx.measureText(text);
    const x = w - metrics.width - pad,
      y = h - pad;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function processToCanvas(img) {
    const size = getTargetSize(img.naturalWidth, img.naturalHeight);
    const capped = applyFreeCaps(size.w, size.h, parseFloat(els.quality.value) || 0.85);
    const canvas = document.createElement("canvas");
    canvas.width = capped.w;
    canvas.height = capped.h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (els.format.value === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, capped.w, capped.h);
    }
    ctx.drawImage(img, 0, 0, capped.w, capped.h);
    drawWatermark(ctx, capped.w, capped.h);
    return { canvas: canvas, quality: capped.quality, w: capped.w, h: capped.h };
  }

  function canvasToBlob(canvas, mime, quality) {
    return new Promise(function (resolve) {
      if (mime === "image/png") canvas.toBlob(function (b) { resolve(b); }, mime);
      else canvas.toBlob(function (b) { resolve(b); }, mime, quality);
    });
  }

  function extFor(mime) {
    return mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";
  }
  function baseName(name) {
    return name.replace(/\.[^.]+$/, "") || "image";
  }

  var renderTimer = null;
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderPreview, 40);
  }

  async function renderPreview() {
    if (activeIndex < 0 || !items[activeIndex]) {
      els.preview.width = 400;
      els.preview.height = 300;
      els.preview.getContext("2d").clearRect(0, 0, 400, 300);
      els.previewMeta.textContent = "No image selected";
      return;
    }
    const item = items[activeIndex];
    const result = processToCanvas(item.img);
    const maxDisp = 480;
    const scale = Math.min(1, maxDisp / Math.max(result.w, result.h));
    els.preview.width = Math.round(result.w * scale);
    els.preview.height = Math.round(result.h * scale);
    els.preview.getContext("2d").drawImage(result.canvas, 0, 0, els.preview.width, els.preview.height);
    const blob = await canvasToBlob(result.canvas, els.format.value, result.quality);
    const kb = blob ? (blob.size / 1024).toFixed(1) : "?";
    const freeTag = unlocked ? "" : " · free limits applied";
    els.previewMeta.textContent =
      item.name +
      " · " +
      item.img.naturalWidth +
      "×" +
      item.img.naturalHeight +
      " → " +
      result.w +
      "×" +
      result.h +
      " · ~" +
      kb +
      " KB · q" +
      result.quality.toFixed(2) +
      freeTag;
  }

  async function downloadOne(index) {
    const item = items[index];
    if (!item) return;
    const result = processToCanvas(item.img);
    const mime = els.format.value;
    const blob = await canvasToBlob(result.canvas, mime, result.quality);
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = baseName(item.name) + "_" + result.w + "x" + result.h + "." + extFor(mime);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 2000);
  }

  async function downloadAll() {
    for (var i = 0; i < items.length; i++) {
      await downloadOne(i);
      await new Promise(function (r) {
        setTimeout(r, 200);
      });
    }
  }

  function clearAll() {
    items = [];
    activeIndex = -1;
    els.thumbs.innerHTML = "";
    els.thumbs.hidden = true;
    els.dropEmpty.hidden = false;
    els.downloadBtn.disabled = true;
    els.downloadAllBtn.disabled = true;
    els.clearBtn.disabled = true;
    scheduleRender();
  }

  els.pickBtn.addEventListener("click", function () {
    els.fileInput.click();
  });
  els.fileInput.addEventListener("change", function () {
    addFiles(els.fileInput.files);
    els.fileInput.value = "";
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    els.dropZone.addEventListener(ev, function (e) {
      e.preventDefault();
      els.dropZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    els.dropZone.addEventListener(ev, function (e) {
      e.preventDefault();
      els.dropZone.classList.remove("dragover");
    });
  });
  els.dropZone.addEventListener("drop", function (e) {
    addFiles(e.dataTransfer.files);
  });
  els.preset.addEventListener("change", function () {
    els.customSize.hidden = els.preset.value !== "custom";
    scheduleRender();
  });
  ["width", "height", "keepAspect", "format", "quality"].forEach(function (id) {
    els[id].addEventListener("input", function () {
      if (id === "quality") els.qualityLabel.textContent = Number(els.quality.value).toFixed(2);
      if (id === "format") updateQualityVisibility();
      scheduleRender();
    });
  });
  els.downloadBtn.addEventListener("click", function () {
    downloadOne(activeIndex);
  });
  els.downloadAllBtn.addEventListener("click", downloadAll);
  els.clearBtn.addEventListener("click", clearAll);
  els.unlockBtn.addEventListener("click", openModal);
  els.unlockLink.addEventListener("click", openModal);
  els.footerUnlock.addEventListener("click", openModal);
  els.modalClose.addEventListener("click", closeModal);
  els.unlockModal.addEventListener("click", function (e) {
    if (e.target === els.unlockModal) closeModal();
  });
  els.applyKeyBtn.addEventListener("click", function () {
    tryUnlock(els.licenseKey && els.licenseKey.value);
  });
  if (els.demoUnlockBtn) {
    els.demoUnlockBtn.addEventListener("click", function () {
      tryUnlock(DEMO_KEY);
    });
  }
  els.licenseKey.addEventListener("keydown", function (e) {
    if (e.key === "Enter") tryUnlock(els.licenseKey.value);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.unlockModal.hidden) closeModal();
  });

  /* Clear legacy honor unlock ("1") only — keep seed + Gumroad-verified keys */
  try {
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (legacy === "1") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SOURCE_KEY);
    }
  } catch (e) {}

  els.freeDimLabel.textContent = String(FREE.maxLongSide);
  els.freeQLabel.textContent = String(FREE.maxQuality);
  wireCheckoutButton();
  renderAds();
  refreshUnlockUI();
  scheduleRender();
})();
