/* ============================================================
   Lumina ClassRecord — a simple score sheet for teachers
   Data model (localStorage):
   {
     activeSectionId: string|null,
     sections: [{
       id, name,
       pupils: [{ id, name }],
       assessments: [{ id, name, max }],
       scores: { "<pupilId>|<assessmentId>": number }
     }]
   }
   ============================================================ */

const STORAGE_KEY = "lumina-classrecord-v1";

let state; // initialized at the bottom of this file, after all declarations

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const st = JSON.parse(raw);
      migrate(st);
      return st;
    }
  } catch (e) { /* corrupted -> start fresh */ }
  return seedState();
}

/* ---------- Sample class lists ---------- */
const SEED_VERSION = 3;

const SAMPLE_SECTIONS = [
  {
    name: "Grade 6 – Balintawak (Class E)",
    males: [
      "BANDE, ANGELO L.", "BAYANA, FRENZ ROFFERT E.", "BESINAN, MARK ANDREW D.",
      "CAMPOMANES, JHUNMAR C.", "CASADO, ENRIQUE SEAN D.", "DARVIN, ELIJU JOSEPH C.",
      "DIAMANTE, HARLEIGH P.", "DORDINES, MARCK LOURENCE", "ENTERO, FRANZ ELLYSES T.",
      "JIMLANI, KADAFI J.", "MATALANDANG, JOHN REY S.", "ORLANES, EIZEL JAY M.",
      "PELAEZ, CARL NATHANIEL T.", "PEPITO, RICHARD M.", "REBAJA, ZYREN KARL O.",
      "RENTUAYA, AJ G.", "SAHISAN, KHAIRAN CARLOS", "SAMPAN, DAVE",
      "TABIGUE, JAY CHRISTOFF C.", "TABUNARES, LEONARD M.", "TAMPOS, FRANCIS EDRIAN S."
    ],
    females: [
      "ALIÑAR, REESE CZELEA MAXENE D.", "ARCAYNA, REANELLE B.", "BAON, JANELLE FAITH L.",
      "BORDIOS, DANICA G.", "CALUNZAG, AINELYN B.", "DANDOY, NIKKA L.",
      "DELA TORRE, ALLISON RUTH C.", "DOÑOS, SHAYNE B.", "ELLERA, JULIA L.",
      "FERNANDEZ, EDEN MAE O.", "LAGUNGAN, MAYRA JANE S.", "LANGUAY, SHAYNA MAE S.",
      "LESMIS, ASHLY CLOUDY C.", "MAMITES, RIENA VEILLE E.", "MONTEJO, IVAN MAE P.",
      "PALEN, KEINESSA MAE B.", "PINUELA, LYZA MAE A.", "RADIAMODA, ALMAIRAH",
      "SAJETARIOS, FRANCINE", "TABUNARES, ALLEAH KEN M.", "TEQUIN, GLENNIEL SHANE G.",
      "TERANTE, NORVIE O."
    ]
  },
  {
    name: "Grade 6 – Bataan (Class E) – English",
    males: [
      "ANUTA, JELORD C.", "ARAKAMA, KOBE D.", "BADAYOS, JHON KIRBY L.",
      "BADAYOS, KLENT L.", "CANAREZ, PRINCE RAMGEL R.", "DABAL, JHEEM KHYLE B.",
      "DEPILLO, RADGE M.", "DELA ROSA, JACOB J.", "EBNO, JASIM K.",
      "ELTAGONDE, JHON MARK P.", "EVARISTO, NOEL JHON G.", "GASULLA, JOHN PAOLO MARXELL",
      "LAGUNA, KARL ACHILLES B.", "MAGLACION, FRANCE RICHARD", "MILAGROSA, JAMES GABRIEL",
      "OANI, GERALD C.", "PANUGALING, LIAM B.", "PAUSANOS, NETHAN T.",
      "REFERENTE, RONALD JR.", "RUIZ, RUBEN JR. B.", "SAMPAN, JUNIE JR. D.",
      "SERENTAS, KAISER JHOMS", "SOLANI, JIMAR M.", "TEMARIO, JOHN ANTHONY",
      "TEMARIO, JHONY LI"
    ],
    females: [
      "ALAMBATIN, DELIGHT", "ASMAJIN, NURFISA W.", "AYENG, ALEXZA M.",
      "BACASMOT, MIA L.", "BALANSAG, RAMIELA MAE C.", "BUHAT, SHIENNE B.",
      "CAL, JENNY W.", "CORTEZ, MARIAN GAIL A.", "DIVINAGRACIA, DANIELLA G.",
      "ENGBINO, ABEGAIL M.", "GEBONE, GABRIELLE REIGN", "MONIZ, REVY D.",
      "PAGUNTALAN, LORRAINE D.", "PUGOSA, REYNALIN", "ROZALDO, SOPHIA E.",
      "SAGANG, FRANZAIN B.", "SAYRE, NUR CHLOE A.", "VILLAFUERTE, MARIAN JENNELL"
    ]
  },
  {
    name: "Grade 5 – Just (Class E)",
    males: [
      "ABELLA, XIAN JHON", "BAUDTO, JHONEL", "BELARMINO, ART ADRIAN",
      "BLANZA, RICKY JR.", "BULIG, CRISTIAN", "CABALUNA, VLADIMIR",
      "DIVINAGRACIA, ANGELO", "DULLANO, JOSHUA", "ELLERA, JOSHUA",
      "GARAY, CHRISTIAN KEITH", "LAURON, FRANCIS NYZAR", "LONGYAPON, KEAN",
      "LUNA, MAIDYZAR JUWILL", "MAMBULAO, MALVEN III", "MARABE, RAIVEN",
      "ORTUYO, LANCE", "PARAJES, JOHN CARL", "SALAZAR, FLINT TEREENCE",
      "VELOSO, JOHNDER", "VELOSO, JOHNMER", "VILLAMOR, ISMAEL"
    ],
    females: [
      "ACTUEL, NATALIA", "ALBISO, EHRIANA", "ALINGASA, SOPHIA",
      "ARASAIN, RARDJIA", "BANDE, ANGELICA", "CABALUNA, PRINCESS",
      "CENIZA, JUMIELA", "CERNA, REIGN STEFFY", "DE GUIA, BLANCHE MHERIE",
      "ERHAM, NORHANIFAH", "ESTAMPA, CHRISTIE KATE", "GANANCIAL, RUSSELSKY",
      "GIMO, SOFIA", "JIMLANI, PRIA KISHA", "LADJA, SITI PELMAH",
      "PACO, VIATRICE KATE", "PALCONIT, ELYSA MAE", "SANDALO, ZENOBIA",
      "TALIMA, CHESKA CHARSHIEL", "VERZOSA, SHANTAL", "VILLANUEVA, ALETHIA KARREN JOY"
    ]
  }
];

