// =========================
// Stardust Smoke Shop Menu
// Brand dropdown -> Flavor list + Price
// =========================

// ====== Shop settings ======
const SHOP = {
  name: "Stardust Smoke Shop",
  phone: "+19088295361",
  phoneDisplay: "(908) 829-5361",
  address: "626 US-206 Unit-4, Hillsborough Township, NJ 08844",
  hours: "Mon–Sun: 8 AM – 12 AM",
  mapsLink: "https://www.google.com/maps/place/Stardust+Smoke+Shop+%26+convenience+store+(premium+cigar+shop)/@40.5001418,-74.6500179,17z/data=!4m6!3m5!1s0x89c3ebd371924a8f:0x8a8248a9d3bc5c88!8m2!3d40.5001377!4d-74.647443!16s%2Fg%2F11sfdvyxv5?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D"
};

// ====== Menu data (from your uploaded document) ======
const FLAVORS = [
  // Geek Bar Pulse 15K ($25)
  { id: 1, brand: "Geek Bar Pulse 15K", flavor: "Crazy Melon", price: 25 },
  { id: 2, brand: "Geek Bar Pulse 15K", flavor: "Frozen Blackberry Fab", price: 25 },
  { id: 3, brand: "Geek Bar Pulse 15K", flavor: "Sour Gush", price: 25 },
  { id: 4, brand: "Geek Bar Pulse 15K", flavor: "Iceymintz", price: 25 },
  { id: 5, brand: "Geek Bar Pulse 15K", flavor: "Wild Berry Savers", price: 25 },
  { id: 6, brand: "Geek Bar Pulse 15K", flavor: "Pineapple Savers", price: 25 },
  { id: 7, brand: "Geek Bar Pulse 15K", flavor: "Strawberry Savers", price: 25 },
  { id: 8, brand: "Geek Bar Pulse 15K", flavor: "Rising Sun", price: 25 },
  { id: 9, brand: "Geek Bar Pulse 15K", flavor: "Frozen Strawberry", price: 25 },
  { id: 10, brand: "Geek Bar Pulse 15K", flavor: "Strawberry CC", price: 25 },
  { id: 11, brand: "Geek Bar Pulse 15K", flavor: "Fcuking Fab", price: 25 },
  { id: 12, brand: "Geek Bar Pulse 15K", flavor: "Black Cherry", price: 25 },
  { id: 13, brand: "Geek Bar Pulse 15K", flavor: "Orange Mint Savers", price: 25 },
  { id: 14, brand: "Geek Bar Pulse 15K", flavor: "Frozen Pina Colada", price: 25 },
  { id: 15, brand: "Geek Bar Pulse 15K", flavor: "Dragon Melon", price: 25 },
  { id: 16, brand: "Geek Bar Pulse 15K", flavor: "Sour Watermelon Drop", price: 25 },
  { id: 17, brand: "Geek Bar Pulse 15K", flavor: "Nectarine Ice", price: 25 },
  { id: 18, brand: "Geek Bar Pulse 15K", flavor: "Raspberry Watermelon", price: 25 },
  { id: 19, brand: "Geek Bar Pulse 15K", flavor: "Strawberry Kiwi", price: 25 },
  { id: 20, brand: "Geek Bar Pulse 15K", flavor: "Berry Bliss", price: 25 },
  { id: 21, brand: "Geek Bar Pulse 15K", flavor: "Pink Lemonade", price: 25 },
  { id: 22, brand: "Geek Bar Pulse 15K", flavor: "Blue Razz Ice", price: 25 },
  { id: 23, brand: "Geek Bar Pulse 15K", flavor: "Blow Pop", price: 25 },
  { id: 24, brand: "Geek Bar Pulse 15K", flavor: "White Gummy Ice", price: 25 },
  { id: 25, brand: "Geek Bar Pulse 15K", flavor: "Banana Ice", price: 25 },
  { id: 26, brand: "Geek Bar Pulse 15K", flavor: "Punch", price: 25 },
  { id: 27, brand: "Geek Bar Pulse 15K", flavor: "Peach Lemonade", price: 25 },
  { id: 28, brand: "Geek Bar Pulse 15K", flavor: "Meta Moon", price: 25 },
  { id: 29, brand: "Geek Bar Pulse 15K", flavor: "Watermelon Ice", price: 25 },
  { id: 30, brand: "Geek Bar Pulse 15K", flavor: "Blue Mint", price: 25 },
  { id: 31, brand: "Geek Bar Pulse 15K", flavor: "Cool Mint", price: 25 },
  { id: 32, brand: "Geek Bar Pulse 15K", flavor: "Juicy Peach Ice", price: 25 },
  { id: 33, brand: "Geek Bar Pulse 15K", flavor: "Strawberry Banana", price: 25 },
  { id: 34, brand: "Geek Bar Pulse 15K", flavor: "Mexico Mango", price: 25 },
  { id: 35, brand: "Geek Bar Pulse 15K", flavor: "Stonemintz", price: 25 },
  { id: 36, brand: "Geek Bar Pulse 15K", flavor: "Drop Sour Savers", price: 25 },
  { id: 37, brand: "Geek Bar Pulse 15K", flavor: "Cherry Bomb", price: 25 },
  { id: 38, brand: "Geek Bar Pulse 15K", flavor: "Tropical Rainbow Blast", price: 25 },
  { id: 39, brand: "Geek Bar Pulse 15K", flavor: "Frozen Watermelon", price: 25 },
  { id: 40, brand: "Geek Bar Pulse 15K", flavor: "Sour Cranapple", price: 25 },
  { id: 41, brand: "Geek Bar Pulse 15K", flavor: "Frozen White Grape", price: 25 },
  { id: 42, brand: "Geek Bar Pulse 15K", flavor: "Sour Apple Ice", price: 25 },
  { id: 43, brand: "Geek Bar Pulse 15K", flavor: "Strawberry Mango", price: 25 },
  { id: 44, brand: "Geek Bar Pulse 15K", flavor: "Miami Mint", price: 25 },
  { id: 45, brand: "Geek Bar Pulse 15K", flavor: "California Cherry", price: 25 },

  // Geek Bar Pule X 25K ($35)
  { id: 46, brand: "Geek Bar Pulse X 25K", flavor: "Sour Apple Ice", price: 35 },
  { id: 47, brand: "Geek Bar Pulse X 25K", flavor: "Banana Taffy Freeze", price: 35 },
  { id: 48, brand: "Geek Bar Pulse X 25K", flavor: "Orange Slush", price: 35 },
  { id: 49, brand: "Geek Bar Pulse X 25K", flavor: "Peach Perfect Slush", price: 35 },
  { id: 50, brand: "Geek Bar Pulse X 25K", flavor: "Blackberry Blueberry", price: 35 },
  { id: 51, brand: "Geek Bar Pulse X 25K", flavor: "Cola Slush", price: 35 },
  { id: 52, brand: "Geek Bar Pulse X 25K", flavor: "Peach Jam", price: 35 },
  { id: 53, brand: "Geek Bar Pulse X 25K", flavor: "Orange Mint", price: 35 },
  { id: 54, brand: "Geek Bar Pulse X 25K", flavor: "White Peach Raspberry", price: 35 },
  { id: 55, brand: "Geek Bar Pulse X 25K", flavor: "Strawberry Jam", price: 35 },
  { id: 56, brand: "Geek Bar Pulse X 25K", flavor: "Strawberry Colada", price: 35 },
  { id: 57, brand: "Geek Bar Pulse X 25K", flavor: "Blueberry Jam", price: 35 },
  { id: 58, brand: "Geek Bar Pulse X 25K", flavor: "Raspberry Jam", price: 35 },
  { id: 59, brand: "Geek Bar Pulse X 25K", flavor: "Blue Razz Ice", price: 35 },
  { id: 60, brand: "Geek Bar Pulse X 25K", flavor: "Grape Slush", price: 35 },
  { id: 61, brand: "Geek Bar Pulse X 25K", flavor: "Dualicious", price: 35 },
  { id: 62, brand: "Geek Bar Pulse X 25K", flavor: "Sour Mango Pineapple", price: 35 },
  { id: 63, brand: "Geek Bar Pulse X 25K", flavor: "Orange Fcuking Fab", price: 35 },
  { id: 64, brand: "Geek Bar Pulse X 25K", flavor: "Blackberry B-Pop", price: 35 },
  { id: 65, brand: "Geek Bar Pulse X 25K", flavor: "Pear Of Thieves", price: 35 },
  { id: 66, brand: "Geek Bar Pulse X 25K", flavor: "Sour Fcuking Fab", price: 35 },
  { id: 67, brand: "Geek Bar Pulse X 25K", flavor: "Miami Mint", price: 35 },
  { id: 68, brand: "Geek Bar Pulse X 25K", flavor: "Grapefruit Refreshner", price: 35 },
  { id: 69, brand: "Geek Bar Pulse X 25K", flavor: "Strawberry B-Pop", price: 35 },
  { id: 70, brand: "Geek Bar Pulse X 25K", flavor: "Orange Jam", price: 35 },
  { id: 71, brand: "Geek Bar Pulse X 25K", flavor: "Lemon Heads", price: 35 },
  { id: 72, brand: "Geek Bar Pulse X 25K", flavor: "Pink & Blue", price: 35 },

  // Oilio Meteor 35K (KIT/POD $28 / $25)
  { id: 73, brand: "Oilio Meteor 35K", flavor: "Blueberry Watermelon", price: "Kit $28 / Pod $25" },
  { id: 74, brand: "Oilio Meteor 35K", flavor: "Mexican Mango", price: "Kit $28 / Pod $25" },
  { id: 75, brand: "Oilio Meteor 35K", flavor: "Miami MInt", price: "Kit $28 / Pod $25" },
  { id: 76, brand: "Oilio Meteor 35K", flavor: "Peach Jam", price: "Kit $28 / Pod $25" },
  { id: 77, brand: "Oilio Meteor 35K", flavor: "Strawberry Watermelon", price: "Kit $28 / Pod $25" },

  // Flair Sniper 45K ($35)
  { id: 78, brand: "Flair Sniper 45K", flavor: "Bombsicle", price: 35 },
  { id: 79, brand: "Flair Sniper 45K", flavor: "Cherry Strike", price: 35 },
  { id: 80, brand: "Flair Sniper 45K", flavor: "Clear Chill", price: 35 },
  { id: 81, brand: "Flair Sniper 45K", flavor: "Frosted Blue", price: 35 },
  { id: 82, brand: "Flair Sniper 45K", flavor: "Fusion Fuel", price: 35 },
  { id: 83, brand: "Flair Sniper 45K", flavor: "MenthX", price: 35 },
  { id: 84, brand: "Flair Sniper 45K", flavor: "Mexican Mango", price: 35 },
  { id: 85, brand: "Flair Sniper 45K", flavor: "Mint Strom", price: 35 },
  { id: 86, brand: "Flair Sniper 45K", flavor: "Spearmint Shock", price: 35 },
  { id: 87, brand: "Flair Sniper 45K", flavor: "Strawberry B-Pop", price: 35 },
  { id: 88, brand: "Flair Sniper 45K", flavor: "Watermelon Chill", price: 35 },
  { id: 89, brand: "Flair Sniper 45K", flavor: "Wintergreen", price: 35 },
];

