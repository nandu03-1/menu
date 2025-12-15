// =========================
// Stardust Smoke Shop Menu
// Loads from data/menu.json
// Hybrid UX:
//  - Default: Grid cards (existing)
//  - For selected brands: List view (tap flavor to view image)
// =========================

const SHOP = {
  name: "Stardust Smoke Shop Hillsborough",
  phone: "+19088295361",
  phoneDisplay: "(908) 829-5361",
  address: "626 US-206 Unit-4, Hillsborough Township, NJ 08844",
  hours: "Mon–Sun: 8 AM – 12 AM",
  mapsLink:
    "https://www.google.com/maps/place/Stardust+Smoke+Shop+%26+convenience+store+(premium+cigar+shop)/@40.5001418,-74.6500179,17z/data=!4m6!3m5!1s0x89c3ebd371924a8f:0x8a8248a9d3bc5c88!8m2!3d40.5001377!4d-74.647443!16s%2Fg%2F11sfdvyxv5?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D"
};

// ✅ Configure which brands use LIST view + header info
const BRAND_META = {
  //"Geek Bar Pulse 15K": { view: "list", puffs: "15,000 puffs", price: 25 },
  //"Geek Bar Pulse X 25K": { view: "list", puffs: "25,000 puffs", price: 35 },
  // "Oilio Meteor 35K": { view: "list", puffs: "35,000 puffs", price: "Kit $28 / Pod $25" },
  //"Flair Sniper 45K": { view: "list", puffs: "45,000 puffs", price: 35 },
  "Lava Plus": { view: "list", puffs: "2600 puffs", price: 10 }
};

const el = (id) => document.getElementById(id);

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function priceToSortableNumber(price) {
  if (typeof price === "number") return price;
  return Number.POSITIVE_INFINITY; // text prices sort after numbers
}

let FLAVORS = []; // Loaded from menu.json