function buildSection(def) {
  return {
    id: uid(),
    name: def.name,
    pupils: [
      ...def.males.map(n => ({ id: uid(), name: n, g: "M" })),
      ...def.females.map(n => ({ id: uid(), name: n, g: "F" }))
    ],
    assessments: [],
    scores: {}
  };
}

function seedState() {
  const sections = SAMPLE_SECTIONS.map(buildSection);
  return { activeSectionId: sections[0].id, sections, seedVersion: SEED_VERSION };
}

/* Add newly-shipped sample sections to existing data (never re-adds
   ones the teacher deleted after this version). */
function migrate(st) {
  if (!Array.isArray(st.sections)) st.sections = [];
  if ((st.seedVersion || 1) < SEED_VERSION) {
    SAMPLE_SECTIONS.forEach(def => {
      if (!st.sections.some(s => s.name === def.name)) st.sections.push(buildSection(def));
    });
    st.seedVersion = SEED_VERSION;
    if (!st.activeSectionId && st.sections.length) st.activeSectionId = st.sections[0].id;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* Function declaration (hoisted) so seedState/load can use it safely */
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function activeSection() {
  return state.sections.find(s => s.id === state.activeSectionId) || null;
}

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

/* ---------------- Modal ---------------- */
const overlay = document.getElementById("modalOverlay");
const modalEl = document.getElementById("modal");

function openModal(html, onMount) {
  modalEl.innerHTML = html;
  overlay.hidden = false;
  if (onMount) onMount(modalEl);
  const first = modalEl.querySelector("input, textarea");
  if (first) { first.focus(); if (first.select) first.select(); }
}
function closeModal() { overlay.hidden = true; modalEl.innerHTML = ""; }
overlay.addEventListener("mousedown", e => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !overlay.hidden) closeModal(); });

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ================= Sections ================= */

