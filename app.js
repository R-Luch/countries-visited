// Countries Visited (offline) - no external dependencies.
// Stores counts in IndexedDB so it works offline.

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

// ---------- IndexedDB tiny helper ----------
const DB_NAME = "countries_visited_db";
const STORE = "counts";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
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
      if (cur) {
        data[cur.key] = cur.value;
        cur.continue();
      } else resolve(data);
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

// ---------- App ----------
const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const resetBtn = document.getElementById("resetBtn");

let counts = {};
let query = "";

function norm(s){ return s.toLowerCase().replace(/’/g,"'"); }

function render() {
  const q = norm(query.trim());
  const filtered = COUNTRIES.filter(c => norm(c).includes(q));
  listEl.innerHTML = "";

  for (const c of filtered) {
    const n = Number(counts[c] || 0);

    const li = document.createElement("li");
    li.className = "item";

    const name = document.createElement("div");
    name.className = "country";
    name.textContent = c;

    const count = document.createElement("div");
    count.className = "count";
    count.textContent = n;

    const minus = document.createElement("button");
    minus.className = "pill minus";
    minus.textContent = "−";
    minus.addEventListener("click", async () => {
      const next = Math.max(0, Number(counts[c] || 0) - 1);
      counts[c] = next;
      await dbSet(c, next);
      render();
    });

    const plus = document.createElement("button");
    plus.className = "pill plus";
    plus.textContent = "+";
    plus.addEventListener("click", async () => {
      counts[c] = (Number(counts[c] || 0) + 1);
      await dbSet(c, counts[c]);
      render();
    });

    li.appendChild(name);
    li.appendChild(count);
    li.appendChild(minus);
    li.appendChild(plus);
    listEl.appendChild(li);
  }
}

searchEl.addEventListener("input", (e) => {
  query = e.target.value;
  render();
});

exportBtn.addEventListener("click", async () => {
  // Keep only visited countries in export for cleanliness
  const visited = {};
  for (const [k,v] of Object.entries(counts)) {
    const n = Number(v || 0);
    if (n > 0) visited[k] = n;
  }
  const payload = {
    app: "CountriesVisited",
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: visited
  };
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
    const incoming = payload?.counts || {};
    // Merge: imported counts overwrite existing for those keys
    for (const [k,v] of Object.entries(incoming)) {
      const n = Math.max(0, Number(v || 0));
      counts[k] = n;
      await dbSet(k, n);
    }
    render();
    e.target.value = "";
    alert("Import complete.");
  } catch (err) {
    alert("Import failed: " + err);
  }
});

resetBtn.addEventListener("click", async () => {
  if (!confirm("Reset all counts to 0?")) return;
  counts = {};
  await dbClear();
  render();
});

(async function init(){
  counts = await dbGetAll();
  render();
})();
