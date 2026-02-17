// Countries Visited v2 (offline, IndexedDB)
// Data per country: { count: number, notes: string, updatedAt: number }

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

// --- Continents mapping (covers the list above; anything missing becomes "Other") ---
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
  if (EUROPE.has(country)) return "Europe";
  if (ASIA.has(country)) return "Asia";
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
      // v1 store was "counts" (numbers). v2 store is "countries_v2" (objects).
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

// ---------- UI ----------
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
const toggleNotesEl = document.getElementById("toggleNotes");
const toggleCompactEl = document.getElementById("toggleCompact");

let data = {}; // country -> {count, notes, updatedAt}
let query = "";
let undoStack = []; // { country, prev, next }

let collapsed = {}; // continent -> boolean

function loadPrefs() {
  try {
    collapsed = JSON.parse(localStorage.getItem("collapsedContinents") || "{}") || {};
  } catch { collapsed = {}; }

  const compact = localStorage.getItem("compactMode") === "1";
  toggleCompactEl.checked = compact;
  document.body.classList.toggle("compact", compact);

  // notes toggle (if you already added it earlier)
  const showNotes = localStorage.getItem("showNotes") === "1";
  const toggleNotesEl = document.getElementById("toggleNotes");
  if (toggleNotesEl) toggleNotesEl.checked = showNotes;
  document.body.classList.toggle("notesHidden", !showNotes);
}

function saveCollapsed() {
  localStorage.setItem("collapsedContinents", JSON.stringify(collapsed));
}

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

function buildFilteredList(){
  const q = norm(query.trim());
  const visitedOnly = visitedOnlyEl.checked;
  const continentFilter = continentFilterEl.value;
  const sortBy = sortByEl.value;

  const items = COUNTRIES.filter(c => {
    if (q && !norm(c).includes(q)) return false;
    const e = getEntry(c);
    if (visitedOnly && e.count <= 0) return false;
    const cont = continentOf(c);
    if (continentFilter !== "All" && cont !== continentFilter) return false;
    return true;
  });

  // group by continent
  const groups = {};
  for (const c of items) {
    const cont = continentOf(c);
    groups[cont] = groups[cont] || [];
    groups[cont].push(c);
  }

  // sort each group
  const cmp = compareBy(sortBy);
  for (const cont of Object.keys(groups)) groups[cont].sort(cmp);

  return groups;
}

function render(){
  const { countriesVisited, totalTrips } = computeStats();
  statsEl.textContent = `Countries visited: ${countriesVisited} • Total trips: ${totalTrips}`;

  const groups = buildFilteredList();
  listEl.innerHTML = "";

  // show continents in a consistent order
  for (const cont of CONTINENTS) {
    const arr = groups[cont];
    if (!arr || arr.length === 0) continue;

    const group = document.createElement("section");
    group.className = "group";

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

    header.appendChild(h2);
    header.appendChild(meta);

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

      // Notes row
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

// ---- events ----
searchEl.addEventListener("input", (e) => { query = e.target.value; render(); });
visitedOnlyEl.addEventListener("change", render);
sortByEl.addEventListener("change", render);
continentFilterEl.addEventListener("change", render);
toggleNotesEl.addEventListener("change", () => {
  if (toggleNotesEl.checked) {
    document.body.classList.remove("notesHidden");
  } else {
    document.body.classList.add("notesHidden");
  }
});

undoBtn.addEventListener("click", async () => {
  const last = undoStack.pop();
  updateUndoBtn();
  if (!last) return;
  data[last.country] = last.prev;
  await dbSet(last.country, last.prev);
  render();
});

exportBtn.addEventListener("click", async () => {
  const payload = {
    app: "CountriesVisited",
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {}
  };
  // Export only countries that have count>0 or notes
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

importFile.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);

    // Support importing v1 format too (counts object)
    if (payload?.version === 1 && payload?.counts) {
      for (const [country, count] of Object.entries(payload.counts)) {
        const n = Math.max(0, Math.floor(Number(count || 0)));
        await setEntry(country, { count: n, notes: "", updatedAt: now() }, false);
      }
    } else {
      const incoming = payload?.data || payload?.counts || {};
      for (const [country, raw] of Object.entries(incoming)) {
        if (typeof raw === "number") {
          const n = Math.max(0, Math.floor(Number(raw || 0)));
          await setEntry(country, { count: n, notes: "", updatedAt: now() }, false);
        } else {
          const n = Math.max(0, Math.floor(Number(raw?.count || 0)));
          const notes = String(raw?.notes || "");
          const updatedAt = Number(raw?.updatedAt || now());
          await setEntry(country, { count: n, notes, updatedAt }, false);
        }
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

resetBtn.addEventListener("click", async () => {
  if (!confirm("Reset all counts and notes?")) return;
  data = {};
  undoStack = [];
  updateUndoBtn();
  await dbClear();
  render();
});

// ---- init ----
(function initFilters(){
  // fill continent dropdown
  for (const cont of CONTINENTS) {
    const opt = document.createElement("option");
    opt.value = cont;
    opt.textContent = cont;
    continentFilterEl.appendChild(opt);
  }
})();

(async function init(){
  data = await dbGetAll();
  updateUndoBtn();
  render();
  // Hide notes by default
  document.body.classList.add("notesHidden");
})();
