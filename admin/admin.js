import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/**
 * IMPORTANT:
 * Put your real values here.
 * - Supabase URL: Settings → API → Project URL
 * - Anon key: Settings → API Keys → Publishable key
 */
const SUPABASE_URL = "https://aldvugeyjwjtwcwgcfij.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3l-ZjBLZVB5r3bBhfvk23A_dwEVenDy";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // helps a lot on static hosting (GitHub Pages)
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

const el = (id) => document.getElementById(id);
const showMsg = (id, msg) => {
  const n = el(id);
  if (n) n.textContent = msg || "";
};

let brands = [];
let activeBrandId = null;
let flavorsByBrand = new Map();

/* ------------------------
   ORDERING / HELPERS
-------------------------*/
function homeOrderKey(b) {
  const clearance = b.clearance ? 0 : 1;
  const sortPrice = b.sort_price ?? 999999;
  const sortOrder = b.sort_order ?? 999999;
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
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ------------------------
   PASSWORD RECOVERY DETECTION (IMPORTANT)
-------------------------*/
function looksLikeRecoveryUrl() {
  const hash = window.location.hash || "";
  const qs = window.location.search || "";
  const params = new URLSearchParams(qs);

  // Supabase v2 can send:
  // - #access_token=...&type=recovery
  // - ?code=... (PKCE) with type=recovery
  // - older: #recovery_token=...
  return (
    hash.includes("type=recovery") ||
    params.get("type") === "recovery" ||
    hash.includes("recovery_token") ||
    hash.includes("access_token=") // treat token as recovery/confirmation visit
  );
}

// If the browser (Brave shields) blocks storage, password update fails.
// This forces Supabase to parse the URL and store the session when needed.
async function ensureSessionFromUrlIfNeeded() {
  const { data: s1, error: s1e } = await supabase.auth.getSession();
  if (s1e) throw s1e;
  if (s1?.session?.user) return s1.session;

  const { data, error } = await supabase.auth.getSessionFromUrl({
    storeSession: true,
  });
  if (error) throw error;

  const { data: s2, error: s2e } = await supabase.auth.getSession();
  if (s2e) throw s2e;
  if (!s2?.session?.user) {
    throw new Error(
      "No auth session found from the recovery link. If using Brave, disable Shields for this page and try again."
    );
  }
  return s2.session;
}

/* This flag forces showing the Set Password UI while on recovery link */
let FORCE_PASSWORD_RESET = looksLikeRecoveryUrl();

/* ------------------------
   AUTH UI
-------------------------*/
async function refreshAuthUI() {
  // If we are on recovery visit, ALWAYS show auth view + recovery box
  if (FORCE_PASSWORD_RESET || looksLikeRecoveryUrl()) {
    FORCE_PASSWORD_RESET = true;

    el("recoveryBox")?.classList.remove("hidden");
    el("authView")?.classList.remove("hidden");
    el("adminView")?.classList.add("hidden");
    el("logoutBtn")?.classList.add("hidden");

    showMsg("authMsg", "Enter a new password below to finish resetting.");
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) return showMsg("authMsg", String(error.message || error));

  const session = data?.session;
  const loggedIn = !!session?.user;

  el("authView")?.classList.toggle("hidden", loggedIn);
  el("adminView")?.classList.toggle("hidden", !loggedIn);
  el("logoutBtn")?.classList.toggle("hidden", !loggedIn);

  const userEmail = el("userEmail");
  if (userEmail) userEmail.textContent = session?.user?.email || "";

  if (loggedIn) {
    await loadAll();
  }
}

/* ------------------------
   AUTH (login / forgot / reset)
-------------------------*/
async function login() {
  showMsg("authMsg", "");
  const email = el("email")?.value?.trim() || "";
  const password = el("password")?.value || "";

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showMsg("authMsg", `Login failed: ${error.message}`);

  FORCE_PASSWORD_RESET = false;
  await refreshAuthUI();
}

async function forgotPassword() {
  showMsg("authMsg", "");
  const email = el("email")?.value?.trim() || "";
  if (!email) return showMsg("authMsg", "Enter your email first.");

  // GitHub Pages: explicit file path is safest
  const redirectTo = `${location.origin}/menu/admin/index.html`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) return showMsg("authMsg", `Reset failed: ${error.message}`);
  showMsg("authMsg", "Password reset email sent. Check inbox/spam.");
}

