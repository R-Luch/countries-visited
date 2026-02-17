// Countries Visited v2.2 (offline, IndexedDB)
// Features: continents, filters, sorting, stats, undo, manual edit, notes (toggle),
// compact mode (toggle), collapsible continents, export/import, crash-proof toggles.

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)",
  "Costa Rica","Côte d’Ivoire","Croatia","Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark","Djibouti",
  "Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala",
  "Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia",
  "Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia",
  "Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco",
  "Mongolia","Montenegro","Morocco","Mozambique","Myanmar (Burma)","Namibia","Nauru","Nepal","Netherlands","New Zealand",
  "Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine State",
  "Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands",
  "Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
  "Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

// --- Continents mapping ---
const AFRICA = new Set([
  "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cabo Verde","Cameroon","Central African Republic","Chad",
  "Comoros","Congo (Congo-Brazzaville)","Côte d’Ivoire","Democratic Republic of the Congo","Djibouti","Egypt",
  "Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia","Ghana","Guinea","Guinea-Bissau","Kenya","Lesotho",
  "Liberia","Libya","Madagascar","Malawi","Mali","Mauritania","Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria",
  "Rwanda","Sao Tome and Principe","Senegal","Seychelles","Sierra Leone","Somalia","South Africa","South Sudan","Sudan",
  "Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe"
]);

const EUROPE = new Set([
  "Albania","Andorra","Armenia","Austria","Belarus","Belgium","Bosnia and Herzegovina","Bulgaria","Croatia","Cyprus","Czechia",
  "Denmark","Estonia","Finland","France","Georgia","Germany","Greece","Hungary","Iceland","Ireland","Italy","Latvia",
  "Liechtenstein","Lithuania","Luxembourg","Malta","Moldova","Monaco","Montenegro","Netherlands","North Macedonia","Norway",
  "Poland","Portugal","Romania","Russia","San Marino","Serbia","Slovakia","Slovenia","Spain","Sweden","Switzerland",
  "Ukraine","United Kingdom","Vatican City"
]);

const ASIA = new Set([
  "Afghanistan","Azerbaijan","Bahrain","Bangladesh","Bhutan","Brunei","Cambodia","China","India","Indonesia","Iran","Iraq",
  "Israel","Japan","Jordan","Kazakhstan","Kuwait","Kyrgyzstan","Laos","Lebanon","Malaysia","Maldives","Mongolia",
  "Myanmar (Burma)","Nepal","North Korea","Oman","Pakistan","Palestine State","Philippines","Qatar","Saudi Arabia",
  "Singapore","South Korea","Sri Lanka","Syria","Taiwan","Tajikistan","Thailand","Timor-Leste","Turkey","Turkmenistan",
  "United Arab Emirates","Uzbekistan","Vietnam","Yemen"
]);

const NORTH_AMERICA = new Set([
  "Antigua and Barbuda","Bahamas","Barbados","Belize","Canada","Costa Rica","Cuba","Dominica","Dominican Republic",
  "El Salvador","Grenada","Guatemala","Haiti","Honduras","Jamaica","Mexico","Nicaragua","Panama","Saint Kitts and Nevis",
  "Saint Lucia","Saint Vincent and the Grenadines","Trinidad and Tobago","United States"
]);

const SOUTH_AMERICA = new Set([
  "Argentina","Bolivia","Brazil","Chile","Colombia","Ecuador","Guyana","Paraguay","Peru","Suriname","Uruguay","Venezuela"
]);

const OCEANIA = new Set([
  "Australia","Fiji","Kiribati","Marshall Islands","Micronesia","Nauru","New Zealand","Palau","Papua New Guinea","Samoa",
  "Solomon Islands","Tonga","Tuvalu","Vanuatu"
]);