function addSectionModal() {
  openModal(`
    <h3>New section</h3>
    <p class="modal-sub">e.g. "Grade 4 – Sampaguita" or "Section A (SY 2025–2026)"</p>
    <label>Section name</label>
    <input type="text" id="mSectionName" placeholder="Section name" />
    <div class="modal-actions">
      <button class="btn btn-sm" style="background:var(--border)" onclick="closeModal()">Cancel</button>
      <button class="btn btn-sm btn-primary" id="mOk">Create section</button>
    </div>
  `, (m) => {
    const doIt = () => {
      const name = m.querySelector("#mSectionName").value.trim();
      if (!name) return;
      const sec = { id: uid(), name, pupils: [], assessments: [], scores: {} };
      state.sections.push(sec);
      state.activeSectionId = sec.id;
      save(); closeModal(); render();
      toast(`Section "${name}" created — now add your pupils!`);
    };
    m.querySelector("#mOk").onclick = doIt;
    m.querySelector("#mSectionName").addEventListener("keydown", e => { if (e.key === "Enter") doIt(); });
  });
}

function renameSectionModal() {
  const sec = activeSection(); if (!sec) return;
  openModal(`
    <h3>Rename section</h3>
    <label>Section name</label>
    <input type="text" id="mName" value="${escapeHtml(sec.name)}" />
    <div class="modal-actions">
      <button class="btn btn-sm btn-danger-outline spacer" id="mDel">Delete section</button>
      <button class="btn btn-sm" style="background:var(--border)" onclick="closeModal()">Cancel</button>
      <button class="btn btn-sm btn-primary" id="mOk">Save</button>
    </div>
  `, (m) => {
    const doIt = () => {
      const name = m.querySelector("#mName").value.trim();
      if (!name) return;
      sec.name = name; save(); closeModal(); render();
    };
    m.querySelector("#mOk").onclick = doIt;
    m.querySelector("#mName").addEventListener("keydown", e => { if (e.key === "Enter") doIt(); });
    m.querySelector("#mDel").onclick = () => {
      if (!confirm(`Delete section "${sec.name}" and ALL its pupils & scores? This cannot be undone.`)) return;
      state.sections = state.sections.filter(s => s.id !== sec.id);
      state.activeSectionId = state.sections[0]?.id || null;
      save(); closeModal(); render();
      toast("Section deleted.");
    };
  });
}

/* ================= Pupils ================= */

function addPupilsModal() {
  const sec = activeSection(); if (!sec) return;
  openModal(`
    <h3>Add pupils</h3>
    <p class="modal-sub">Type or paste names — <b>one pupil per line</b>. You can paste the whole class list at once.</p>
    <label>Group</label>
    <select id="mGroup" class="modal-select">
      <option value="M">Male</option>
      <option value="F">Female</option>
      <option value="">No group</option>
    </select>
    <label>Pupil names</label>
    <textarea id="mNames" placeholder="Dela Cruz, Juan&#10;Reyes, Maria&#10;Santos, Pedro"></textarea>
    <div class="modal-actions">
      <button class="btn btn-sm" style="background:var(--border)" onclick="closeModal()">Cancel</button>
      <button class="btn btn-sm btn-primary" id="mOk">Add pupils</button>
    </div>
  `, (m) => {
    m.querySelector("#mOk").onclick = () => {
      const names = m.querySelector("#mNames").value
        .split("\n").map(n => n.trim()).filter(Boolean);
      if (!names.length) return;
      const g = m.querySelector("#mGroup").value || undefined;
      names.forEach(n => sec.pupils.push({ id: uid(), name: n, ...(g ? { g } : {}) }));
      save(); closeModal(); render();
      toast(`${names.length} pupil${names.length > 1 ? "s" : ""} added.`);
    };
  });
}