async function loadMenu() {
  const res = await fetch("./data/menu.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load menu.json (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("menu.json must be a JSON array []");
  FLAVORS = data;
}

function uniqueBrands(items) {
  const set = new Set(items.map((p) => p.brand).filter(Boolean));
  return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

function renderBrandDropdown(brands) {
  const select = el("brandSelect");
  select.innerHTML = brands
    .map((b) => `<option value="${b}">${b === "all" ? "All brands" : b}</option>`)
    .join("");
}

function applyFilters(items) {
  const q = el("searchInput").value.trim().toLowerCase();
  const brand = el("brandSelect").value;

  let filtered = items;

  if (brand !== "all") filtered = filtered.filter((p) => p.brand === brand);

  if (q) {
    filtered = filtered.filter((p) => {
      const hay = `${p.brand ?? ""} ${p.flavor ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const sort = el("sortSelect").value;
  if (sort === "priceAsc") filtered = [...filtered].sort((a, b) => priceToSortableNumber(a.price) - priceToSortableNumber(b.price));
  if (sort === "priceDesc") filtered = [...filtered].sort((a, b) => priceToSortableNumber(b.price) - priceToSortableNumber(a.price));
  if (sort === "nameAsc") filtered = [...filtered].sort((a, b) => (a.flavor ?? "").localeCompare(b.flavor ?? ""));
  if (sort === "nameDesc") filtered = [...filtered].sort((a, b) => (b.flavor ?? "").localeCompare(a.flavor ?? ""));

  return filtered;
}

function renderItems(items) {
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

  grid.innerHTML = items.map((p) => {
    const priceText =
      typeof p.price === "number" ? money(p.price) : (p.price ? p.price : "Call for price");

    const imgSrc = p.image ? p.image : "./images/placeholder.png";

    return `
      <article class="card">
        <div class="product-img-wrap">
          <img
            class="product-img"
            src="${imgSrc}"
            alt="${(p.brand ?? "") + " - " + (p.flavor ?? "")}"
            loading="lazy"
            referrerpolicy="no-referrer"
            data-full="${imgSrc}"
            data-caption="${(p.brand ?? "") + " — " + (p.flavor ?? "")}"
            onerror="this.src='./images/placeholder.png'; this.onerror=null;"
          />
        </div>

        <h3>${p.flavor ?? ""}</h3>
        <div class="meta">
          <span class="badge">${p.brand ?? ""}</span>
        </div>
        <div class="price">${priceText}</div>
      </article>
    `;
  }).join("");
}

function setupImageModal() {
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("imgModalImage");
  const caption = document.getElementById("imgModalCaption");
  const closeBtn = document.getElementById("imgModalClose");

  const open = (src, text) => {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    modalImg.src = src;
    modalImg.alt = text || "Product image";
    caption.textContent = text || "";
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    caption.textContent = "";
    document.body.style.overflow = "";
  };

  // Click image in grid (event delegation)
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".product-img");
    if (!img) return;

    const src = img.getAttribute("data-full");
    const text = img.getAttribute("data-caption");
    if (src) open(src, text);
  });

  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  return { open };
}

/* ---------- Hybrid List View ---------- */

function setBrandHeader(brandName) {
  const meta = BRAND_META[brandName] || {};
  el("brandTitle").textContent = brandName || "Brand";
  el("brandPuffs").textContent = meta.puffs || "—";

  if (typeof meta.price === "number") el("brandPrice").textContent = money(meta.price);
  else if (meta.price) el("brandPrice").textContent = meta.price;
  else {
    // fallback: try to infer price from menu items if all same numeric
    const items = FLAVORS.filter((p) => p.brand === brandName);
    const nums = items.map(i => i.price).filter(v => typeof v === "number");
    const unique = Array.from(new Set(nums));
    el("brandPrice").textContent = unique.length === 1 ? money(unique[0]) : "—";
  }
}

function renderFlavorList(brandName, modalApi) {
  const list = el("flavorList");
  const q = el("searchInput").value.trim().toLowerCase();

  let items = FLAVORS.filter((p) => p.brand === brandName);

  if (q) {
    items = items.filter((p) => (`${p.flavor ?? ""}`.toLowerCase().includes(q)));
  }

  // list view always sorts by flavor name for readability
  items = items.slice().sort((a, b) => (a.flavor ?? "").localeCompare(b.flavor ?? ""));

  el("resultsCount").textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;

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
    const imgSrc = p.image ? p.image : "./images/placeholder.png";
    const caption = `${p.brand ?? ""} — ${p.flavor ?? ""}`;
    return `
      <div class="flavor-item" data-src="${imgSrc}" data-caption="${caption.replaceAll('"', "&quot;")}">
        <div class="flavor-name">${p.flavor ?? ""}</div>
        <div class="flavor-hint">Tap to view</div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".flavor-item").forEach((row) => {
    row.addEventListener("click", () => {
      const src = row.getAttribute("data-src");
      const caption = row.getAttribute("data-caption");
      modalApi.open(src, caption);
    });
  });
}

function applyHybridView(modalApi) {
  const selectedBrand = el("brandSelect").value;

  const grid = el("productGrid");
  const panel = el("brandPanel");

  // "all" always uses grid view
  if (selectedBrand === "all") {
    panel.classList.add("hidden");
    grid.style.display = "";
    render(); // normal grid
    return;
  }

  const meta = BRAND_META[selectedBrand];

  if (meta?.view === "list") {
    // show list view
    grid.style.display = "none";
    panel.classList.remove("hidden");

    setBrandHeader(selectedBrand);
    renderFlavorList(selectedBrand, modalApi);
    return;
  }

  // default: grid view
  panel.classList.add("hidden");
  grid.style.display = "";
  render(); // normal grid
}

/* ---------- Existing Render ---------- */

function render() {
  const filtered = applyFilters(FLAVORS);
  el("resultsCount").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  renderItems(filtered);
}

function setupAgeGate() {
  const gate = el("ageGate");
  const key = "stardust_menu_age_ok";

  const show = () => { gate.classList.add("show"); gate.setAttribute("aria-hidden", "false"); };
  const hide = () => { gate.classList.remove("show"); gate.setAttribute("aria-hidden", "true"); };

  if (localStorage.getItem(key) !== "yes") show();

  el("ageYes").addEventListener("click", () => { localStorage.setItem(key, "yes"); hide(); });
  el("ageNo").addEventListener("click", () => { window.location.href = "https://www.google.com"; });
}

function setupShopInfo() {
  el("shopName").textContent = SHOP.name;
  el("callBtn").setAttribute("href", `tel:${SHOP.phone}`);
  el("mapBtn").setAttribute("href", SHOP.mapsLink);
  el("hoursText").textContent = SHOP.hours;
  el("addressText").textContent = SHOP.address;
  el("phoneText").textContent = SHOP.phoneDisplay;
  el("mapsText").setAttribute("href", SHOP.mapsLink);
}

async function init() {
  setupShopInfo();
  setupAgeGate();

  const modalApi = setupImageModal();

  await loadMenu();
  renderBrandDropdown(uniqueBrands(FLAVORS));

  const rerender = () => applyHybridView(modalApi);

  el("brandSelect").addEventListener("change", rerender);
  el("searchInput").addEventListener("input", rerender);
  el("sortSelect").addEventListener("change", rerender);

  rerender();
}

init().catch((err) => {
  console.error(err);
  const grid = document.getElementById("productGrid");
  if (grid) {
    grid.innerHTML = `
      <div class="card">
        <h3>Menu failed to load</h3>
        <p class="desc">Open DevTools → Console for details. Common causes: wrong <b>data/menu.json</b> path or invalid JSON.</p>
      </div>
    `;
  }
});
