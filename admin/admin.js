import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/**
 * IMPORTANT:
 * Put your real values here.
 * - Supabase URL: Settings → API → Project URL
 * - Anon key: Settings → API Keys → Publishable key
 */
const SUPABASE_URL = "https://aldvugeyjwjtwcwgcfij.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3l-ZjBLZVB5r3bBhfvk23A_dwEVenDy";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const el = (id) => document.getElementById(id);
const showMsg = (id, msg) => { el(id).textContent = msg || ""; };

let brands = [];
let activeBrandId = null;
let flavorsByBrand = new Map();

function homeOrderKey(b) {
  // Clearance first, then sort_price low->high, then sort_order, then name
  const clearance = b.clearance ? 0 : 1;
  const sortPrice = (b.sort_price ?? 999999);
  const sortOrder = (b.sort_order ?? 999999);
  const name = (b.name || "").toLowerCase();
  return [clearance, sortPrice, sortOrder, name];
}

function compareKeys(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function refreshAuthUI() {
  const { data: { session } } = await supabase.auth.getSession();

  const loggedIn = !!session?.user;
  el("authView").classList.toggle("hidden", loggedIn);
  el("adminView").classList.toggle("hidden", !loggedIn);
  el("logoutBtn").classList.toggle("hidden", !loggedIn);

  el("userEmail").textContent = session?.user?.email || "";

  if (loggedIn) {
    await loadAll();
  }
}

/* ------------------------
   AUTH (login / forgot / recovery)
-------------------------*/
async function login() {
  showMsg("authMsg", "");
  const email = el("email").value.trim();
  const password = el("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showMsg("authMsg", `Login failed: ${error.message}`);
  await refreshAuthUI();
}

async function forgotPassword() {
  showMsg("authMsg", "");

  const email = el("email").value.trim();
  if (!email) return showMsg("authMsg", "Enter your email first.");

  // GitHub Pages is safer with an explicit file
  const redirectTo = `${location.origin}/menu/admin/index.html`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) return showMsg("authMsg", `Reset failed: ${error.message}`);

  showMsg("authMsg", "Password reset email sent. Check inbox/spam.");
}

async function setNewPassword() {
  showMsg("authMsg", "");
  const newPassword = el("newPassword").value;
  if (!newPassword || newPassword.length < 6) return showMsg("authMsg", "Use at least 6 characters.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return showMsg("authMsg", `Update failed: ${error.message}`);

  el("recoveryBox").classList.add("hidden");
  showMsg("authMsg", "Password updated. You can continue in admin.");
}

/* When user clicks recovery email, Supabase sets session state to PASSWORD_RECOVERY */
supabase.auth.onAuthStateChange(async (event, session) => {
  // If user came via recovery link, force password UI
  if (event === "PASSWORD_RECOVERY") {
    el("recoveryBox").classList.remove("hidden");
    el("authView").classList.remove("hidden");
    el("adminView").classList.add("hidden");
    el("logoutBtn").classList.add("hidden");
    showMsg("authMsg", "Enter a new password below to finish resetting.");
    return;
  }

  // Normal signed in / refresh
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
    await refreshAuthUI();
  }

  if (event === "SIGNED_OUT") {
    await refreshAuthUI();
  }
});

/* ------------------------
   DATA LOAD
-------------------------*/
async function loadAll() {
  showMsg("adminMsg", "");

  // brands
  {
    const { data, error } = await supabase.from("brands").select("*");
    if (error) return showMsg("adminMsg", `Load brands failed: ${error.message}`);
    brands = data || [];
    brands.sort((a, b) => compareKeys(homeOrderKey(a), homeOrderKey(b)));
  }

  // flavors
  {
    const { data, error } = await supabase.from("flavors").select("*");
    if (error) return showMsg("adminMsg", `Load flavors failed: ${error.message}`);

    flavorsByBrand = new Map();
    for (const f of (data || [])) {
      const arr = flavorsByBrand.get(f.brand_id) || [];
      arr.push(f);
      flavorsByBrand.set(f.brand_id, arr);
    }

    // stable per-brand order
    for (const [bid, arr] of flavorsByBrand.entries()) {
      arr.sort((a, b) => (a.sort_order ?? 999999) - (b.sort_order ?? 999999) || (a.flavor || "").localeCompare(b.flavor || ""));
      flavorsByBrand.set(bid, arr);
    }
  }

  renderBrandList();
  if (activeBrandId) selectBrand(activeBrandId);
}

/* ------------------------
   UI: Brand list
-------------------------*/
function renderBrandList() {
  const q = (el("brandSearch").value || "").trim().toLowerCase();

  const list = el("brandList");
  list.innerHTML = "";

  const filtered = brands.filter((b) =>
    (b.name || "").toLowerCase().includes(q) || (b.id || "").toLowerCase().includes(q)
  );

  for (const b of filtered) {
    const div = document.createElement("div");
    div.className = "item" + (b.id === activeBrandId ? " active" : "");
    div.innerHTML = `
      <div><b>${b.name}</b></div>
      <div class="sub">${b.clearance ? "CLEARANCE • " : ""}${b.price_text || ""} ${b.deal_text ? "• " + b.deal_text : ""}</div>
      <div class="sub">id: ${b.id}</div>
    `;
    div.onclick = () => selectBrand(b.id);
    list.appendChild(div);
  }
}

function selectBrand(brandId) {
  activeBrandId = brandId;

  const b = brands.find((x) => x.id === brandId);
  if (!b) return;

  el("brandHeading").textContent = `Editing: ${b.name}`;
  el("brandEditor").classList.remove("hidden");
  el("saveBrandBtn").classList.remove("hidden");
  el("deleteBrandBtn").classList.remove("hidden");

  // fill brand fields
  el("b_id").value = b.id || "";
  el("b_name").value = b.name || "";
  el("b_puffs").value = b.puffs || "";
  el("b_price_text").value = b.price_text || "";
  el("b_deal_text").value = b.deal_text || "";
  el("b_card_image").value = b.card_image || "";
  el("b_file_path").value = b.file_path || "";
  el("b_clearance").checked = !!b.clearance;
  el("b_sort_price").value = (b.sort_price ?? "");
  el("b_sort_order").value = (b.sort_order ?? "");

  // flavors
  renderFlavorList();
  renderBrandList();
}

/* ------------------------
   CRUD: Brands
-------------------------*/
async function createBrand() {
  showMsg("adminMsg", "");

  const name = prompt("Brand name?");
  if (!name) return;

  const id = prompt("Brand ID (slug)? Leave empty to auto-generate:", slugify(name)) || slugify(name);
  if (!id) return;

  // prevent duplicate
  if (brands.some((b) => b.id === id)) return showMsg("adminMsg", "That brand ID already exists.");

  const payload = {
    id,
    name,
    puffs: "",
    price_text: "",
    deal_text: "",
    card_image: "",
    file_path: "",
    clearance: false,
    sort_price: null,
    sort_order: null
  };

  const { error } = await supabase.from("brands").insert(payload);
  if (error) return showMsg("adminMsg", `Create brand failed: ${error.message}`);

  await loadAll();
  selectBrand(id);
}

async function saveBrand() {
  showMsg("adminMsg", "");

  if (!activeBrandId) return;

  const oldId = activeBrandId;
  const newId = el("b_id").value.trim();

  if (!newId) return showMsg("adminMsg", "Brand ID cannot be empty.");
  if (newId !== oldId && brands.some((b) => b.id === newId)) {
    return showMsg("adminMsg", "Brand ID already exists. Choose another.");
  }

  const payload = {
    id: newId,
    name: el("b_name").value.trim(),
    puffs: el("b_puffs").value.trim(),
    price_text: el("b_price_text").value.trim(),
    deal_text: el("b_deal_text").value.trim(),
    card_image: el("b_card_image").value.trim(),
    file_path: el("b_file_path").value.trim(),
    clearance: el("b_clearance").checked,
    sort_price: el("b_sort_price").value === "" ? null : Number(el("b_sort_price").value),
    sort_order: el("b_sort_order").value === "" ? null : Number(el("b_sort_order").value)
  };

  // If changing brand ID, we must update child flavors first
  if (newId !== oldId) {
    const { error: fErr } = await supabase
      .from("flavors")
      .update({ brand_id: newId })
      .eq("brand_id", oldId);
    if (fErr) return showMsg("adminMsg", `Update flavors brand_id failed: ${fErr.message}`);

    const { error: bErr } = await supabase.from("brands").delete().eq("id", oldId);
    if (bErr) return showMsg("adminMsg", `Remove old brand failed: ${bErr.message}`);

    const { error: iErr } = await supabase.from("brands").insert(payload);
    if (iErr) return showMsg("adminMsg", `Insert new brand failed: ${iErr.message}`);
  } else {
    const { error } = await supabase.from("brands").update(payload).eq("id", oldId);
    if (error) return showMsg("adminMsg", `Save failed: ${error.message}`);
  }

  await loadAll();
  selectBrand(newId);
  showMsg("adminMsg", "Saved.");
}

async function deleteBrand() {
  showMsg("adminMsg", "");
  if (!activeBrandId) return;

  const b = brands.find((x) => x.id === activeBrandId);
  if (!b) return;

  const ok = confirm(`Delete brand "${b.name}" AND all its flavors?`);
  if (!ok) return;

  const { error } = await supabase.from("brands").delete().eq("id", activeBrandId);
  if (error) return showMsg("adminMsg", `Delete failed: ${error.message}`);

  activeBrandId = null;
  el("brandEditor").classList.add("hidden");
  el("saveBrandBtn").classList.add("hidden");
  el("deleteBrandBtn").classList.add("hidden");
  el("brandHeading").textContent = "Select a brand";

  await loadAll();
}

/* ------------------------
   UI + CRUD: Flavors
-------------------------*/
function renderFlavorList() {
  const wrap = el("flavorList");
  wrap.innerHTML = "";

  const arr = flavorsByBrand.get(activeBrandId) || [];

  for (const f of arr) {
    const row = document.createElement("div");
    row.className = "flavorRow";

    const tags = Array.isArray(f.tags) ? f.tags : [];
    row.innerHTML = `
      <div class="flavorTop">
        <div><b>${f.flavor}</b></div>
        <div class="row">
          <span class="badge">${f.sold_out ? "SOLD OUT" : "IN STOCK"}</span>
          <button class="btn small danger" data-del="${f.id}">Delete</button>
        </div>
      </div>

      <div class="flavorGrid">
        <label><span>Flavor</span><input class="input" data-f="flavor" data-id="${f.id}" value="${escapeHtml(f.flavor)}"></label>
        <label><span>Price</span><input class="input" type="number" step="0.01" data-f="price" data-id="${f.id}" value="${f.price ?? ""}"></label>

        <label style="grid-column:1 / -1"><span>Image (path/url)</span>
          <input class="input" data-f="image" data-id="${f.id}" value="${escapeHtml(f.image || "")}">
        </label>

        <label class="rowLeft" style="grid-column:1 / -1">
          <input type="checkbox" data-f="sold_out" data-id="${f.id}" ${f.sold_out ? "checked" : ""}>
          <span>Sold Out</span>
        </label>

        <div class="tagsRow" style="grid-column:1 / -1">
          <span class="muted">Tags:</span>
          ${tagCheckbox("new", f.id, tags)}
          ${tagCheckbox("trending", f.id, tags)}
        </div>
      </div>
    `;

    wrap.appendChild(row);
  }

  // delete handlers
  wrap.querySelectorAll("button[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-del");
      const ok = confirm("Delete this flavor?");
      if (!ok) return;
      const { error } = await supabase.from("flavors").delete().eq("id", id);
      if (error) return showMsg("adminMsg", `Delete flavor failed: ${error.message}`);
      await loadAll();
      selectBrand(activeBrandId);
    };
  });

  // field updates (auto-save on change)
  wrap.querySelectorAll("input[data-f]").forEach((inp) => {
    inp.onchange = async () => {
      const fid = inp.getAttribute("data-id");
      const field = inp.getAttribute("data-f");

      let value;
      if (inp.type === "checkbox") value = inp.checked;
      else if (inp.type === "number") value = inp.value === "" ? null : Number(inp.value);
      else value = inp.value;

      // tags handled separately
      if (field === "tags") return;

      const patch = {};
      patch[field === "sold_out" ? "sold_out" : field] = value;

      const { error } = await supabase.from("flavors").update(patch).eq("id", fid);
      if (error) return showMsg("adminMsg", `Update flavor failed: ${error.message}`);

      showMsg("adminMsg", "Saved.");
      await loadAll();
      selectBrand(activeBrandId);
    };
  });

  // tag handlers
  wrap.querySelectorAll("input[data-tag]").forEach((cb) => {
    cb.onchange = async () => {
      const fid = cb.getAttribute("data-id");
      const tag = cb.getAttribute("data-tag");
      const checked = cb.checked;

      const current = (flavorsByBrand.get(activeBrandId) || []).find(x => x.id === fid);
      const tags = new Set(Array.isArray(current?.tags) ? current.tags : []);

      if (checked) tags.add(tag);
      else tags.delete(tag);

      const { error } = await supabase.from("flavors").update({ tags: Array.from(tags) }).eq("id", fid);
      if (error) return showMsg("adminMsg", `Update tags failed: ${error.message}`);

      showMsg("adminMsg", "Saved.");
      await loadAll();
      selectBrand(activeBrandId);
    };
  });
}