const el = (id) => document.getElementById(id);

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function priceToSortableNumber(price) {
  // numbers sort normally; strings (like kit/pod) sort after numbers
  if (typeof price === "number") return price;
  return Number.POSITIVE_INFINITY;
}

function uniqueBrands(items) {
  const set = new Set(items.map(p => p.brand).filter(Boolean));
  return ["all", ...Array.from(set).sort((a,b)=>a.localeCompare(b))];
}

function renderBrandDropdown(brands) {
  const select = el("brandSelect");
  select.innerHTML = brands
    .map(b => `<option value="${b}">${b === "all" ? "All brands" : b}</option>`)
    .join("");
}

function applyFilters(items) {
  const q = el("searchInput").value.trim().toLowerCase();
  const brand = el("brandSelect").value;

  let filtered = items;

  if (brand !== "all") filtered = filtered.filter(p => p.brand === brand);

  if (q) {
    filtered = filtered.filter(p => {
      const hay = `${p.brand ?? ""} ${p.flavor ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const sort = el("sortSelect").value;
  if (sort === "priceAsc") filtered = [...filtered].sort((a,b)=>priceToSortableNumber(a.price)-priceToSortableNumber(b.price));
  if (sort === "priceDesc") filtered = [...filtered].sort((a,b)=>priceToSortableNumber(b.price)-priceToSortableNumber(a.price));
  if (sort === "nameAsc") filtered = [...filtered].sort((a,b)=>(a.flavor ?? "").localeCompare(b.flavor ?? ""));
  if (sort === "nameDesc") filtered = [...filtered].sort((a,b)=>(b.flavor ?? "").localeCompare(a.flavor ?? ""));
  // "featured" keeps original order

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

  grid.innerHTML = items.map(p => {
    const priceText =
      typeof p.price === "number" ? money(p.price) : (p.price ? p.price : "Call for price");

    return `
      <article class="card">
        <h3>${p.flavor}</h3>
        <div class="meta">
          <span class="badge">${p.brand}</span>
        </div>
        <div class="price">${priceText}</div>
      </article>
    `;
  }).join("");
}

function render() {
  const filtered = applyFilters(FLAVORS);
  el("resultsCount").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  renderItems(filtered);
}

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
  el("callBtn").setAttribute("href", `tel:${SHOP.phone}`);
  el("mapBtn").setAttribute("href", SHOP.mapsLink);
  el("hoursText").textContent = SHOP.hours;
  el("addressText").textContent = SHOP.address;
  el("phoneText").textContent = SHOP.phoneDisplay;
  el("mapsText").setAttribute("href", SHOP.mapsLink);
}

function init() {
  setupShopInfo();
  setupAgeGate();

  renderBrandDropdown(uniqueBrands(FLAVORS));

  el("brandSelect").addEventListener("change", render);
  el("searchInput").addEventListener("input", render);
  el("sortSelect").addEventListener("change", render);

  render();
}

init();