function continentOf(country){
  if (AFRICA.has(country)) return "Africa";
  if (ASIA.has(country)) return "Asia";
  if (EUROPE.has(country)) return "Europe";
  if (NORTH_AMERICA.has(country)) return "North America";
  if (SOUTH_AMERICA.has(country)) return "South America";
  if (OCEANIA.has(country)) return "Oceania";
  return "Other";
}

const CONTINENTS = ["Africa","Asia","Europe","North America","South America","Oceania","Other"];

// ---------- IndexedDB ----------
const DB_NAME = "countries_visited_db";
const STORE = "countries_v2";
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const data = {};
    const req = store.openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) { data[cur.key] = cur.value; cur.continue(); }
      else resolve(data);
    };
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- UI elements (crash-proof) ----------
const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const resetBtn = document.getElementById("resetBtn");
const statsEl = document.getElementById("stats");
const visitedOnlyEl = document.getElementById("visitedOnly");
const sortByEl = document.getElementById("sortBy");
const continentFilterEl = document.getElementById("continentFilter");
const undoBtn = document.getElementById("undoBtn");

const toggleNotesEl = document.getElementById("toggleNotes");       // may not exist
const toggleCompactEl = document.getElementById("toggleCompact");   // may not exist

// ---------- State ----------
let data = {}; // country -> {count, notes, updatedAt}
let query = "";
let undoStack = []; // { country, prev, next }
let collapsed = {}; // continent -> boolean

function now(){ return Date.now(); }
function norm(s){ return s.toLowerCase().replace(/’/g,"'"); }

function getEntry(country){
  const v = data[country];
  if (v && typeof v === "object") {
    return {
      count: Number(v.count || 0),
      notes: String(v.notes || ""),
      updatedAt: Number(v.updatedAt || 0)
    };
  }
  return { count: 0, notes: "", updatedAt: 0 };
}

async function setEntry(country, nextEntry, pushUndo=true){
  const prev = getEntry(country);
  data[country] = nextEntry;
  await dbSet(country, nextEntry);

  if (pushUndo) {
    undoStack.push({ country, prev, next: nextEntry });
    if (undoStack.length > 25) undoStack.shift();
    updateUndoBtn();
  }
}

function updateUndoBtn(){
  if (!undoBtn) return;
  undoBtn.disabled = undoStack.length === 0;
}

function computeStats(){
  let countriesVisited = 0;
  let totalTrips = 0;
  for (const c of COUNTRIES) {
    const e = getEntry(c);
    if (e.count > 0) countriesVisited += 1;
    totalTrips += e.count;
  }
  return { countriesVisited, totalTrips };
}

function compareBy(sortBy){
  if (sortBy === "most") {
    return (a,b) => getEntry(b).count - getEntry(a).count || a.localeCompare(b);
  }
  if (sortBy === "recent") {
    return (a,b) => getEntry(b).updatedAt - getEntry(a).updatedAt || a.localeCompare(b);
  }
  return (a,b) => a.localeCompare(b);
}

function buildFilteredGroups(){
  const q = norm(query.trim());
  const visitedOnly = !!visitedOnlyEl?.checked;
  const continentFilter = continentFilterEl?.value || "All";
  const sortBy = sortByEl?.value || "alpha";

  const items = COUNTRIES.filter(c => {
    if (q && !norm(c).includes(q)) return false;
    const e = getEntry(c);
    if (visitedOnly && e.count <= 0) return false;
    const cont = continentOf(c);
    if (continentFilter !== "All" && cont !== continentFilter) return false;
    return true;
  });

  const groups = {};
  for (const c of items) {
    const cont = continentOf(c);
    (groups[cont] ||= []).push(c);
  }

  const cmp = compareBy(sortBy);
  for (const cont of Object.keys(groups)) groups[cont].sort(cmp);

  return groups;
}

