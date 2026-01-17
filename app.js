const SHOP = {
  name: "Menu",
};

const el = (id) => document.getElementById(id);

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/* ---------- Search helpers ---------- */
function getSearchQuery() {
  return (el("searchInput")?.value || "").trim().toLowerCase();
}

/* ---------- History helpers (Back gesture behavior) ---------- */
function currentAppState() {
  return history.state || { view: "home" };
}
function pushAppState(state) {
  history.pushState(state, "", "");
}

/* ---------- Global data ---------- */
let BRANDS = [];         // from data/brands.json
let ACTIVE_BRAND = null; // currently loaded brand file
let ALL_FLAVORS = [];    // global search index (built from all brand files)

/* ---------- Loaders ---------- */
async function loadBrandsIndex() {
  const res = await fetch("./data/brands.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load data/brands.json");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("brands.json must be an array []");
  BRANDS = data;
}

async function loadBrandFile(brandId) {
  const b = BRANDS.find((x) => x.id === brandId);
  if (!b) throw new Error(`Brand not found: ${brandId}`);

  const res = await fetch(b.file, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load brand file: ${b.file}`);

  const data = await res.json();
  if (!data || !Array.isArray(data.flavors)) {
    throw new Error(`Invalid brand file format: ${b.file}`);
  }

  // normalize
  ACTIVE_BRAND = {
    id: b.id,
    card: b,
    meta: data.brand || { name: b.name, puffs: b.puffs, priceText: b.priceText, dealText: b.dealText },
    flavors: data.flavors || []
  };
}

/* Build global search index by loading all brand files once */
async function buildGlobalSearchIndex() {
  const results = await Promise.all(
    BRANDS.map(async (b) => {
      try {
        const res = await fetch(b.file, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load ${b.file}`);
        const data = await res.json();
        const flavors = Array.isArray(data?.flavors) ? data.flavors : [];

        return flavors.map((f) => ({
          brandId: b.id,
          brandName: (data?.brand?.name || b.name || ""),
          flavor: f.flavor || "",
          price: f.price,
          image: f.image || "",
          tags: Array.isArray(f.tags) ? f.tags : [],
          soldOut: !!f.soldOut
        }));
      } catch (e) {
        console.warn(e);
        return [];
      }
    })
  );

  ALL_FLAVORS = results.flat();
}

/* ---------- Dropdown ---------- */
function renderBrandDropdown() {
  const select = el("brandSelect");
  if (!select) return;

  const opts = [
    `<option value="home">Home</option>`,
    ...BRANDS.map((b) => `<option value="${b.id}">${b.name}</option>`)
  ];

  select.innerHTML = opts.join("");
}