function renamePupil(pupilId) {
  const sec = activeSection(); if (!sec) return;
  const p = sec.pupils.find(x => x.id === pupilId); if (!p) return;
  const name = prompt("Edit pupil name:", p.name);
  if (name === null) return;
  if (name.trim()) { p.name = name.trim(); save(); render(); }
}

function deletePupil(pupilId) {
  const sec = activeSection(); if (!sec) return;
  const p = sec.pupils.find(x => x.id === pupilId); if (!p) return;
  if (!confirm(`Remove "${p.name}" and their scores?`)) return;
  sec.pupils = sec.pupils.filter(x => x.id !== pupilId);
  Object.keys(sec.scores).forEach(k => { if (k.startsWith(pupilId + "|")) delete sec.scores[k]; });
  save(); render();
}

const GROUP_LABEL = { M: "MALE", F: "FEMALE" };
const groupOrder = g => (g === "M" ? 0 : g === "F" ? 1 : 2);

function sortPupils() {
  const sec = activeSection(); if (!sec) return;
  sec.pupils.sort((a, b) =>
    groupOrder(a.g) - groupOrder(b.g) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  save(); render();
  toast("Pupils sorted A–Z (within each group).");
}

/* ================= Assessments ================= */

function assessmentModal(assessId) {
  const sec = activeSection(); if (!sec) return;
  const a = assessId ? sec.assessments.find(x => x.id === assessId) : null;
  openModal(`
    <h3>${a ? "Edit assessment" : "New assessment"}</h3>
    <p class="modal-sub">e.g. "Quiz 1", "Long Test", "Periodical Exam"</p>
    <label>Assessment name</label>
    <input type="text" id="mAName" value="${a ? escapeHtml(a.name) : ""}" placeholder="Quiz 1" />
    <label>Highest possible score</label>
    <input type="number" id="mAMax" value="${a ? a.max : ""}" placeholder="20" min="1" />
    <div class="modal-actions">
      ${a ? `<button class="btn btn-sm btn-danger-outline spacer" id="mDel">Delete</button>` : ""}
      <button class="btn btn-sm" style="background:var(--border)" onclick="closeModal()">Cancel</button>
      <button class="btn btn-sm btn-primary" id="mOk">${a ? "Save" : "Add assessment"}</button>
    </div>
  `, (m) => {
    const doIt = () => {
      const name = m.querySelector("#mAName").value.trim();
      const max = parseFloat(m.querySelector("#mAMax").value);
      if (!name || !(max > 0)) { toast("Please enter a name and a valid highest score."); return; }
      if (a) { a.name = name; a.max = max; }
      else sec.assessments.push({ id: uid(), name, max });
      save(); closeModal(); render();
    };
    m.querySelector("#mOk").onclick = doIt;
    m.querySelectorAll("input").forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") doIt(); }));
    if (a) m.querySelector("#mDel").onclick = () => {
      if (!confirm(`Delete "${a.name}" and all its scores?`)) return;
      sec.assessments = sec.assessments.filter(x => x.id !== a.id);
      Object.keys(sec.scores).forEach(k => { if (k.endsWith("|" + a.id)) delete sec.scores[k]; });
      save(); closeModal(); render();
    };
  });
}

/* ================= Scores ================= */

function setScore(pupilId, assessId, value) {
  const sec = activeSection(); if (!sec) return;
  const key = pupilId + "|" + assessId;
  if (value === "" || value === null) delete sec.scores[key];
  else {
    const n = parseFloat(value);
    if (isNaN(n)) delete sec.scores[key];
    else sec.scores[key] = n;
  }
  save();
  updateComputedCells();
}

function getScore(sec, pupilId, assessId) {
  const v = sec.scores[pupilId + "|" + assessId];
  return (v === undefined || v === null) ? null : v;
}

/* Recompute totals / percentages / averages without a full re-render
   (so typing stays smooth and focus is preserved). */
function updateComputedCells() {
  const sec = activeSection(); if (!sec) return;
  const maxTotal = sec.assessments.reduce((s, a) => s + a.max, 0);

  sec.pupils.forEach(p => {
    let total = 0, has = false;
    sec.assessments.forEach(a => {
      const v = getScore(sec, p.id, a.id);
      if (v !== null) { total += v; has = true; }
    });
    const tCell = document.getElementById("total-" + p.id);
    const pCell = document.getElementById("pct-" + p.id);
    if (tCell) tCell.textContent = has ? fmt(total) : "–";
    if (pCell) {
      if (has && maxTotal > 0) {
        const pct = (total / maxTotal) * 100;
        pCell.textContent = pct.toFixed(1) + "%";
        pCell.className = "pct-cell " + (pct < 75 ? "pct-low" : "pct-ok");
      } else { pCell.textContent = "–"; pCell.className = "pct-cell"; }
    }
  });

  sec.assessments.forEach(a => {
    const vals = sec.pupils.map(p => getScore(sec, p.id, a.id)).filter(v => v !== null);
    const cell = document.getElementById("avg-" + a.id);
    if (cell) cell.textContent = vals.length ? fmt(vals.reduce((s, v) => s + v, 0) / vals.length) : "–";
  });

  // validate over-max highlight
  document.querySelectorAll("input.score").forEach(inp => {
    const max = parseFloat(inp.dataset.max);
    const v = parseFloat(inp.value);
    inp.classList.toggle("over", !isNaN(v) && v > max);
  });
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

/* ================= Export ================= */

function sectionToAOA(sec) {
  const header = ["No.", "Pupil Name", ...sec.assessments.map(a => `${a.name} (${a.max})`), "Total", "Percentage"];
  const maxTotal = sec.assessments.reduce((s, a) => s + a.max, 0);
  const rows = [];
  let lastG, groupNum = 0;
  sec.pupils.forEach(p => {
    if (p.g && p.g !== lastG) {
      rows.push([GROUP_LABEL[p.g] || "", "", ...sec.assessments.map(() => ""), "", ""]);
      groupNum = 0;
    }
    lastG = p.g;
    groupNum++;
    let total = 0, has = false;
    const cells = sec.assessments.map(a => {
      const v = getScore(sec, p.id, a.id);
      if (v !== null) { total += v; has = true; return v; }
      return "";
    });
    const pct = has && maxTotal > 0 ? Number(((total / maxTotal) * 100).toFixed(1)) : "";
    rows.push([groupNum, p.name, ...cells, has ? total : "", pct]);
  });
  return [header, ...rows];
}

function safeSheetName(name) {
  return name.replace(/[\\\/\?\*\[\]:]/g, "-").slice(0, 31) || "Sheet";
}

function exportXLSX(all) {
  const wb = XLSX.utils.book_new();
  const sections = all ? state.sections : [activeSection()].filter(Boolean);
  if (!sections.length || sections.every(s => !s.pupils.length)) { toast("Nothing to export yet."); return; }
  sections.forEach(sec => {
    const ws = XLSX.utils.aoa_to_sheet(sectionToAOA(sec));
    ws["!cols"] = [{ wch: 5 }, { wch: 28 }, ...sec.assessments.map(() => ({ wch: 12 })), { wch: 9 }, { wch: 11 }];
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(sec.name));
  });
  const fname = all
    ? `Class Records ${new Date().toISOString().slice(0, 10)}.xlsx`
    : `${sections[0].name} - Scores ${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
  toast("Excel file downloaded ✔");
}

function exportCSV() {
  const sec = activeSection();
  if (!sec || !sec.pupils.length) { toast("Nothing to export yet."); return; }
  const aoa = sectionToAOA(sec);
  const csv = aoa.map(row =>
    row.map(cell => {
      const s = String(cell ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")
  ).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${sec.name} - Scores ${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("CSV file downloaded ✔");
}

/* ================= Backup / Restore ================= */

function backupJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `classrecord-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Backup downloaded — keep it safe!");
}

function restoreJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.sections)) throw new Error("bad format");
      if (!confirm("Restoring will replace the data currently in this browser. Continue?")) return;
      state = data;
      save(); render();
      toast("Backup restored ✔");
    } catch (e) {
      toast("That file doesn't look like a ClassRecord backup.");
    }
  };
  reader.readAsText(file);
}

