// =========================
// Stardust Smoke Shop Menu
// Home Promos + Hybrid Grid/List UX
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

/* 🔥 Home promo cards */
const HOME_PROMOS = [
  {
    title: "🔥🔥🔥",
    sub: "Geek Bar 15K 2 for $40",
    image: "./images/promos/geek15k.png",
    brand: "Geek Bar Pulse 15K"
  },
  {
    title: "🔥🔥🔥",
    sub: "GeekBar 25k 2 for $50",
    image: "./images/promos/geek25k.png",
    brand: "Geek Bar Pulse X 25K"
  }
];


/* 🧠 Brands that use LIST view */
const BRAND_META = {
  "Geek Bar Pulse 15K": { view: "list", puffs: "15,000 puffs", price: 25 },
  //"Geek Bar Pulse X 25K": { view: "list", puffs: "25,000 puffs", price: 35 },
  "Lava Plus": { view: "list", puffs: "2600 puffs", price: 10 }
};

const el = (id) => document.getElementById(id);

function money(n) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function priceToSortableNumber(price) {
  return typeof price === "number" ? price : Number.POSITIVE_INFINITY;
}

let FLAVORS = [];

/* ---------- Load menu ---------- */
async function loadMenu() {
  const res = await fetch("./data/menu.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load menu.json");
  FLAVORS = await res.json();
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
        <img class="promo-img" src="${p.image}" alt="${p.title}"
             onerror="this.style.display='none'"/>
      </div>
      <div class="promo-title">${p.title}</div>
      <p class="promo-sub">${p.sub}</p>
    </article>
  `
  ).join("");

  wrap.querySelectorAll(".promo-card").forEach((card) => {
    card.addEventListener("click", () => {
      el("brandSelect").value = card.dataset.brand;
      el("brandSelect").dispatchEvent(new Event("change"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function showHome() {
  el("homePromos").style.display = "";
  el("productGrid").style.display = "none";
  el("brandPanel").classList.add("hidden");
  el("resultsCount").textContent = "Choose a category";
}

/* ---------- Grid View ---------- */
function applyFilters(items) {
  const q = el("searchInput").value.toLowerCase();
  const brand = el("brandSelect").value;

  let out = items;
  if (brand !== "all" && brand !== "home") out = out.filter((p) => p.brand === brand);
  if (q) out = out.filter((p) => p.flavor.toLowerCase().includes(q));
  return out;
}

function renderGrid(items) {
  const grid = el("productGrid");

  grid.innerHTML = items
    .map((p) => `
    <article class="card">
      <div class="product-img-wrap">
        <img class="product-img"
          src="${p.image || "./images/placeholder.png"}"
          alt="${p.flavor}"
          data-full="${p.image}"
          data-caption="${p.brand} — ${p.flavor}">
      </div>
      <h3>${p.flavor}</h3>
      <div class="meta"><span class="badge">${p.brand}</span></div>
      <div class="price">${money(p.price)}</div>
    </article>
  `)
    .join("");
}

/* ---------- List View ---------- */
function setBrandHeader(name) {
  const meta = BRAND_META[name] || {};
  el("brandTitle").textContent = name;
  el("brandPuffs").textContent = meta.puffs || "—";
  el("brandPrice").textContent =
    typeof meta.price === "number" ? money(meta.price) : meta.price || "—";
}

function renderFlavorList(brand) {
  const list = el("flavorList");
  const q = el("searchInput").value.toLowerCase();

  const items = FLAVORS.filter(
    (p) => p.brand === brand && (!q || p.flavor.toLowerCase().includes(q))
  );

  el("resultsCount").textContent = `${items.length} items`;

  list.innerHTML = items
    .map(
      (p) => `
    <div class="flavor-item"
         data-src="${p.image}"
         data-caption="${p.brand} — ${p.flavor}">
      <div class="flavor-name">${p.flavor}</div>
      <div class="flavor-hint">Tap to view</div>
    </div>
  `
    )
    .join("");

  list.querySelectorAll(".flavor-item").forEach((row) => {
    row.addEventListener("click", () => {
      openImageModal(row.dataset.src, row.dataset.caption);
    });
  });
}

/* ---------- Image Modal ---------- */
function openImageModal(src, caption) {
  const modal = el("imgModal");
  el("imgModalImage").src = src;
  el("imgModalCaption").textContent = caption;
  modal.classList.add("show");
}

function setupImageModal() {
  const modal = el("imgModal");
  const closeBtn = el("imgModalClose");

  closeBtn.onclick = () => modal.classList.remove("show");

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("show");
  };

  // Attach once
  if (!document.body.dataset.imgModalBound) {
    document.addEventListener("click", (e) => {
      const img = e.target.closest(".product-img");
      if (!img) return;

      const src = img.getAttribute("data-full") || img.getAttribute("src");
      const cap = img.getAttribute("data-caption") || "";
      openImageModal(src, cap);
    });

    document.body.dataset.imgModalBound = "true";
  }
}


/* ---------- Hybrid Router ---------- */
function routeView() {
  const brand = el("brandSelect").value;

  if (brand === "home") {
    showHome();
    renderHomePromos();
    return;
  }

  el("homePromos").style.display = "none";

  if (BRAND_META[brand]?.view === "list") {
    el("productGrid").style.display = "none";
    el("brandPanel").classList.remove("hidden");
    setBrandHeader(brand);
    renderFlavorList(brand);
    return;
  }

  el("brandPanel").classList.add("hidden");
  el("productGrid").style.display = "";
  const items = applyFilters(FLAVORS);
  el("resultsCount").textContent = `${items.length} items`;
  renderGrid(items);
}

/* ---------- Init ---------- */
async function init() {
  setupImageModal();

  el("shopName").textContent = SHOP.name;
  el("hoursText").textContent = SHOP.hours;
  el("addressText").textContent = SHOP.address;
  el("phoneText").textContent = SHOP.phoneDisplay;
  el("mapsText").href = SHOP.mapsLink;

  await loadMenu();
  renderBrandDropdown(uniqueBrands(FLAVORS));

  el("brandSelect").value = "home";
  el("brandSelect").onchange = routeView;
  el("searchInput").oninput = routeView;
  el("sortSelect").onchange = routeView;

  routeView();
}

init();
