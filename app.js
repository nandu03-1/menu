// =========================
// Stardust Smoke Shop Menu
// Home = Brand Cards
// Brand page = List (thumb on left) + Fullscreen modal
// Separate file per brand (data/brands.json + data/brands/*.json)
// =========================

const SHOP = {
  name: "Stardust Smoke Shop",
  phone: "+19088295361",
  phoneDisplay: "(908) 829-5361",
  address: "626 US-206 Unit-4, Hillsborough Township, NJ 08844",
  hours: "Mon–Sun: 8 AM – 12 AM",
  mapsLink:
    "https://www.google.com/maps/place/Stardust+Smoke+Shop+%26+convenience+store+(premium+cigar+shop)/@40.5001418,-74.6500179,17z"
};

const el = (id) => document.getElementById(id);

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/* ---------- History helpers (Back gesture behavior) ---------- */
function currentAppState() {
  return history.state || { view: "home" };
}
function pushAppState(state) {
  history.pushState(state, "", "");
}

/* ---------- Global data ---------- */
let BRANDS = [];        // from data/brands.json
let ACTIVE_BRAND = null; // currently loaded brand file

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

  wrap.innerHTML = BRANDS.map((b) => {
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

  el("resultsCount").textContent = "Select a brand";

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

    // lower = higher priority
    if (tags.includes("new")) return 0;
    if (tags.includes("trending")) return 1;
    return 2;
  };

  return items.slice().sort((a, b) => {
    // sold out always bottom
    const aSold = !!a.soldOut;
    const bSold = !!b.soldOut;
    if (aSold !== bSold) return aSold ? 1 : -1;

    // NEW / TRENDING priority
    const aScore = score(a);
    const bScore = score(b);
    if (aScore !== bScore) return aScore - bScore;

    // alphabet
    return (a.flavor || "").localeCompare(b.flavor || "");
  });
}


function renderFlavorList() {
  const list = el("flavorList");
  const q = (el("searchInput")?.value || "").trim().toLowerCase();

  let items = (ACTIVE_BRAND?.flavors || []).slice();

  if (q) {
    items = items.filter((p) => (p.flavor || "").toLowerCase().includes(q));
  }

  items = sortFlavorsForUX(items);

  el("resultsCount").textContent = `${items.length} flavor${items.length === 1 ? "" : "s"}`;

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

    const tagHtml = [
  ...tags.map((t) => {
    const tt = String(t).toLowerCase();
    const cls = tt === "new" ? "flavor-tag new" : (tt === "trending" ? "flavor-tag trending" : "flavor-tag");
    return `<span class="${cls}">${tt.toUpperCase()}</span>`;
  }),
  soldOut ? `<span class="flavor-tag soldout">SOLD OUT</span>` : ""
].join("");


    return `
      <div class="flavor-row" data-src="${img}" data-caption="${(ACTIVE_BRAND.meta.name || "")} — ${(p.flavor || "")}">
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
      // load underlying brand
      el("brandSelect").value = state.brandId || "home";
      if (state.brandId && state.brandId !== "home") {
        await showBrand(state.brandId, true);
      } else {
        showHome(false);
        renderHomeCards();
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
  el("shopName").textContent = SHOP.name;
  el("callBtn").href = `tel:${SHOP.phone}`;
  el("mapBtn").href = SHOP.mapsLink;

  el("hoursText").textContent = SHOP.hours;
  el("addressText").textContent = SHOP.address;
  el("phoneText").textContent = SHOP.phoneDisplay;
  el("mapsText").href = SHOP.mapsLink;
}

/* ---------- Init ---------- */
async function init() {
  setupShopInfo();
  setupAgeGate();
  setupImageModal();
  setupBackBehavior();

  await loadBrandsIndex();
  renderBrandDropdown();

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

  el("searchInput").oninput = () => {
    // just re-render list for current brand
    if (el("brandSelect").value !== "home") renderFlavorList();
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
