// =========================
// Stardust Smoke Shop Menu
// Home Promos + Hybrid Grid/List UX + Back gesture routing
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

/* 🔥 Home promo cards (edit these anytime) */
const HOME_PROMOS = [
  {
    title: "Geek Bar 15K",
    sub: "$25",
    price: "2 for $40",
    image: "./images/promos/geek15k.jpg",
    brand: "Geek Bar Pulse 15K"
  },
  {
    title: "GeekBar Pulse X 25k",
    sub: "$30",
    price: "2 for $50",
    image: "./images/promos/geek25k.jpg",
    brand: "Geek Bar Pulse X 25K"
  }
];

/* 🧠 Brands that use LIST view */
const BRAND_META = {
  "Geek Bar Pulse 15K": { view: "list", puffs: "15,000 puffs", price: 25 },
  // "Geek Bar Pulse X 25K": { view: "list", puffs: "25,000 puffs", price: 35 },
  "Lava Plus": { view: "list", puffs: "2600 puffs", price: 10 }
};

const el = (id) => document.getElementById(id);

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

let FLAVORS = [];

/* ---------- History helpers (Back gesture behavior) ---------- */
function currentAppState() {
  return history.state || { view: "home" };
}
function pushAppState(state) {
  history.pushState(state, "", "");
}

/* ---------- Load menu ---------- */
async function loadMenu() {
  const res = await fetch("./data/menu.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load menu.json");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("menu.json must be an array []");
  FLAVORS = data;
}

/* ---------- Dropdown ---------- */
function uniqueBrands(items) {
  const set = new Set(items.map((p) => p.brand).filter(Boolean));
  return ["home", "all", ...Array.from(set).sort()];
}

function renderBrandDropdown(brands) {
  el("brandSelect").innerHTML = brands
    .map((b) =>
      b === "home"
        ? `<option value="home">Home</option>`
        : `<option value="${b}">${b === "all" ? "All brands" : b}</option>`
    )
    .join("");
}