/* ---------- Home Brand Cards ---------- */
function renderHomeCards() {
  const wrap = el("homePromos");
  if (!wrap) return;

  // Sort brands
  const sorted = BRANDS.slice().sort((a, b) => {
    // 1) clearance (dealText includes “clearance” or “clear”)
    const aClear = (a.dealText || "").toLowerCase().includes("clear");
    const bClear = (b.dealText || "").toLowerCase().includes("clear");
    if (aClear && !bClear) return -1;
    if (!aClear && bClear) return 1;

    // 2) numeric price (parse b.priceText or fallback)
    const pa = parseFloat((a.priceText || "").replace(/[^0-9.]/g, "")) || 0;
    const pb = parseFloat((b.priceText || "").replace(/[^0-9.]/g, "")) || 0;
    return pa - pb;
  });

  wrap.innerHTML = sorted.map((b) => {
    const deal = (b.dealText || "").trim();
    const price = (b.priceText || "").trim();
    return `
      <article class="promo-card" data-brandid="${b.id}">
        <div class="promo-img-wrap">
          <img class="promo-img" src="${b.cardImage}" alt="${b.name}" loading="lazy"
               onerror="this.style.display='none'"/>
        </div>
        <div class="promo-title">${b.name}</div>
        <p class="promo-sub">${b.puffs || ""}</p>
        <div class="promo-price">
          ${deal ? `<span class="promo-deal">${deal}</span>` : ""}
          ${price ? `<span class="promo-base">${price}</span>` : ""}
        </div>
      </article>
    `;
  }).join("");

  wrap.querySelectorAll(".promo-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const brandId = card.dataset.brandid;
      el("brandSelect").value = brandId;
      pushAppState({ view: "brand", brandId });
      await showBrand(brandId, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}


function showHome(push = true) {
  el("homePromos").style.display = "";
  el("brandPanel")?.classList.add("hidden");

  // we are not using grid anymore; keep it hidden
  const grid = el("productGrid");
  if (grid) grid.style.display = "none";

  // NOTE: resultsCount is removed in your requested UI changes
  // if element exists, we won't touch it.

  if (push) pushAppState({ view: "home" });
}

/* ---------- Brand header + list ---------- */
function setBrandHeader() {
  const meta = ACTIVE_BRAND?.meta || {};
  const card = ACTIVE_BRAND?.card || {};

  el("brandTitle").textContent = meta.name || card.name || "Brand";
  el("brandPuffs").textContent = meta.puffs || card.puffs || "—";

  // show deal if present, else price
  const deal = (meta.dealText || card.dealText || "").trim();
  const priceText = (meta.priceText || card.priceText || "").trim();

  el("brandPrice").textContent = deal ? `${deal} • ${priceText || ""}`.trim() : (priceText || "—");
}

function sortFlavorsForUX(items) {
  const score = (f) => {
    const tags = Array.isArray(f.tags) ? f.tags.map(t => String(t).toLowerCase()) : [];
    if (tags.includes("new")) return 0;
    if (tags.includes("trending")) return 1;
    return 2;
  };

  return items.slice().sort((a, b) => {
    const aSold = !!a.soldOut;
    const bSold = !!b.soldOut;
    if (aSold !== bSold) return aSold ? 1 : -1;

    const aScore = score(a);
    const bScore = score(b);
    if (aScore !== bScore) return aScore - bScore;

    return (a.flavor || "").localeCompare(b.flavor || "");
  });
}

function buildTagHtml(tags, soldOut) {
  const safeTags = Array.isArray(tags) ? tags : [];
  const tagHtml = [
    ...safeTags.map((t) => {
      const tt = String(t).toLowerCase();
      const cls =
        tt === "new" ? "flavor-tag new" :
        tt === "trending" ? "flavor-tag trending" :
        tt === "soldout" ? "flavor-tag soldout" :
        "flavor-tag";
      return `<span class="${cls}">${tt.toUpperCase()}</span>`;
    }),
    soldOut ? `<span class="flavor-tag soldout">SOLD OUT</span>` : ""
  ].join("");

  return tagHtml;
}

/* Brand-only list render (filters within ACTIVE_BRAND) */
function renderFlavorList() {
  const list = el("flavorList");
  const q = getSearchQuery();

  let items = (ACTIVE_BRAND?.flavors || []).slice();

  if (q) {
    items = items.filter((p) => (p.flavor || "").toLowerCase().includes(q));
  }

  items = sortFlavorsForUX(items);

  if (!items.length) {
    list.innerHTML = `
      <div class="card">
        <h3>No matches</h3>
        <p class="desc">Try a different search term.</p>
      </div>
    `;
    return;
  }

  const brandNameForCaption = (ACTIVE_BRAND?.meta?.name || ACTIVE_BRAND?.card?.name || "");

  list.innerHTML = items.map((p) => {
    const img = p.image || "./images/placeholder.png";
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const soldOut = !!p.soldOut;

    const tagHtml = buildTagHtml(tags, soldOut);

    return `
      <div class="flavor-row" data-src="${img}" data-caption="${brandNameForCaption} — ${(p.flavor || "")}">
        <div class="flavor-thumb">
          <img src="${img}" alt="${p.flavor || ""}" loading="lazy"
               onerror="this.src='./images/placeholder.png'; this.onerror=null;" />
        </div>

        <div class="flavor-main">
          <div class="flavor-top">
            <div class="flavor-name">${p.flavor || ""}</div>
            <div class="flavor-price">${typeof p.price === "number" ? money(p.price) : (p.price || "")}</div>
          </div>
          <div class="flavor-bottom">
            <div class="flavor-tags">${tagHtml}</div>
            <div class="flavor-hint">Tap to view image</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".flavor-row").forEach((row) => {
    row.addEventListener("click", () => openImageModal(row.dataset.src, row.dataset.caption));
  });
}

/* Global search render (filters across ALL brands) */
function renderGlobalSearchResults() {
  const list = el("flavorList");
  const q = getSearchQuery();

  // if empty search => go back to home cards
  if (!q) {
    showHome(true);
    renderHomeCards();
    return;
  }

  // hide home, show list panel
  el("homePromos").style.display = "none";
  el("brandPanel")?.classList.remove("hidden");
  const grid = el("productGrid");
  if (grid) grid.style.display = "none";

  // header for search results
  el("brandTitle").textContent = "Search Results";
  el("brandPuffs").textContent = "All brands";
  el("brandPrice").textContent = "";

  // match flavor (and brand name as a bonus)
  let items = ALL_FLAVORS.filter((p) => {
    const flavor = (p.flavor || "").toLowerCase();
    const brand = (p.brandName || "").toLowerCase();
    return flavor.includes(q) || brand.includes(q);
  });

  items = sortFlavorsForUX(items);

  if (!items.length) {
    list.innerHTML = `
      <div class="card">
        <h3>No matches</h3>
        <p class="desc">Try a different search term.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items.map((p) => {
    const img = p.image || "./images/placeholder.png";
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const soldOut = !!p.soldOut;

    const tagHtml = buildTagHtml(tags, soldOut);
    const caption = `${p.brandName || ""} — ${p.flavor || ""}`;

    return `
      <div class="flavor-row" data-src="${img}" data-caption="${caption}">
        <div class="flavor-thumb">
          <img src="${img}" alt="${p.flavor || ""}" loading="lazy"
               onerror="this.src='./images/placeholder.png'; this.onerror=null;" />
        </div>

        <div class="flavor-main">
          <div class="flavor-top">
            <div class="flavor-name">${p.flavor || ""}</div>
            <div class="flavor-price">${typeof p.price === "number" ? money(p.price) : (p.price || "")}</div>
          </div>
          <div class="flavor-bottom">
            <div class="flavor-tags">
              ${tagHtml}
              <span class="flavor-tag">${p.brandName || ""}</span>
            </div>
            <div class="flavor-hint">Tap to view image</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".flavor-row").forEach((row) => {
    row.addEventListener("click", () => openImageModal(row.dataset.src, row.dataset.caption));
  });
}

/* ---------- Image Modal (with Back behavior) ---------- */
function openImageModal(src, caption) {
  el("imgModalImage").src = src || "./images/placeholder.png";
  el("imgModalCaption").textContent = caption || "";
  el("imgModal").classList.add("show");

  const brandId = el("brandSelect").value || "home";
  pushAppState({ view: "modal", brandId, src, caption });
}

function closeImageModalSmart() {
  const state = currentAppState();
  if (state.view === "modal") history.back();
  else el("imgModal").classList.remove("show");
}

function setupImageModal() {
  el("imgModalClose").onclick = closeImageModalSmart;

  el("imgModal").onclick = (e) => {
    if (e.target.id === "imgModal") closeImageModalSmart();
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el("imgModal").classList.contains("show")) {
      closeImageModalSmart();
    }
  });
}

/* ---------- View switching ---------- */
async function showBrand(brandId, skipPush = false) {
  // hide home
  el("homePromos").style.display = "none";

  // ensure correct history state
  if (!skipPush) pushAppState({ view: "brand", brandId });

  await loadBrandFile(brandId);

  // show brand list panel
  el("brandPanel").classList.remove("hidden");
  const grid = el("productGrid");
  if (grid) grid.style.display = "none";

  setBrandHeader();
  renderFlavorList();
}

function setupBackBehavior() {
  window.addEventListener("popstate", async () => {
    const state = currentAppState();

    // Close modal if leaving modal
    if (el("imgModal")?.classList.contains("show") && state.view !== "modal") {
      el("imgModal").classList.remove("show");
    }

    if (state.view === "modal") {
      // load underlying view
      el("brandSelect").value = state.brandId || "home";

      if (state.brandId && state.brandId !== "home") {
        await showBrand(state.brandId, true);
      } else {
        showHome(false);
        renderHomeCards();
        // if there was a search active, re-render results
        if (getSearchQuery()) renderGlobalSearchResults();
      }

      // reopen modal
      el("imgModalImage").src = state.src || "./images/placeholder.png";
      el("imgModalCaption").textContent = state.caption || "";
      el("imgModal").classList.add("show");
      return;
    }

    if (state.view === "brand") {
      el("brandSelect").value = state.brandId || "home";
      await showBrand(state.brandId, true);
      return;
    }

    // default home
    el("brandSelect").value = "home";
    showHome(false);
    renderHomeCards();
    if (getSearchQuery()) renderGlobalSearchResults();
  });
}

/* ---------- Age gate + shop info ---------- */
function setupAgeGate() {
  const gate = el("ageGate");
  const key = "stardust_menu_age_ok";

  const show = () => {
    gate.classList.add("show");
    gate.setAttribute("aria-hidden", "false");
  };
  const hide = () => {
    gate.classList.remove("show");
    gate.setAttribute("aria-hidden", "true");
  };

  if (localStorage.getItem(key) !== "yes") show();

  el("ageYes").addEventListener("click", () => {
    localStorage.setItem(key, "yes");
    hide();
  });

  el("ageNo").addEventListener("click", () => {
    window.location.href = "https://www.google.com";
  });
}

function setupShopInfo() {
  // If you removed Call/Directions + footer store info as requested,
  // you can keep only the shop name.
  if (el("shopName")) el("shopName").textContent = SHOP.name;

  // These elements may be removed from HTML; guard them.
  if (el("callBtn")) el("callBtn").href = `tel:${SHOP.phone}`;
  if (el("mapBtn")) el("mapBtn").href = SHOP.mapsLink;

  if (el("hoursText")) el("hoursText").textContent = SHOP.hours;
  if (el("addressText")) el("addressText").textContent = SHOP.address;
  if (el("phoneText")) el("phoneText").textContent = SHOP.phoneDisplay;
  if (el("mapsText")) el("mapsText").href = SHOP.mapsLink;
}

/* ---------- Init ---------- */
async function init() {
  setupShopInfo();
  setupAgeGate();
  setupImageModal();
  setupBackBehavior();

  await loadBrandsIndex();
  renderBrandDropdown();

  // Build global search index (enables Home search across all brands)
  await buildGlobalSearchIndex();

  // events
  el("brandSelect").onchange = async () => {
    const val = el("brandSelect").value;

    // clear search on navigation
    el("searchInput").value = "";

    if (val === "home") {
      showHome(true);
      renderHomeCards();
      return;
    }

    await showBrand(val, false);
  };

  el("searchInput").oninput = async () => {
    const current = el("brandSelect").value;

    // HOME: search across all brands
    if (current === "home") {
      renderGlobalSearchResults();
      return;
    }

    // BRAND: only that brand flavors
    renderFlavorList();
  };

  // start Home
  el("brandSelect").value = "home";
  history.replaceState({ view: "home" }, "", "");
  showHome(false);
  renderHomeCards();
}

init().catch((err) => {
  console.error(err);
  const grid = el("productGrid");
  if (grid) {
    grid.style.display = "";
    grid.innerHTML = `
      <div class="card">
        <h3>Menu failed to load</h3>
        <p class="desc">
          Check <b>data/brands.json</b> and brand file paths in GitHub Pages.
        </p>
      </div>
    `;
  }
});