function tagCheckbox(tag, id, tags) {
  const on = tags.includes(tag) ? "checked" : "";
  const label = tag.toUpperCase();
  return `
    <label class="rowLeft">
      <input type="checkbox" data-tag="${tag}" data-id="${id}" ${on}>
      <span>${label}</span>
    </label>
  `;
}

async function addFlavor() {
  showMsg("adminMsg", "");
  if (!activeBrandId) return;

  const flavor = prompt("Flavor name?");
  if (!flavor) return;

  const payload = {
    brand_id: activeBrandId,
    flavor: flavor.trim(),
    price: null,
    image: "",
    tags: [],
    sold_out: false,
    sort_order: null
  };

  const { error } = await supabase.from("flavors").insert(payload);
  if (error) return showMsg("adminMsg", `Add flavor failed: ${error.message}`);

  await loadAll();
  selectBrand(activeBrandId);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ------------------------
   Wire up events
-------------------------*/
el("loginBtn").onclick = login;
el("forgotBtn").onclick = forgotPassword;
el("setPasswordBtn").onclick = setNewPassword;

el("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  await refreshAuthUI();
};

el("brandSearch").oninput = renderBrandList;
el("newBrandBtn").onclick = createBrand;
el("saveBrandBtn").onclick = saveBrand;
el("deleteBrandBtn").onclick = deleteBrand;
el("addFlavorBtn").onclick = addFlavor;

// Init
refreshAuthUI().catch((e) => showMsg("authMsg", String(e)));