async function setNewPassword() {
  showMsg("authMsg", "");
  try {
    const newPassword = el("newPassword")?.value || "";
    if (newPassword.length < 6) {
      return showMsg("authMsg", "Use at least 6 characters.");
    }

    // Ensure we have a valid recovery session
    await ensureSessionFromUrlIfNeeded();

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return showMsg("authMsg", `Update failed: ${error.message}`);

    // Clean URL (removes tokens so refresh doesn't re-trigger recovery mode)
    FORCE_PASSWORD_RESET = false;
    history.replaceState(null, "", window.location.pathname);

    el("recoveryBox")?.classList.add("hidden");
    showMsg("authMsg", "✅ Password updated! Loading admin...");

    await refreshAuthUI();
  } catch (e) {
    showMsg(
      "authMsg",
      `Update failed: ${e?.message || String(e)}\n\nTip: If you're using Brave, disable Shields for this page and try the recovery link again.`
    );
  }
}

// Auth state changes
supabase.auth.onAuthStateChange(async (event) => {
  // PASSWORD_RECOVERY event is often fired on recovery link
  if (event === "PASSWORD_RECOVERY") {
    FORCE_PASSWORD_RESET = true;
    await refreshAuthUI();
    return;
  }

  if (event === "SIGNED_OUT") {
    FORCE_PASSWORD_RESET = false;
    await refreshAuthUI();
    return;
  }

  if (
    event === "SIGNED_IN" ||
    event === "TOKEN_REFRESHED" ||
    event === "INITIAL_SESSION"
  ) {
    // If we are on recovery URL, keep forcing reset UI until password updated
    if (looksLikeRecoveryUrl()) FORCE_PASSWORD_RESET = true;
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
    for (const f of data || []) {
      const arr = flavorsByBrand.get(f.brand_id) || [];
      arr.push(f);
      flavorsByBrand.set(f.brand_id, arr);
    }

    for (const [bid, arr] of flavorsByBrand.entries()) {
      arr.sort(
        (a, b) =>
          (a.sort_order ?? 999999) - (b.sort_order ?? 999999) ||
          (a.flavor || "").localeCompare(b.flavor || "")
      );
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
  const q = (el("brandSearch")?.value || "").trim().toLowerCase();
  const list = el("brandList");
  if (!list) return;

  list.innerHTML = "";

  const filtered = brands.filter(
    (b) =>
      (b.name || "").toLowerCase().includes(q) ||
      (b.id || "").toLowerCase().includes(q)
  );

  for (const b of filtered) {
    const div = document.createElement("div");
    div.className = "item" + (b.id === activeBrandId ? " active" : "");
    div.innerHTML = `
      <div><b>${escapeHtml(b.name)}</b></div>
      <div class="sub">${b.clearance ? "CLEARANCE • " : ""}${escapeHtml(
        b.price_text || ""
      )} ${b.deal_text ? "• " + escapeHtml(b.deal_text) : ""}</div>
      <div class="sub">id: ${escapeHtml(b.id)}</div>
    `;
    div.onclick = () => selectBrand(b.id);
    list.appendChild(div);
  }
}

function selectBrand(brandId) {
  activeBrandId = brandId;

  const b = brands.find((x) => x.id === brandId);
  if (!b) return;

  el("brandHeading") && (el("brandHeading").textContent = `Editing: ${b.name}`);
  el("brandEditor")?.classList.remove("hidden");
  el("saveBrandBtn")?.classList.remove("hidden");
  el("deleteBrandBtn")?.classList.remove("hidden");

  el("b_id") && (el("b_id").value = b.id || "");
  el("b_name") && (el("b_name").value = b.name || "");
  el("b_puffs") && (el("b_puffs").value = b.puffs || "");
  el("b_price_text") && (el("b_price_text").value = b.price_text || "");
  el("b_deal_text") && (el("b_deal_text").value = b.deal_text || "");
  el("b_card_image") && (el("b_card_image").value = b.card_image || "");
  el("b_file_path") && (el("b_file_path").value = b.file_path || "");
  el("b_clearance") && (el("b_clearance").checked = !!b.clearance);
  el("b_sort_price") && (el("b_sort_price").value = b.sort_price ?? "");
  el("b_sort_order") && (el("b_sort_order").value = b.sort_order ?? "");

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
    sort_order: null,
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
  const newId = el("b_id")?.value?.trim() || "";
  if (!newId) return showMsg("adminMsg", "Brand ID cannot be empty.");

  if (newId !== oldId && brands.some((b) => b.id === newId)) {
    return showMsg("adminMsg", "Brand ID already exists. Choose another.");
  }

  const payload = {
    id: newId,
    name: el("b_name")?.value?.trim() || "",
    puffs: el("b_puffs")?.value?.trim() || "",
    price_text: el("b_price_text")?.value?.trim() || "",
    deal_text: el("b_deal_text")?.value?.trim() || "",
    card_image: el("b_card_image")?.value?.trim() || "",
    file_path: el("b_file_path")?.value?.trim() || "",
    clearance: !!el("b_clearance")?.checked,
    sort_price:
      (el("b_sort_price")?.value ?? "") === "" ? null : Number(el("b_sort_price").value),
    sort_order:
      (el("b_sort_order")?.value ?? "") === "" ? null : Number(el("b_sort_order").value),
  };

  // If changing brand ID, update child flavors then rewrite brand row
  if (newId !== oldId) {
    const { error: fErr } = await supabase
      .from("flavors")
      .update({ brand_id: newId })
      .eq("brand_id", oldId);
    if (fErr) return showMsg("adminMsg", `Update flavors brand_id failed: ${fErr.message}`);

    const { error: delErr } = await supabase.from("brands").delete().eq("id", oldId);
    if (delErr) return showMsg("adminMsg", `Remove old brand failed: ${delErr.message}`);

    const { error: insErr } = await supabase.from("brands").insert(payload);
    if (insErr) return showMsg("adminMsg", `Insert new brand failed: ${insErr.message}`);
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

  // Delete flavors first (if you don't have ON DELETE CASCADE in DB)
  const { error: fErr } = await supabase.from("flavors").delete().eq("brand_id", activeBrandId);
  if (fErr) return showMsg("adminMsg", `Delete flavors failed: ${fErr.message}`);

  const { error } = await supabase.from("brands").delete().eq("id", activeBrandId);
  if (error) return showMsg("adminMsg", `Delete failed: ${error.message}`);

  activeBrandId = null;
  el("brandEditor")?.classList.add("hidden");
  el("saveBrandBtn")?.classList.add("hidden");
  el("deleteBrandBtn")?.classList.add("hidden");
  el("brandHeading") && (el("brandHeading").textContent = "Select a brand");

  await loadAll();
}

/* ------------------------
   UI + CRUD: Flavors
-------------------------*/
function tagCheckbox(tag, id, tags) {
  const on = (tags || []).includes(tag) ? "checked" : "";
  const label = tag.toUpperCase();
  return `
    <label class="rowLeft">
      <input type="checkbox" data-tag="${tag}" data-id="${id}" ${on}>
      <span>${label}</span>
    </label>
  `;
}

function renderFlavorList() {
  const wrap = el("flavorList");
  if (!wrap) return;

  wrap.innerHTML = "";
  const arr = flavorsByBrand.get(activeBrandId) || [];

  for (const f of arr) {
    const row = document.createElement("div");
    row.className = "flavorRow";

    const tags = Array.isArray(f.tags) ? f.tags : [];
    row.innerHTML = `
      <div class="flavorTop">
        <div><b>${escapeHtml(f.flavor)}</b></div>
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

  // delete flavor
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

  // auto-save on change
  wrap.querySelectorAll("input[data-f]").forEach((inp) => {
    inp.onchange = async () => {
      const fid = inp.getAttribute("data-id");
      const field = inp.getAttribute("data-f");

      let value;
      if (inp.type === "checkbox") value = inp.checked;
      else if (inp.type === "number") value = inp.value === "" ? null : Number(inp