function render(){
  // Stats
  if (statsEl) {
    const { countriesVisited, totalTrips } = computeStats();
    statsEl.textContent = `Countries visited: ${countriesVisited} • Total trips: ${totalTrips}`;
  }

  if (!listEl) return;

  const groups = buildFilteredGroups();
  listEl.innerHTML = "";

  for (const cont of CONTINENTS) {
    const arr = groups[cont];
    if (!arr || arr.length === 0) continue;

    const group = document.createElement("section");
    group.className = "group";
    if (collapsed[cont]) group.classList.add("collapsed");

    const header = document.createElement("div");
    header.className = "groupHeader";

    const h2 = document.createElement("h2");
    h2.textContent = cont;

    // meta: visited count / total in this group
    let visitedInGroup = 0;
    let tripsInGroup = 0;
    for (const c of arr) {
      const e = getEntry(c);
      if (e.count > 0) visitedInGroup++;
      tripsInGroup += e.count;
    }
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${visitedInGroup}/${arr.length} visited • ${tripsInGroup} trips`;

    const chev = document.createElement("span");
    chev.className = "chev";
    chev.textContent = collapsed[cont] ? "▸" : "▾";

    header.appendChild(h2);
    header.appendChild(meta);
    header.appendChild(chev);

    header.addEventListener("click", () => {
      collapsed[cont] = !collapsed[cont];
      localStorage.setItem("collapsedContinents", JSON.stringify(collapsed));
      render();
    });

    const ul = document.createElement("ul");
    ul.className = "list";

    for (const c of arr) {
      const e = getEntry(c);

      const li = document.createElement("li");
      li.className = "item";

      const name = document.createElement("div");
      name.className = "country";
      name.textContent = c;

      const countBtn = document.createElement("button");
      countBtn.className = "countBtn";
      countBtn.textContent = String(e.count);
      countBtn.title = "Tap to edit number";
      countBtn.addEventListener("click", async () => {
        const current = getEntry(c).count;
        const input = prompt(`Set visit count for ${c}:`, String(current));
        if (input === null) return;
        const n = Math.max(0, Math.floor(Number(input)));
        if (!Number.isFinite(n)) return;
        await setEntry(c, { ...getEntry(c), count: n, updatedAt: now() }, true);
        render();
      });

      const minus = document.createElement("button");
      minus.className = "pill";
      minus.textContent = "−";
      minus.addEventListener("click", async () => {
        const cur = getEntry(c).count;
        const next = Math.max(0, cur - 1);
        await setEntry(c, { ...getEntry(c), count: next, updatedAt: now() }, true);
        render();
      });

      const plus = document.createElement("button");
      plus.className = "pill";
      plus.textContent = "+";
      plus.addEventListener("click", async () => {
        const cur = getEntry(c).count;
        const next = cur + 1;
        await setEntry(c, { ...getEntry(c), count: next, updatedAt: now() }, true);
        render();
      });

      li.appendChild(name);
      li.appendChild(countBtn);
      li.appendChild(minus);
      li.appendChild(plus);

      // Notes row (hidden unless Show Notes enabled via CSS class)
      const notesRow = document.createElement("div");
      notesRow.className = "notesRow";

      const notes = document.createElement("textarea");
      notes.className = "notes";
      notes.placeholder = "Notes (cities, dates, memories)…";
      notes.value = e.notes || "";

      const updated = document.createElement("div");
      updated.className = "smallMuted";
      updated.textContent = e.updatedAt ? `Updated: ${new Date(e.updatedAt).toLocaleDateString()}` : "";

      let noteSaveTimer = null;
      notes.addEventListener("input", () => {
        if (noteSaveTimer) clearTimeout(noteSaveTimer);
        noteSaveTimer = setTimeout(async () => {
          const current = getEntry(c);
          await setEntry(c, { ...current, notes: notes.value, updatedAt: now() }, true);
          render();
        }, 350);
      });

      notesRow.appendChild(notes);
      notesRow.appendChild(updated);
      li.appendChild(notesRow);

      ul.appendChild(li);
    }

    group.appendChild(header);
    group.appendChild(ul);
    listEl.appendChild(group);
  }
}

// ---------- Preferences ----------
function loadPrefs(){
  // collapsed continents
  try {
    collapsed = JSON.parse(localStorage.getItem("collapsedContinents") || "{}") || {};
  } catch { collapsed = {}; }

  // compact mode
  const compact = localStorage.getItem("compactMode") === "1";
  document.body.classList.toggle("compact", compact);
  if (toggleCompactEl) toggleCompactEl.checked = compact;

  // notes
  const showNotes = localStorage.getItem("showNotes") === "1";
  document.body.classList.toggle("notesHidden", !showNotes);
  if (toggleNotesEl) toggleNotesEl.checked = showNotes;
}

// ---------- Events ----------
if (searchEl) searchEl.addEventListener("input", (e) => { query = e.target.value; render(); });
if (visitedOnlyEl) visitedOnlyEl.addEventListener("change", render);
if (sortByEl) sortByEl.addEventListener("change", render);
if (continentFilterEl) continentFilterEl.addEventListener("change", render);

if (undoBtn) {
  undoBtn.addEventListener("click", async () => {
    const last = undoStack.pop();
    updateUndoBtn();
    if (!last) return;
    data[last.country] = last.prev;
    await dbSet(last.country, last.prev);
    render();
  });
}

if (toggleCompactEl) {
  toggleCompactEl.addEventListener("change", () => {
    const on = toggleCompactEl.checked;
    document.body.classList.toggle("compact", on);
    localStorage.setItem("compactMode", on ? "1" : "0");
  });
}

if (toggleNotesEl) {
  toggleNotesEl.addEventListener("change", () => {
    const on = toggleNotesEl.checked;
    document.body.classList.toggle("notesHidden", !on);
    localStorage.setItem("showNotes", on ? "1" : "0");
  });
}

if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    const payload = {
      app: "CountriesVisited",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {}
    };
    for (const c of COUNTRIES) {
      const e = getEntry(c);
      if (e.count > 0 || (e.notes && e.notes.trim())) payload.data[c] = e;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "countries-visited-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });
}

if (importFile) {
  importFile.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      // Import v1 format (counts) or v2 format (data)
      if (payload?.version === 1 && payload?.counts) {
        for (const [country, count] of Object.entries(payload.counts)) {
          const n = Math.max(0, Math.floor(Number(count || 0)));
          data[country] = { count: n, notes: "", updatedAt: now() };
          await dbSet(country, data[country]);
        }
      } else {
        const incoming = payload?.data || payload?.counts || {};
        for (const [country, raw] of Object.entries(incoming)) {
          if (typeof raw === "number") {
            const n = Math.max(0, Math.floor(Number(raw || 0)));
            data[country] = { count: n, notes: "", updatedAt: now() };
          } else {
            const n = Math.max(0, Math.floor(Number(raw?.count || 0)));
            const notes = String(raw?.notes || "");
            const updatedAt = Number(raw?.updatedAt || now());
            data[country] = { count: n, notes, updatedAt };
          }
          await dbSet(country, data[country]);
        }
      }

      undoStack = [];
      updateUndoBtn();
      render();

      e.target.value = "";
      alert("Import complete.");
    } catch (err) {
      alert("Import failed: " + err);
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    if (!confirm("Reset all counts and notes?")) return;
    data = {};
    undoStack = [];
    updateUndoBtn();
    await dbClear();
    render();
  });
}

// ---- init ----
(function initContinentsDropdown(){
  // Fill continent filter options if they exist and only has "All"
  if (!continentFilterEl) return;
  const existing = new Set([...continentFilterEl.options].map(o => o.value));
  for (const cont of CONTINENTS) {
    if (existing.has(cont)) continue;
    const opt = document.createElement("option");
    opt.value = cont;
    opt.textContent = cont;
    continentFilterEl.appendChild(opt);
  }
})();

(async function init(){
  loadPrefs();
  data = await dbGetAll();
  updateUndoBtn();
  render();
})();
