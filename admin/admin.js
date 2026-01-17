// 1) Put your Supabase project URL + anon key here:
const SUPABASE_URL = "PASTE_SUPABASE_URL";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const el = (id) => document.getElementById(id);
const loginMsg = (t) => (el("loginMsg").textContent = t || "");

async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

async function setUIForAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    el("logoutBtn").classList.add("hidden");
    el("adminArea").classList.add("hidden");
    loginMsg("Not logged in.");
    return;
  }

  el("logoutBtn").classList.remove("hidden");

  const ok = await isAdmin();
  if (!ok) {
    el("adminArea").classList.add("hidden");
    loginMsg("Logged in, but NOT an admin. Add your user to the admins table.");
    return;
  }

  loginMsg("Logged in as admin ✅");
  el("adminArea").classList.remove("hidden");
  await loadBrands();
}

function parseTags(s) {
  return (s || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}

async function loadBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("clearance", { ascending: false })
    .order("sort_price", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    alert("Brands load failed: " + error.message);
    return;
  }

  const sel = el("brandSelect");
  sel.innerHTML = data.map(b => `<option value="${b.id}">${b.name} (${b.id})</option>`).join("");

  if (data.length) {
    await loadFlavors(sel.value);
  }
}

async function loadFlavors(brandId) {
  const { data, error } = await supabase
    .from("flavors")
    .select("*")
    .eq("brand_id", brandId)
    .order("sold_out", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("flavor", { ascending: true });

  if (error) {
    alert("Flavors load failed: " + error.message);
    return;
  }

  const tbody = el("flavorsTable").querySelector("tbody");
  tbody.innerHTML = data.map(row => `
    <tr data-id="${row.id}">
      <td><input value="${escapeHtml(row.flavor || "")}" data-k="flavor"></td>
      <td><input value="${row.price ?? ""}" data-k="price" style="width:90px"></td>
      <td><input value="${escapeHtml(row.image || "")}" data-k="image" style="width:340px"></td>
      <td><input value="${escapeHtml((row.tags || []).join(","))}" data-k="tags" style="width:220px"></td>
      <td><input type="checkbox" ${row.sold_out ? "checked" : ""} data-k="sold_out"></td>
      <td>
        <button data-act="save">Save</button>
        <button data-act="del">Delete</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const tr = e.target.closest("tr");
      const id = tr.dataset.id;
      const act = e.target.dataset.act;
      if (act === "save") await saveRow(tr, id, brandId);
      if (act === "del") await deleteRow(id, brandId);
    });
  });
}

async function saveRow(tr, id, brandId) {
  const getVal = (k) => {
    const input = tr.querySelector(`[data-k="${k}"]`);
    if (!input) return null;
    if (input.type === "checkbox") return input.checked;
    return input.value;
  };

  const payload = {
    flavor: getVal("flavor"),
    image: getVal("image") || null,
    sold_out: !!getVal("sold_out"),
    tags: parseTags(getVal("tags")),
  };

  const priceStr = getVal("price");
  payload.price = priceStr === "" ? null : Number(priceStr);

  const { error } = await supabase.from("flavors").update(payload).eq("id", id);
  if (error) return alert("Save failed: " + error.message);

  await loadFlavors(brandId);
}

async function deleteRow(id, brandId) {
  if (!confirm("Delete this flavor?")) return;
  const { error } = await supabase.from("flavors").delete().eq("id", id);
  if (error) return alert("Delete failed: " + error.message);
  await loadFlavors(brandId);
}

async function addFlavor(brandId) {
  const { error } = await supabase.from("flavors").insert({
    brand_id: brandId,
    flavor: "New Flavor",
    price: null,
    image: null,
    tags: [],
    sold_out: false,
    sort_order: 0
  });
  if (error) return alert("Add failed: " + error.message);
  await loadFlavors(brandId);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

// Events
el("loginBtn").onclick = async () => {
  loginMsg("Logging in...");
  const email = el("email").value.trim();
  const password = el("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return loginMsg("Login failed: " + error.message);
  await setUIForAuth();
};

el("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  await setUIForAuth();
};

el("refreshBtn").onclick = async () => {
  await loadBrands();
};

el("brandSelect").onchange = async () => {
  await loadFlavors(el("brandSelect").value);
};

el("newFlavorBtn").onclick = async () => {
  await addFlavor(el("brandSelect").value);
};

// Init
supabase.auth.onAuthStateChange(() => setUIForAuth());
setUIForAuth();

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

const SUPABASE_URL = "https://aldvugeyjwjtwcwgcfij.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_3l-ZjBLZVB5r3bBhfvk23A_dwEVenDy"

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