/* ================= Quick score entry (phone-friendly) ================= */

function encodeScores() {
  const sec = activeSection(); if (!sec) return;
  if (!sec.pupils.length) { addPupilsModal(); return; }
  if (!sec.assessments.length) { assessmentModal(); return; }
  if (sec.assessments.length === 1) return openQuickEntry(sec.assessments[0].id);
  openModal(`
    <h3>Encode scores</h3>
    <p class="modal-sub">Which assessment do you want to encode?</p>
    <div class="choose-list">
      ${sec.assessments.map(a => `
        <button class="choose-item" onclick="closeModal(); openQuickEntry('${a.id}')">
          ${escapeHtml(a.name)} <span>max ${fmt(a.max)}</span>
        </button>`).join("")}
    </div>
    <div class="modal-actions">
      <button class="btn btn-sm" style="background:var(--border)" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function openQuickEntry(assessId) {
  const sec = activeSection(); if (!sec) return;
  const a = sec.assessments.find(x => x.id === assessId); if (!a) return;
  const qe = document.getElementById("quickEntry");

  qe.innerHTML = `
    <div class="qe-head">
      <button class="qe-close" onclick="closeQuickEntry()" aria-label="Close">✕</button>
      <div>
        <div class="qe-title">${escapeHtml(a.name)}</div>
        <div class="qe-sub">${escapeHtml(sec.name)} · highest score: ${fmt(a.max)}</div>
      </div>
      <div class="qe-progress" id="qeProgress">0 / ${sec.pupils.length}</div>
    </div>
    <div class="qe-list">
      ${(() => {
        let lastG, groupNum = 0;
        return sec.pupils.map((p, i) => {
          let hdr = "";
          if (p.g && p.g !== lastG) {
            hdr = `<div class="qe-group">${GROUP_LABEL[p.g] || ""}</div>`;
            groupNum = 0;
          }
          lastG = p.g;
          groupNum++;
          const v = getScore(sec, p.id, a.id);
          return hdr + `
        <label class="qe-row">
          <span class="qe-num">${groupNum}</span>
          <span class="qe-name">${escapeHtml(p.name)}</span>
          <input class="qe-input" type="number" inputmode="decimal" enterkeyhint="next"
            data-pupil="${p.id}" data-idx="${i}" data-max="${a.max}"
            value="${v === null ? "" : v}" placeholder="–" />
        </label>`;
        }).join("");
      })()}
    </div>
    <div class="qe-foot">
      <button class="btn btn-primary" onclick="closeQuickEntry()">Done ✔</button>
    </div>`;

  qe.hidden = false;
  document.body.classList.add("no-scroll");

  const inputs = qe.querySelectorAll(".qe-input");
  const refresh = () => {
    let n = 0;
    inputs.forEach(inp => {
      const v = parseFloat(inp.value);
      if (inp.value !== "" && !isNaN(v)) n++;
      inp.classList.toggle("over", !isNaN(v) && v > a.max);
    });
    document.getElementById("qeProgress").textContent = `${n} / ${sec.pupils.length}`;
  };

  inputs.forEach(inp => {
    inp.addEventListener("input", () => {
      setScore(inp.dataset.pupil, assessId, inp.value);
      refresh();
    });
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const next = qe.querySelector(`.qe-input[data-idx="${+inp.dataset.idx + 1}"]`);
        if (next) {
          next.focus(); next.select();
          next.scrollIntoView({ block: "center", behavior: "smooth" });
        } else { inp.blur(); toast("Last pupil reached — all done? Tap Done ✔"); }
      }
    });
  });

  refresh();
  const firstEmpty = [...inputs].find(i => i.value === "") || inputs[0];
  if (firstEmpty) setTimeout(() => firstEmpty.focus(), 60);
}

function closeQuickEntry() {
  const qe = document.getElementById("quickEntry");
  qe.hidden = true;
  qe.innerHTML = "";
  document.body.classList.remove("no-scroll");
  render();
}

/* ================= Mobile drawer ================= */

function openDrawer() {
  document.querySelector(".sidebar").classList.add("open");
  document.getElementById("drawerOverlay").hidden = false;
}
function closeDrawer() {
  document.querySelector(".sidebar").classList.remove("open");
  document.getElementById("drawerOverlay").hidden = true;
}

/* ================= Rendering ================= */

function render() {
  renderSidebar();
  renderMain();
  const sec = activeSection();
  document.getElementById("topbarTitle").textContent = sec ? sec.name : "Lumina ClassRecord";
}

function renderSidebar() {
  const ul = document.getElementById("sectionList");
  ul.innerHTML = "";
  if (!state.sections.length) {
    ul.innerHTML = `<li style="padding:8px 10px;font-size:13px;color:#7d88ad">No sections yet.<br/>Click ＋ to add one.</li>`;
    return;
  }
  state.sections.forEach(sec => {
    const li = document.createElement("li");
    li.className = "section-item" + (sec.id === state.activeSectionId ? " active" : "");
    li.innerHTML = `<span>🏫</span><span>${escapeHtml(sec.name)}</span><span class="count">${sec.pupils.length}</span>`;
    li.onclick = () => { state.activeSectionId = sec.id; save(); render(); closeDrawer(); };
    ul.appendChild(li);
  });
}

function renderMain() {
  const main = document.getElementById("main");
  const sec = activeSection();

  if (!sec) {
    main.innerHTML = `
      <div class="empty-state">
        <div class="big">🍎</div>
        <h2>Welcome, Teacher!</h2>
        <p>Start by creating a <b>section</b> for this school year, then add your pupils' names and record their scores. When you're done, export everything to <b>Excel</b> for the official school records.</p>
        <button class="btn btn-primary" onclick="addSectionModal()">＋ Create your first section</button>
      </div>`;
    return;
  }

  const nPupils = sec.pupils.length;
  const nAssess = sec.assessments.length;
  const maxTotal = sec.assessments.reduce((s, a) => s + a.max, 0);
  const scored = Object.keys(sec.scores).length;
  const totalCells = nPupils * nAssess;

  let tableHtml;
  if (!nPupils) {
    tableHtml = `
      <div class="empty-table">
        <div class="big">🧑‍🎓</div>
        <p>No pupils in this section yet.<br/>You can paste the whole class list at once — one name per line.</p>
        <button class="btn btn-primary" onclick="addPupilsModal()">＋ Add pupils</button>
      </div>`;
  } else {
    const headCols = sec.assessments.map(a => `
      <th><span class="assess-head" onclick="assessmentModal('${a.id}')" title="Click to edit">
        <span class="a-name">${escapeHtml(a.name)}</span>
        <span class="a-max">max ${fmt(a.max)}</span>
      </span></th>`).join("");

    const totalCols = 4 + sec.assessments.length;
    let lastG, groupNum = 0;
    const bodyRows = sec.pupils.map((p, i) => {
      let groupHeader = "";
      if (p.g && p.g !== lastG) {
        groupHeader = `<tr class="group-row"><td colspan="${totalCols}">${GROUP_LABEL[p.g] || ""}</td></tr>`;
        groupNum = 0;
      }
      lastG = p.g;
      groupNum++;
      const cells = sec.assessments.map(a => {
        const v = getScore(sec, p.id, a.id);
        return `<td><input class="score" type="number" inputmode="decimal" enterkeyhint="next"
          data-pupil="${p.id}" data-assess="${a.id}" data-max="${a.max}" data-row="${i}"
          value="${v === null ? "" : v}" placeholder="·" /></td>`;
      }).join("");
      return groupHeader + `<tr>
        <td class="num-col">${groupNum}</td>
        <td class="name-cell"><span class="name-wrap">
          <span class="pupil-name" title="Click to edit" onclick="renamePupil('${p.id}')">${escapeHtml(p.name)}</span>
          <button class="row-del" title="Remove pupil" onclick="deletePupil('${p.id}')">✕</button>
        </span></td>
        ${cells}
        <td class="total-cell" id="total-${p.id}">–</td>
        <td class="pct-cell" id="pct-${p.id}">–</td>
      </tr>`;
    }).join("");

    const footCols = sec.assessments.map(a => `<td id="avg-${a.id}">–</td>`).join("");

    tableHtml = `
      <table class="grid">
        <thead><tr>
          <th style="width:40px">#</th>
          <th class="name-col">Pupil Name</th>
          ${headCols}
          <th>Total${maxTotal ? `<div class="a-max" style="font-weight:500;color:var(--ink-faint)">of ${fmt(maxTotal)}</div>` : ""}</th>
          <th>%</th>
        </tr></thead>
        <tbody>${bodyRows}</tbody>
        <tfoot><tr>
          <td></td><td class="name-cell">Class average</td>${footCols}<td></td><td></td>
        </tr></tfoot>
      </table>`;
  }

  main.innerHTML = `
    <div class="page-head">
      <div>
        <h2>${escapeHtml(sec.name)} <button class="btn-icon" style="background:var(--primary-soft);color:var(--primary)" title="Rename / delete section" onclick="renameSectionModal()">✎</button></h2>
        <div class="sub">Click any cell to type a score · press <b>Enter</b> to jump to the next pupil</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-sm btn-primary" onclick="encodeScores()">📝 Encode scores</button>
        <button class="btn btn-sm btn-outline" onclick="addPupilsModal()">＋ Pupils</button>
        <button class="btn btn-sm btn-outline" onclick="assessmentModal()">＋ Assessment</button>
        <button class="btn btn-sm btn-outline" onclick="sortPupils()">↕ Sort A–Z</button>
        <button class="btn btn-sm btn-accent" onclick="exportXLSX(false)">⬇ Excel</button>
        <button class="btn btn-sm btn-accent" onclick="exportCSV()">⬇ CSV</button>
      </div>
    </div>

    <div class="stat-cards">
      <div class="stat-card"><div class="num">${nPupils}</div><div class="lbl">Pupils</div></div>
      <div class="stat-card"><div class="num">${nAssess}</div><div class="lbl">Assessments</div></div>
      <div class="stat-card"><div class="num">${totalCells ? Math.round((scored / totalCells) * 100) + "%" : "–"}</div><div class="lbl">Scores encoded</div></div>
    </div>

    <div class="table-card">${tableHtml}</div>
  `;

  // wire score inputs
  main.querySelectorAll("input.score").forEach(inp => {
    inp.addEventListener("input", () => setScore(inp.dataset.pupil, inp.dataset.assess, inp.value));
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const dir = e.key === "ArrowUp" ? -1 : 1;
        const next = main.querySelector(
          `input.score[data-assess="${inp.dataset.assess}"][data-row="${+inp.dataset.row + dir}"]`
        );
        if (next) { next.focus(); next.select(); }
      }
    });
  });

  updateComputedCells();
}

/* ================= Wire up static buttons ================= */
document.getElementById("btnAddSection").onclick = addSectionModal;
document.getElementById("btnExportAll").onclick = () => exportXLSX(true);
document.getElementById("btnBackup").onclick = backupJSON;
document.getElementById("btnRestore").onclick = () => document.getElementById("fileRestore").click();
document.getElementById("fileRestore").addEventListener("change", e => {
  if (e.target.files[0]) restoreJSON(e.target.files[0]);
  e.target.value = "";
});
document.getElementById("btnDrawer").onclick = openDrawer;
document.getElementById("drawerOverlay").onclick = closeDrawer;

/* Offline support / installable app */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* offline mode unavailable */ });
}

state = load();
render();