/* ---------- Home Promos ---------- */
function renderHomePromos() {
  const wrap = el("homePromos");
  if (!wrap) return;

  wrap.innerHTML = HOME_PROMOS.map(
    (p) => `
    <article class="promo-card" data-brand="${p.brand}">
      <div class="promo-img-wrap">
        <img class="promo-img" src="${p.image}" alt="${p.title}" loading="lazy"
             onerror="this.style.display='none'"/>
      </div>
      <div class="promo-title">${p.title}</div>
      <p class="promo-sub">${p.sub}</p>
      ${p.price ? `<div class="promo-price">${p.price}</div>` : ""}
    </article>
  `
  ).join("");

  wrap.querySelectorAll(".promo-card").forEach((card) => {
    card.addEventListener("click", () => {
      const targetBrand = card.dataset.brand || "all";
      el("brandSelect").value = targetBrand;

      // push brand state so Back goes to Home
      pushAppState({ view: "brand", brand: targetBrand });

      routeView(true); // true = don't push again (we just pushed)
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function showHome(push = true) {
  const home = el("homePromos");
  if (home) home.style.display = "";
  el("productGrid").style.display = "none";
  el("brandPanel")?.classList.add("hidden");
  el("resultsCount").textContent = "Choose a category";

  if (push) pushAppState({ view: "home" });
}

/* ---------- Grid View ---------- */
function applyFilters(items) {
  const q = (el("searchInput")?.value || "").trim().toLowerCase();
  const brand = el("brandSelect").value;

  let out = items;

  if (brand !== "all" && brand !== "home") out = out.filter((p) => p.brand === brand);
  if (q) out = out.filter((p) => (p.flavor || "").toLowerCase().includes(q));

  // Optional: keep your sort dropdown working if you want later.
  // (Right now, your sortSelect changes still trigger routeView; this is fine.)

  return out;
}

function renderGrid(items) {
  const grid = el("productGrid");

  if (!items.length) {
    grid.innerHTML = `
      <div class="card">
        <h3>No matches</h3>
        <p class="desc">Try a different brand or search term.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items
    .map((p) => {
      const src = p.image || "./images/placeholder.png";
      const caption = `${p.brand || ""} — ${p.flavor || ""}`;
      return `
        <article class="card">
          <div class="product-img-wrap">
            <img class="product-img"
              src="${src}"
              alt="${p.flavor || ""}"
              data-full="${src}"
              data-caption="${caption.replaceAll('"', "&quot;")}"
              loading="lazy"
              onerror="this.src='./images/placeholder.png'; this.onerror=null;" />
          </div>
          <h3>${p.flavor || ""}</h3>
          <div class="meta"><span class="badge">${p.brand || ""}</span></div>
          <div class="price">${typeof p.price === "number" ? money(p.price) : (p.price || "—")}</div>
        </article>
      `;
    })
    .join("");
}

/* ---------- List View ---------- */
function setBrandHeader(name) {
  const meta = BRAND_META[name] || {};
  el("brandTitle").textContent = name || "Brand";
  el("brandPuffs").textContent = meta.puffs || "—";

  if (typeof meta.price === "number") el("brandPrice").textContent = money(meta.price);
  else if (meta.price) el("brandPrice").textContent = meta.price;
  else el("brandPrice").textContent = "—";
}

function renderFlavorList(brand) {
  const list = el("flavorList");
  const q = (el("searchInput")?.value || "").trim().toLowerCase();

  let items = FLAVORS.filter((p) => p.brand === brand);
  if (q) items = items.filter((p) => (p.flavor || "").toLowerCase().includes(q));

  // nice list sort
  items = items.slice().sort((a, b) => (a.flavor || "").localeCompare(b.flavor || ""));

  el("resultsCount").textContent = `${items.length} items`;

  if (!items.length) {
    list.innerHTML = `
      <div class="card">
        <h3>No matches</h3>
        <p class="desc">Try a different search term.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map((p) => {
      const src = p.image || "./images/placeholder.png";
      const caption = `${p.brand || ""} — ${p.flavor || ""}`;
      return `
        <div class="flavor-item"
          data-src="${src}"
          data-caption="${caption.replaceAll('"', "&quot;")}">
          <div class="flavor-name">${p.flavor || ""}</div>
          <div class="flavor-hint">Tap to view</div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll(".flavor-item").forEach((row) => {
    row.addEventListener("click", () => {
      openImageModal(row.dataset.src, row.dataset.caption);
    });
  });
}

/* ---------- Image Modal (with Back behavior) ---------- */
function openImageModal(src, caption) {
  const modal = el("imgModal");
  el("imgModalImage").src = src || "./images/placeholder.png";
  el("imgModalCaption").textContent = caption || "";
  modal.classList.add("show");

  // push modal state so Back closes it first
  const brand = el("brandSelect")?.value || "all";
  pushAppState({ view: "modal", brand, src, caption });
}

function closeImageModalSmart() {
  const state = currentAppState();
  // If we're currently in modal state, go back one history step (clean UX)
  if (state.view === "modal") {
    history.back();
  } else {
    el("imgModal").classList.remove("show");
  }
}

function setupImageModal() {
  // close button
  el("imgModalClose").onclick = closeImageModalSmart;

  // click backdrop
  el("imgModal").onclick = (e) => {
    if (e.target.id === "imgModal") closeImageModalSmart();
  };

  // ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el("imgModal").classList.contains("show")) {
      closeImageModalSmart();
    }
  });

  // Click product image in GRID (event delegation)
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".product-img");
    if (!img) return;

    const src = img.getAttribute("data-full") || img.getAttribute("src");
    const cap = img.getAttribute("data-caption") || "";
    openImageModal(src, cap);
  });
}

/* ---------- Router (Home / List / Grid) ---------- */
function routeView(skipPush = false) {
  const brand = el("brandSelect").value;

  // Home
  if (brand === "home") {
    showHome(!skipPush);
    renderHomePromos();
    return;
  }

  // leaving Home -> hide promos
  const home = el("homePromos");
  if (home) home.style.display = "none";

  // push brand navigation (unless we already pushed)
  if (!skipPush) pushAppState({ view: "brand", brand });

  // List mode
  if (BRAND_META[brand]?.view === "list") {
    el("productGrid").style.display = "none";
    el("brandPanel")?.classList.remove("hidden");
    setBrandHeader(brand);
    renderFlavorList(brand);
    return;
  }

  // Grid mode
  el("brandPanel")?.classList.add("hidden");
  el("productGrid").style.display = "";
  const items = applyFilters(FLAVORS);
  el("resultsCount").textContent = `${items.length} items`;
  renderGrid(items);
}

/* ---------- Back/Forward handling ---------- */
function setupBackBehavior() {
  window.addEventListener("popstate", () => {
    const state = currentAppState();

    // Always close modal when leaving modal state
    if (el("imgModal")?.classList.contains("show") && state.view !== "modal") {
      el("imgModal").classList.remove("show");
    }

    if (state.view === "modal") {
      // Ensure brand view is loaded underneath
      el("brandSelect").value = state.brand || "all";
      routeView(true);

      // Re-open modal for forward/back
      el("imgModalImage").src = state.src || "./images/placeholder.png";
      el("imgModalCaption").textContent = state.caption || "";
      el("imgModal").classList.add("show");
      return;
    }

    if (state.view === "brand") {
      el("brandSelect").value = state.brand || "all";
      routeView(true);
      return;
    }

    // default to home
    el("brandSelect").value = "home";
    showHome(false);
    renderHomePromos();
  });
}

/* ---------- Init ---------- */
async function init() {
  setupImageModal();
  setupBackBehavior();

  // shop footer
  el("shopName").textContent = SHOP.name;
  el("hoursText").textContent = SHOP.hours;
  el("addressText").textContent = SHOP.address;
  el("phoneText").textContent = SHOP.phoneDisplay;
  el("mapsText").href = SHOP.mapsLink;

  await loadMenu();
  renderBrandDropdown(uniqueBrands(FLAVORS));

  // Start on Home and set initial history state
  el("brandSelect").value = "home";
  history.replaceState({ view: "home" }, "", "");

  el("brandSelect").onchange = () => routeView(false);
  el("searchInput").oninput = () => routeView(false);
  el("sortSelect").onchange = () => routeView(false);

  routeView(true); // true = don't push (already replaceState)
}

init().catch((err) => {
  console.error(err);
  const grid = el("productGrid");
  if (grid) {
    grid.innerHTML = `
      <div class="card">
        <h3>Menu failed to load</h3>
        <p class="desc">Check <b>data/menu.json</b> path and JSON format.</p>
      </div>
    `;
  }
});
