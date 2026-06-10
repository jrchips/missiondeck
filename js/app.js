/* ============================================================
   MissionDeck — app.js
   Single-file vanilla JS app. No build step, fully offline.
   ============================================================ */
(function () {
"use strict";

/* ---------------- helpers ---------------- */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const pad = n => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dateStrOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dtLocal = d => `${dateStrOf(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseDue = due => due ? new Date(due.length === 10 ? due + "T23:59" : due) : null;

function nextWeekday(dow, h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  let delta = (dow - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() < Date.now()) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}
function fmtDue(due) {
  const d = parseDue(due);
  if (!d) return "";
  const t = new Date(); t.setHours(0,0,0,0);
  const dd = new Date(d); dd.setHours(0,0,0,0);
  const diff = Math.round((dd - t) / 86400000);
  const time = (d.getHours() !== 23 || d.getMinutes() !== 59)
    ? " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  if (diff === 0) return "Today" + time;
  if (diff === 1) return "Tomorrow" + time;
  if (diff === -1) return "Yesterday" + time;
  if (diff > 1 && diff < 7) return d.toLocaleDateString([], { weekday: "short" }) + time;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + time;
}
function dueClass(t) {
  if (t.status === "done" || !t.due) return "";
  const d = parseDue(t.due);
  if (d < new Date()) return "overdue";
  if (dateStrOf(d) === todayStr()) return "due-today";
  return "";
}
function fmtMins(m) {
  m = Math.round(m || 0);
  if (!m) return "0m";
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60 ? (m % 60) + "m" : ""}`.trim() : `${m}m`;
}
function taskProgress(t) {
  if (!t.subtasks || !t.subtasks.length) return t.status === "done" ? 100 : 0;
  return Math.round(100 * t.subtasks.filter(s => s.done).length / t.subtasks.length);
}

/* ---------------- constants ---------------- */
const HORIZONS = [
  ["day", "Today / Day"], ["week", "This Week"], ["month", "This Month"],
  ["half", "6 Months"], ["year", "This Year"]
];
const HORIZON_NAME = Object.fromEntries(HORIZONS);
const STATUSES = [
  ["backlog", "Backlog"], ["todo", "To Do"], ["doing", "In Progress"], ["done", "Done"]
];
const STATUS_NAME = Object.fromEntries(STATUSES);
const PRIO_NAME = { high: "High", med: "Medium", low: "Low" };

const ICONS = {
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

/* ---------------- state / storage ---------------- */
const KEY = "missiondeck-v1";

function seedState() {
  const pSchool = uid(), pALS = uid(), pPersonal = uid(), pFinance = uid();
  const nbSchool = uid(), nbALS = uid(), nbPersonal = uid();
  const plus = days => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(17, 0, 0, 0); return d; };

  return {
    version: 1,
    settings: { theme: "dark", work: 25, short: 5, long: 15 },
    projects: [
      { id: pSchool,   name: "School — UMGC",            color: "#9B7EDE" },
      { id: pALS,      name: "American Lapidary School", color: "#2FD4BE" },
      { id: pPersonal, name: "Personal",                 color: "#F0A93C" },
      { id: pFinance,  name: "Finance",                  color: "#5CC97A" }
    ],
    tasks: [
      { id: uid(), title: "File Articles of Organization — Colorado LLC", projectId: pALS,
        priority: "high", horizon: "week", due: dtLocal(plus(5)), recur: "none", status: "todo",
        subtasks: [], notes: "$50 at sos.colorado.gov — instant online. First domino for everything else.",
        timeSpent: 0, createdAt: Date.now() },
      { id: uid(), title: "Get Federal EIN from IRS", projectId: pALS,
        priority: "high", horizon: "week", due: "", recur: "none", status: "todo",
        subtasks: [], notes: "Free at IRS.gov, same day. Needed for the business bank account.",
        timeSpent: 0, createdAt: Date.now() },
      { id: uid(), title: "Call Gallagher Business Park — 303-358-9333", projectId: pALS,
        priority: "med", horizon: "week", due: "", recur: "none", status: "todo",
        subtasks: [
          { id: uid(), text: "Ask about plumbing + ventilation modifications", done: false },
          { id: uid(), text: "Ask about 1,500–2,500 sq ft units", done: false },
          { id: uid(), text: "Get lease rate ($/sq ft NNN)", done: false }
        ],
        notes: "5725 E. 56th Ave, Commerce City. Primary facility lead.", timeSpent: 0, createdAt: Date.now() },
      { id: uid(), title: "Start DPOS school approval application", projectId: pALS,
        priority: "high", horizon: "month", due: "", recur: "none", status: "backlog",
        subtasks: [], notes: "Colorado Division of Private Occupational Schools. 60–120 days, ~$500–$1,000 fee. Cannot enroll students without it.",
        timeSpent: 0, createdAt: Date.now() },
      { id: uid(), title: "File BOI report with FinCEN", projectId: pALS,
        priority: "med", horizon: "month", due: "", recur: "none", status: "backlog",
        subtasks: [], notes: "Free. Due within 30 days of LLC formation.", timeSpent: 0, createdAt: Date.now() },
      { id: uid(), title: "Grow waitlist: 30 signups / 10 paid deposits", projectId: pALS,
        priority: "med", horizon: "half", due: "", recur: "none", status: "doing",
        subtasks: [
          { id: uid(), text: "Post in Colorado gem & mineral clubs", done: false },
          { id: uid(), text: "Email past opal customers", done: true },
          { id: uid(), text: "Landing page with $99 deposit", done: false }
        ],
        notes: "Proof of demand for the funding round.", timeSpent: 0, createdAt: Date.now() },
      { id: uid(), title: "Review Roth IRA contributions for the year", projectId: pFinance,
        priority: "low", horizon: "month", due: "", recur: "none", status: "backlog",
        subtasks: [], notes: "", timeSpent: 0, createdAt: Date.now() }
    ],
    notebooks: [
      { id: nbSchool, name: "School" },
      { id: nbALS, name: "Lapidary School" },
      { id: nbPersonal, name: "Personal" }
    ],
    notes: [
      { id: uid(), title: "Welcome to MissionDeck", notebookId: nbPersonal, tags: ["guide"],
        body: "# Quick start\n\n- **Tasks** — everything lives here. Group by time horizon (day, week, month, 6 months, year). Tap the mic button to add a task by voice.\n- **Board** — the same tasks as a Kanban board. Drag cards on desktop, use the arrows on your phone.\n- **Calendar** — tasks with due dates show up automatically. Use **Export .ics** to send them to your phone's calendar app.\n- **Notes** — markdown supported: `# heading`, `**bold**`, `*italic*`, `- lists`.\n- **Focus** — adjustable pomodoro. Link a session to a task and the time logs to that task's card.\n- **Break** — 2048 and Snake. You earned it.\n\nEverything saves automatically to this device and works offline.",
        createdAt: Date.now(), updatedAt: Date.now() },
      { id: uid(), title: "ALS launch numbers", notebookId: nbALS, tags: ["business", "finance"],
        body: "# Key figures\n\n- Cabochon Cutting: **$5,500** | margin 69.1% | $3,800 gross profit per student\n- Hand Carving: **$8,000** | margin 63.5%\n- Gem Faceting: **$9,800** | margin 63.8%\n- Studio membership: **$250/mo** — 20 members covers 100% of overhead\n- Break-even: **2 students per month**\n- Funding sought: $50k–$75k\n\n# Facility leads\n\n1. Gallagher Business Park — 5725 E. 56th Ave, Commerce City — 303-358-9333\n2. Denver Business Center — 10500 E. 56th Ave — from 857 sq ft at $1,140/mo NNN",
        createdAt: Date.now(), updatedAt: Date.now() }
    ],
    pomo: { sessions: [] },
    scores: { g2048: 0, snake: 0 }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupted or unavailable */ }
  const s = seedState();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
/* ---- Real UMGC schedule (from D2L calendar, Summer 2026) ---- */
const UMGC_2265 = [
  ["2026-06-09", [
    ["Unit 4 Assignment: Cloud-Based AI Platform Comparison", "high", ""],
    ["Unit 4 Assignment: Exploring Content Creation Using Generative AI", "high", ""],
    ["Unit 4 Assignment: Project Schedule Development with Microsoft Project", "high", ""],
    ["Unit 4 Discussion: Impact of Generative AI on Creative Industry Professions and Practices", "med", "Availability ends tonight 11:59 PM"],
    ["Unit 4 Discussion: Making the Case for AI: Metrics, Benefits, and Persuasion", "med", ""]
  ]],
  ["2026-06-16", [
    ["Unit 5 Assignment 1: AI-Enhanced Project Management System Design", "high", ""],
    ["Unit 5 Assignment 2: Case Study Analysis - AI-Driven Project Management Implementation", "high", ""],
    ["Unit 5 Assignment: Proposal for Unit 7 Project", "high", ""],
    ["Unit 5 Quiz: Comprehensive AI Data Management", "high", ""],
    ["Unit 5 Quiz", "high", ""]
  ]],
  ["2026-06-23", [
    ["Unit 6 Assignment: IS Project Risk Management Plan", "high", ""],
    ["Unit 6 Assignment: Making Sense of AI: Interpreting and Evaluating Language Intelligence", "high", ""],
    ["Unit 6 Quiz", "high", ""],
    ["Unit 6 Discussion: AI Project Risk Considerations", "med", ""]
  ]],
  ["2026-06-30", [
    ["Unit 7 Assignment: Risk Mitigation Effectiveness Evaluation", "high", ""],
    ["Unit 7 Assignment: Final Creative Project: Marketing Campaign Using Generative AI", "high", ""],
    ["Unit 7 Quiz: Domain-Specific AI Applications", "high", ""],
    ["Unit 7 Discussion: Domain Knowledge in AI Solutions", "med", "Availability ends Jul 7"],
    ["Unit 7 Discussion: Risk Management in Agile Project Environments", "med", ""]
  ]],
  ["2026-07-07", [
    ["Unit 8 Assignment: Comprehensive Project Management Framework Development", "high", ""],
    ["Unit 8 Assignment: Comprehensive AI Solution Development", "high", ""],
    ["Unit 8 Discussion: Current State and Future of LLMs and Generative AI", "med", ""],
    ["Unit 1 Discussion: AI in Everyday Life (availability ends)", "med", ""],
    ["Unit 3 Discussion: Ethical Dilemmas in AI Implementation (availability ends)", "med", ""],
    ["Unit 5 Discussion: Data Quality and AI Performance (availability ends)", "med", ""]
  ]]
];

function ensureUMGC(s) {
  s.flags = s.flags || {};
  if (s.flags.umgcSummer2026) return;
  let proj = s.projects.find(p => /umgc|school/i.test(p.name));
  if (!proj) {
    proj = { id: uid(), name: "School — UMGC", color: "#9B7EDE" };
    s.projects.push(proj);
  }
  const now = new Date(); now.setHours(0, 0, 0, 0);
  for (const [date, items] of UMGC_2265) {
    const dueDay = new Date(date + "T23:59");
    const diffDays = Math.round((new Date(date + "T00:00") - now) / 86400000);
    if (diffDays < -1) continue; // skip dates already past
    const horizon = diffDays <= 1 ? "day" : diffDays <= 7 ? "week" : "month";
    const status = diffDays <= 7 ? "todo" : "backlog";
    for (const [title, priority, note] of items) {
      s.tasks.push({
        id: uid(), title, projectId: proj.id, priority,
        horizon, due: dtLocal(dueDay), recur: "none", status,
        subtasks: [], notes: note || "From the UMGC D2L calendar.",
        timeSpent: 0, createdAt: Date.now(), completedAt: null
      });
    }
  }
  s.flags.umgcSummer2026 = true;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
}

let S = load();
ensureUMGC(S);
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast("Could not save — storage unavailable"); }
}

const UI = {
  view: "tasks", projFilter: "all", showDone: false,
  calMonth: new Date(), calSelected: todayStr(),
  noteSearch: "", openNoteId: null, notePreview: false,
  game: null
};

const projById = id => S.projects.find(p => p.id === id);

/* ---------------- theme ---------------- */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", S.settings.theme);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = S.settings.theme === "light" ? "#F2F4F7" : "#0F1318";
}

/* ---------------- toast / modal ---------------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
}
function openModal(html) {
  $("#modal").innerHTML = html;
  $("#modal-backdrop").classList.remove("hidden");
}
function closeModal() {
  $("#modal-backdrop").classList.add("hidden");
  $("#modal").innerHTML = "";
  stopVoice();
}

/* ---------------- downloads ---------------- */
function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
}

/* ============================================================
   TASKS
   ============================================================ */
function visibleTasks() {
  return S.tasks.filter(t =>
    (UI.projFilter === "all" || t.projectId === UI.projFilter) &&
    (UI.showDone || t.status !== "done")
  );
}
function sortTasks(arr) {
  const prioRank = { high: 0, med: 1, low: 2 };
  return arr.slice().sort((a, b) => {
    const da = a.due ? parseDue(a.due).getTime() : Infinity;
    const db = b.due ? parseDue(b.due).getTime() : Infinity;
    if (da !== db) return da - db;
    return (prioRank[a.priority] ?? 1) - (prioRank[b.priority] ?? 1);
  });
}

function taskMetaHTML(t, compact) {
  const p = projById(t.projectId);
  const bits = [];
  if (p) bits.push(`<span class="meta-bit"><span class="dot" style="background:${esc(p.color)}"></span>${esc(p.name)}</span>`);
  bits.push(`<span class="prio-flag prio-${t.priority}">${PRIO_NAME[t.priority] || "Medium"}</span>`);
  if (t.due) bits.push(`<span class="meta-bit ${dueClass(t)}">${ICONS.cal}${esc(fmtDue(t.due))}</span>`);
  if (t.recur && t.recur !== "none") bits.push(`<span class="meta-bit">${ICONS.repeat}${esc(t.recur)}</span>`);
  if (!compact && t.timeSpent) bits.push(`<span class="time-chip">${ICONS.clock}${fmtMins(t.timeSpent)}</span>`);
  return bits.join("");
}

function renderTasks() {
  const root = $("#view-tasks");
  const all = S.tasks;
  const now = new Date();
  const dueToday = all.filter(t => t.status !== "done" && t.due && dateStrOf(parseDue(t.due)) === todayStr()).length;
  const overdue = all.filter(t => t.status !== "done" && t.due && parseDue(t.due) < now && dateStrOf(parseDue(t.due)) !== todayStr()).length;
  const open = all.filter(t => t.status !== "done").length;

  const chips = [`<button class="chip ${UI.projFilter === "all" ? "on" : ""}" data-act="filter" data-id="all">All projects</button>`]
    .concat(S.projects.map(p =>
      `<button class="chip ${UI.projFilter === p.id ? "on" : ""}" data-act="filter" data-id="${p.id}"><span class="dot" style="background:${esc(p.color)}"></span>${esc(p.name)}</button>`))
    .concat(`<button class="chip ${UI.showDone ? "on" : ""}" data-act="toggledone">Show done</button>`);

  const tasks = visibleTasks();
  let groups = "";
  for (const [hKey, hName] of HORIZONS) {
    const inGroup = sortTasks(tasks.filter(t => (t.horizon || "day") === hKey));
    if (!inGroup.length) continue;
    groups += `<div class="horizon-group">
      <div class="horizon-head"><span class="horizon-name">${hName}</span><span class="horizon-count">${inGroup.length}</span></div>
      ${inGroup.map(taskRowHTML).join("")}
    </div>`;
  }
  if (!groups) groups = `<div class="empty"><strong>No tasks here.</strong><br>Tap <strong>+</strong> to add one, or the mic to speak one.</div>`;

  root.innerHTML = `
    <div class="view-head">
      <div class="eyebrow">Mission status</div>
      <div class="view-title">Tasks</div>
    </div>
    <div class="today-strip">
      <div class="stat-tile"><div class="stat-num ${overdue ? "bad" : ""}">${overdue}</div><div class="stat-label">Overdue</div></div>
      <div class="stat-tile"><div class="stat-num ${dueToday ? "warn" : ""}">${dueToday}</div><div class="stat-label">Due today</div></div>
      <div class="stat-tile"><div class="stat-num">${open}</div><div class="stat-label">Open tasks</div></div>
    </div>
    <div class="chip-row">${chips.join("")}</div>
    ${groups}`;
}

function taskRowHTML(t) {
  const done = t.status === "done";
  const prog = taskProgress(t);
  const hasSub = t.subtasks && t.subtasks.length;
  return `<div class="task-row ${done ? "done-row" : ""}" data-id="${t.id}">
    <button class="task-check ${done ? "checked" : ""}" data-act="toggle" aria-label="Mark complete">${ICONS.check}</button>
    <div class="task-main">
      <div class="task-title">${esc(t.title)}</div>
      <div class="task-meta">${taskMetaHTML(t)}</div>
      ${hasSub ? `
        <div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${prog}%"></div></div><span class="progress-pct">${prog}%</span></div>
        <div class="subtask-list">${t.subtasks.map(st => `
          <div class="subtask ${st.done ? "stdone" : ""}" data-sid="${st.id}">
            <button class="task-check ${st.done ? "checked" : ""}" data-act="subtoggle" aria-label="Toggle subtask">${ICONS.check}</button>
            <span>${esc(st.text)}</span>
          </div>`).join("")}
        </div>` : ""}
    </div>
    <div class="task-actions">
      <button class="icon-btn" data-act="edit" title="Edit">${ICONS.edit}</button>
      ${t.due ? `<button class="icon-btn" data-act="ics" title="Send to phone calendar (.ics)">${ICONS.cal}</button>` : ""}
      <button class="icon-btn" data-act="del" title="Delete">${ICONS.trash}</button>
    </div>
  </div>`;
}

function completeTask(t) {
  t.status = "done";
  t.completedAt = Date.now();
  if (t.subtasks) t.subtasks.forEach(s => s.done = true);
  if (t.recur && t.recur !== "none" && t.due) {
    const d = parseDue(t.due);
    if (t.recur === "daily") d.setDate(d.getDate() + 1);
    if (t.recur === "weekly") d.setDate(d.getDate() + 7);
    if (t.recur === "monthly") d.setMonth(d.getMonth() + 1);
    S.tasks.unshift({
      ...t, id: uid(), status: "todo", completedAt: null, due: dtLocal(d),
      timeSpent: 0, createdAt: Date.now(),
      subtasks: (t.subtasks || []).map(s => ({ id: uid(), text: s.text, done: false }))
    });
    toast(`Recurring — next one created for ${fmtDue(dtLocal(d))}`);
  } else {
    toast("Task complete");
  }
}

function handleTasksClick(e) {
  const chip = e.target.closest("[data-act='filter']");
  if (chip) { UI.projFilter = chip.dataset.id; renderTasks(); return; }
  if (e.target.closest("[data-act='toggledone']")) { UI.showDone = !UI.showDone; renderTasks(); return; }

  const row = e.target.closest(".task-row");
  if (!row) return;
  const t = S.tasks.find(x => x.id === row.dataset.id);
  if (!t) return;
  const act = e.target.closest("[data-act]");
  if (!act) return;

  switch (act.dataset.act) {
    case "toggle":
      if (t.status === "done") { t.status = "todo"; t.completedAt = null; }
      else completeTask(t);
      save(); renderTasks(); break;
    case "subtoggle": {
      const sid = e.target.closest(".subtask").dataset.sid;
      const st = t.subtasks.find(s => s.id === sid);
      if (st) st.done = !st.done;
      save(); renderTasks(); break;
    }
    case "edit": openTaskEditor(t); break;
    case "ics": exportICS([t]); break;
    case "del":
      if (confirm(`Delete "${t.title}"?`)) {
        S.tasks = S.tasks.filter(x => x.id !== t.id);
        save(); renderTasks(); renderBoard();
      }
      break;
  }
}

/* ---------------- task editor modal ---------------- */
function openTaskEditor(task, preset) {
  const t = task || {
    id: null, title: "", projectId: S.projects[0] ? S.projects[0].id : "", priority: "med",
    horizon: "day", due: "", recur: "none", status: "todo", subtasks: [], notes: "", timeSpent: 0,
    ...(preset || {})
  };
  const projOpts = S.projects.map(p => `<option value="${p.id}" ${p.id === t.projectId ? "selected" : ""}>${esc(p.name)}</option>`).join("");
  const sel = (val, cur) => val === cur ? "selected" : "";

  openModal(`
    <div class="modal-title">${task ? "Edit task" : "New task"}</div>
    <div class="form-row"><label>Title</label><input id="te-title" value="${esc(t.title)}" placeholder="What needs to get done?"></div>
    <div class="form-grid-2">
      <div class="form-row"><label>Project</label><select id="te-proj">${projOpts}</select></div>
      <div class="form-row"><label>Priority</label>
        <select id="te-prio">
          <option value="high" ${sel("high", t.priority)}>High</option>
          <option value="med" ${sel("med", t.priority)}>Medium</option>
          <option value="low" ${sel("low", t.priority)}>Low</option>
        </select></div>
    </div>
    <div class="form-grid-2">
      <div class="form-row"><label>Time horizon</label>
        <select id="te-horizon">${HORIZONS.map(([k, n]) => `<option value="${k}" ${sel(k, t.horizon)}>${n}</option>`).join("")}</select></div>
      <div class="form-row"><label>Status</label>
        <select id="te-status">${STATUSES.map(([k, n]) => `<option value="${k}" ${sel(k, t.status)}>${n}</option>`).join("")}</select></div>
    </div>
    <div class="form-grid-2">
      <div class="form-row"><label>Due date &amp; time</label><input id="te-due" type="datetime-local" value="${esc(t.due)}"></div>
      <div class="form-row"><label>Repeats</label>
        <select id="te-recur">
          <option value="none" ${sel("none", t.recur)}>Never</option>
          <option value="daily" ${sel("daily", t.recur)}>Daily</option>
          <option value="weekly" ${sel("weekly", t.recur)}>Weekly</option>
          <option value="monthly" ${sel("monthly", t.recur)}>Monthly</option>
        </select></div>
    </div>
    <div class="form-row"><label>Subtasks</label><div id="te-subs"></div>
      <button class="btn btn-sm" id="te-addsub" type="button">+ Add subtask</button></div>
    <div class="form-row"><label>Notes</label><textarea id="te-notes" rows="3" placeholder="Details, links, phone numbers…">${esc(t.notes || "")}</textarea></div>
    <div class="form-row"><label>Time logged (minutes)</label><input id="te-time" type="number" min="0" value="${t.timeSpent || 0}" style="max-width:130px"></div>
    <div class="modal-actions">
      ${task ? `<button class="btn btn-danger" id="te-del">Delete</button>` : ""}
      <button class="btn" id="te-cancel">Cancel</button>
      <button class="btn btn-accent" id="te-save">${task ? "Save changes" : "Add task"}</button>
    </div>`);

  const subsWrap = $("#te-subs");
  const subRow = (st) => {
    const div = document.createElement("div");
    div.className = "subtask-edit-row";
    div.innerHTML = `<input value="${esc(st ? st.text : "")}" placeholder="Subtask"><button class="icon-btn" type="button" title="Remove">${ICONS.trash}</button>`;
    div.querySelector("button").onclick = () => div.remove();
    subsWrap.appendChild(div);
  };
  (t.subtasks || []).forEach(subRow);
  $("#te-addsub").onclick = () => subRow();
  $("#te-cancel").onclick = closeModal;
  if (task) $("#te-del").onclick = () => {
    if (confirm(`Delete "${task.title}"?`)) {
      S.tasks = S.tasks.filter(x => x.id !== task.id);
      save(); closeModal(); renderTasks(); renderBoard(); renderCalendar();
    }
  };
  $("#te-save").onclick = () => {
    const title = $("#te-title").value.trim();
    if (!title) { toast("Give the task a title"); return; }
    const data = {
      title,
      projectId: $("#te-proj").value,
      priority: $("#te-prio").value,
      horizon: $("#te-horizon").value,
      status: $("#te-status").value,
      due: $("#te-due").value,
      recur: $("#te-recur").value,
      notes: $("#te-notes").value,
      timeSpent: Math.max(0, parseInt($("#te-time").value, 10) || 0),
      subtasks: $$(".subtask-edit-row input", subsWrap)
        .map(inp => inp.value.trim()).filter(Boolean)
        .map((text, i) => {
          const prev = (t.subtasks || [])[i];
          return { id: prev ? prev.id : uid(), text, done: prev && prev.text === text ? prev.done : (prev ? prev.done : false) };
        })
    };
    if (task) Object.assign(task, data);
    else S.tasks.unshift({ id: uid(), createdAt: Date.now(), completedAt: null, ...data });
    save(); closeModal(); renderTasks(); renderBoard(); renderCalendar();
    toast(task ? "Saved" : "Task added");
  };
}

/* ============================================================
   VOICE CAPTURE
   ============================================================ */
let recog = null;
function stopVoice() {
  if (recog) { try { recog.stop(); } catch (e) {} recog = null; }
}

function openVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isBrave = !!(navigator.brave);
  const liveBlock = SR ? `
      <div class="voice-orb listening" id="vc-orb">${ICONS.mic}</div>
      <div style="font-size:.8rem;color:var(--muted)">Try: “Add a <strong>high priority school</strong> task, finish week six assignment, <strong>due Tuesday</strong>”</div>
      <div class="voice-transcript" id="vc-text">Listening…</div>
      <div class="modal-actions" style="justify-content:center">
        <button class="btn" id="vc-cancel">Cancel</button>
        <button class="btn btn-accent" id="vc-done">Done speaking</button>
      </div>` : `
      <p style="color:var(--muted);line-height:1.6;font-size:.88rem">Live speech recognition isn't available in ${isBrave ? "<strong>Brave</strong> (it blocks the speech engine on purpose)" : "this browser"} — it works in <strong>Chrome</strong> and <strong>Samsung Internet</strong>. But you can still use a recorded voice memo below.</p>`;

  openModal(`
    <div class="modal-title">Add task by voice</div>
    <div class="voice-stage">
      ${liveBlock}
      <div style="border-top:1px solid var(--border);margin:16px 0 14px"></div>
      <div style="font-size:.78rem;color:var(--muted);margin-bottom:10px">Or transcribe a recorded <strong>voice memo</strong> (m4a, mp3, wav…). Runs on this device — first use downloads a ~40 MB speech model, then it works offline too.</div>
      <input type="file" id="vc-file" accept="audio/*" style="display:none">
      <button class="btn" id="vc-upload" style="width:100%">${ICONS.download} Upload voice memo</button>
      <div id="vc-status" style="font-size:.8rem;color:var(--accent);margin-top:10px;min-height:1.2em"></div>
      ${SR ? "" : `<div class="modal-actions" style="justify-content:center"><button class="btn" id="vc-cancel">Cancel</button></div>`}
    </div>`);

  let finalText = "";
  if (SR) {
    recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.continuous = true;
    recog.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript + " ";
        else interim += ev.results[i][0].transcript;
      }
      const el = $("#vc-text");
      if (el) el.textContent = (finalText + interim).trim() || "Listening…";
    };
    recog.onerror = () => {
      const el = $("#vc-text");
      if (el && !finalText) el.textContent = "Couldn't hear anything — check mic permission, or use a voice memo below.";
    };
    recog.onend = () => { const orb = $("#vc-orb"); if (orb) orb.classList.remove("listening"); };
    try { recog.start(); } catch (e) {}

    $("#vc-done").onclick = () => {
      stopVoice();
      setTimeout(() => {
        const text = finalText.trim() || (($("#vc-text") && !/^(Listening…|Couldn't hear)/.test($("#vc-text").textContent)) ? $("#vc-text").textContent.trim() : "");
        if (!text) { toast("Didn't catch that"); closeModal(); return; }
        const parsed = parseVoiceTask(text);
        closeModal();
        openTaskEditor(null, parsed);
        toast("Review what I heard, then save");
      }, 250);
    };
  }
  const cancelBtn = $("#vc-cancel");
  if (cancelBtn) cancelBtn.onclick = closeModal;

  $("#vc-upload").onclick = () => $("#vc-file").click();
  $("#vc-file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    stopVoice();
    const status = $("#vc-status");
    const upBtn = $("#vc-upload");
    upBtn.disabled = true; upBtn.style.opacity = ".5";
    try {
      const text = await transcribeFile(file, status);
      if (!text) { status.textContent = "Couldn't find any speech in that file."; upBtn.disabled = false; upBtn.style.opacity = "1"; return; }
      const parsed = parseVoiceTask(text);
      closeModal();
      openTaskEditor(null, parsed);
      toast("Transcribed — review and save");
    } catch (err) {
      status.textContent = navigator.onLine
        ? "Transcription failed — that audio format may not be supported."
        : "The speech model needs an internet connection the first time. Connect and try again.";
      upBtn.disabled = false; upBtn.style.opacity = "1";
    }
  };
}

/* ---- on-device Whisper transcription for uploaded voice memos ---- */
let whisperPipe = null;
async function transcribeFile(file, statusEl) {
  const say = msg => { if (statusEl) statusEl.textContent = msg; };
  if (!whisperPipe) {
    say("Loading speech model (first time only, ~40 MB)…");
    const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.0");
    whisperPipe = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
      progress_callback: p => {
        if (p.status === "progress" && p.total) say(`Downloading speech model… ${Math.round(100 * p.loaded / p.total)}%`);
      }
    });
  }
  say("Reading audio…");
  const buf = await file.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const audio = await ctx.decodeAudioData(buf);
  let data;
  if (audio.numberOfChannels > 1) {
    const a = audio.getChannelData(0), b = audio.getChannelData(1);
    data = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) data[i] = (a[i] + b[i]) / 2;
  } else {
    data = audio.getChannelData(0);
  }
  try { ctx.close(); } catch (e) {}
  say("Transcribing… (longer memos take longer)");
  const out = await whisperPipe(data, { chunk_length_s: 30, stride_length_s: 5 });
  return (out && out.text ? out.text : "").trim();
}


const PROJECT_ALIASES = [
  { match: /\b(umgc|class|assignment|homework|course|school|semester|professor)\b/, name: "School — UMGC" },
  { match: /\b(lapidary|opal|gemstone|gem|cabochon|faceting|carving|stone|student|cohort|dpos)\b/, name: "American Lapidary School" },
  { match: /\b(invest|finance|financial|ira|stock|budget|money|bank)\b/, name: "Finance" },
  { match: /\b(personal|home|family|house)\b/, name: "Personal" }
];
const DOW = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

function parseVoiceTask(text) {
  const lower = " " + text.toLowerCase() + " ";
  const out = { title: text, priority: "med", horizon: "day", due: "", projectId: S.projects[0] ? S.projects[0].id : "" };

  if (/(urgent|asap|critical|high priority|top priority|very important)/.test(lower)) out.priority = "high";
  else if (/(low priority|no rush|whenever|someday)/.test(lower)) out.priority = "low";

  if (/(six month|6 month)/.test(lower)) out.horizon = "half";
  else if (/(this year|next year|long term|annual)/.test(lower)) out.horizon = "year";
  else if (/month/.test(lower)) out.horizon = "month";
  else if (/week/.test(lower)) out.horizon = "week";

  // project: explicit project name first, then aliases
  let proj = S.projects.find(p => lower.includes(p.name.toLowerCase()));
  if (!proj) {
    for (const a of PROJECT_ALIASES) {
      if (a.match.test(lower)) { proj = S.projects.find(p => p.name === a.name); if (proj) break; }
    }
  }
  if (proj) out.projectId = proj.id;

  // due date
  let dueDate = null;
  if (/\btoday\b|\btonight\b/.test(lower)) { dueDate = new Date(); dueDate.setHours(23, 59, 0, 0); }
  else if (/\btomorrow\b/.test(lower)) { dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 1); dueDate.setHours(23, 59, 0, 0); }
  else {
    for (const [name, num] of Object.entries(DOW)) {
      if (lower.includes(name)) { dueDate = nextWeekday(num, 23, 59); break; }
    }
  }
  if (dueDate) {
    out.due = dtLocal(dueDate);
    if (out.horizon === "day" && (dueDate - Date.now()) > 2 * 86400000) out.horizon = "week";
  }

  // clean title
  let title = text
    .replace(/^(ok(ay)?|hey|please|claude)[,\s]+/i, "")
    .replace(/^(add|create|make|new)( a| an)?( new)?( high priority| low priority| urgent)?( school| lapidary| personal| finance)?\s*task( to| for| about)?[,:\s]+/i, "")
    .replace(/^(remind me to|i need to|i have to|i've got to)\s+/i, "")
    .replace(/\b(it'?s\s+)?(urgent|asap|critical|high priority|top priority|low priority|no rush|very important)\b/gi, "")
    .replace(/\b(due|by|before|on)\s+(today|tonight|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)( night| morning| at midnight)?\b/gi, "")
    .replace(/\b(this week|next week|this month|next month|this year|six months?)\b/gi, "")
    .replace(/\s{2,}/g, " ").replace(/^[,\s]+|[,\s.]+$/g, "");
  if (title) out.title = title.charAt(0).toUpperCase() + title.slice(1);
  // long voice memos: first sentence becomes the title, full transcript goes to notes
  if (out.title.length > 90) {
    const first = out.title.split(/[.!?]\s+/)[0] || out.title;
    out.notes = "Full transcript: " + text;
    out.title = first.length > 90 ? first.slice(0, 87) + "…" : first;
  }
  return out;
}

/* ============================================================
   KANBAN BOARD
   ============================================================ */
function renderBoard() {
  const root = $("#view-board");
  if (!root) return;
  const cols = STATUSES.map(([key, name]) => {
    let cards = sortTasks(S.tasks.filter(t => t.status === key));
    if (key === "done") cards = cards.slice().sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)).slice(0, 20);
    return `<div class="kcol" data-status="${key}">
      <div class="kcol-head">${name}<span class="kcol-count">${cards.length}</span></div>
      ${cards.map(t => kcardHTML(t, key)).join("") || `<div class="empty" style="padding:20px 8px">Empty</div>`}
    </div>`;
  }).join("");
  root.innerHTML = `
    <div class="view-head">
      <div class="eyebrow">One board, every project</div>
      <div class="view-title">Board</div>
      <div class="view-sub">Drag cards between columns — or use the arrows on touch screens.</div>
    </div>
    <div class="board-wrap">${cols}</div>`;
  bindBoardDnD(root);
}

function kcardHTML(t, statusKey) {
  const prog = taskProgress(t);
  const hasSub = t.subtasks && t.subtasks.length;
  const idx = STATUSES.findIndex(s => s[0] === statusKey);
  return `<div class="kcard" draggable="true" data-id="${t.id}">
    <div class="kcard-title">${esc(t.title)}</div>
    <div class="kcard-meta">${taskMetaHTML(t, true)}</div>
    ${hasSub ? `<div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${prog}%"></div></div><span class="progress-pct">${prog}%</span></div>` : ""}
    <div class="kcard-foot">
      <span class="time-chip">${ICONS.clock}${fmtMins(t.timeSpent)}</span>
      <span class="kmove">
        <button class="icon-btn" data-move="-1" ${idx === 0 ? "disabled style='opacity:.25'" : ""} aria-label="Move left">${ICONS.left}</button>
        <button class="icon-btn" data-move="1" ${idx === STATUSES.length - 1 ? "disabled style='opacity:.25'" : ""} aria-label="Move right">${ICONS.right}</button>
      </span>
    </div>
  </div>`;
}

function moveTaskStatus(t, dir) {
  const idx = STATUSES.findIndex(s => s[0] === t.status);
  const next = STATUSES[Math.min(STATUSES.length - 1, Math.max(0, idx + dir))][0];
  setTaskStatus(t, next);
}
function setTaskStatus(t, status) {
  if (status === t.status) return;
  if (status === "done") completeTask(t);
  else { t.status = status; if (t.completedAt) t.completedAt = null; }
  save(); renderBoard(); renderTasks();
}

function handleBoardClick(e) {
  const card = e.target.closest(".kcard");
  if (!card) return;
  const t = S.tasks.find(x => x.id === card.dataset.id);
  if (!t) return;
  const mv = e.target.closest("[data-move]");
  if (mv) { moveTaskStatus(t, parseInt(mv.dataset.move, 10)); return; }
  openTaskEditor(t);
}

function bindBoardDnD(root) {
  let dragId = null;
  $$(".kcard", root).forEach(card => {
    card.addEventListener("dragstart", e => {
      dragId = card.dataset.id;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", dragId); } catch (err) {}
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });
  $$(".kcol", root).forEach(col => {
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drag-over"); });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", e => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = dragId || e.dataTransfer.getData("text/plain");
      const t = S.tasks.find(x => x.id === id);
      if (t) setTaskStatus(t, col.dataset.status);
      dragId = null;
    });
  });
}

/* ============================================================
   CALENDAR + ICS EXPORT
   ============================================================ */
function renderCalendar() {
  const root = $("#view-calendar");
  if (!root) return;
  const m = UI.calMonth;
  const year = m.getFullYear(), month = m.getMonth();
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const byDay = {};
  for (const t of S.tasks) {
    if (!t.due) continue;
    const k = dateStrOf(parseDue(t.due));
    (byDay[k] = byDay[k] || []).push(t);
  }

  let cells = "";
  const total = Math.ceil((startDow + daysIn) / 7) * 7;
  for (let i = 0; i < total; i++) {
    let d, out = false;
    if (i < startDow) { d = new Date(year, month - 1, prevDays - startDow + 1 + i); out = true; }
    else if (i >= startDow + daysIn) { d = new Date(year, month + 1, i - startDow - daysIn + 1); out = true; }
    else d = new Date(year, month, i - startDow + 1);
    const k = dateStrOf(d);
    const dots = (byDay[k] || []).slice(0, 4).map(t => {
      const p = projById(t.projectId);
      return `<span class="dot" style="background:${p ? esc(p.color) : "var(--accent)"};${t.status === "done" ? "opacity:.35" : ""}"></span>`;
    }).join("");
    cells += `<button class="cal-cell ${out ? "out" : ""} ${k === todayStr() ? "today" : ""} ${k === UI.calSelected ? "selected" : ""}" data-day="${k}">
      <span class="cal-daynum">${d.getDate()}</span><span class="cal-dots">${dots}</span>
    </button>`;
  }

  const selTasks = sortTasks(byDay[UI.calSelected] || []);
  const selDate = new Date(UI.calSelected + "T12:00");
  root.innerHTML = `
    <div class="view-head">
      <div class="eyebrow">Deadlines on the map</div>
      <div class="view-title">Calendar</div>
      <div class="view-sub">Tasks with due dates appear automatically. Export .ics to import into your phone's calendar.</div>
    </div>
    <div class="cal-head">
      <button class="btn btn-sm" data-cal="prev">${ICONS.left}</button>
      <button class="btn btn-sm" data-cal="today">Today</button>
      <button class="btn btn-sm" data-cal="next">${ICONS.right}</button>
      <span class="cal-month">${m.toLocaleDateString([], { month: "long", year: "numeric" })}</span>
      <button class="btn btn-sm" data-cal="ics">${ICONS.download} Export .ics</button>
    </div>
    <div class="cal-grid">
      ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div class="cal-dow">${d}</div>`).join("")}
      ${cells}
    </div>
    <div class="cal-agenda">
      <div class="agenda-title">${selDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
      ${selTasks.length ? selTasks.map(taskRowHTML).join("") : `<div class="empty">Nothing due this day.</div>`}
    </div>`;
}

function handleCalendarClick(e) {
  const nav = e.target.closest("[data-cal]");
  if (nav) {
    if (nav.dataset.cal === "prev") UI.calMonth = new Date(UI.calMonth.getFullYear(), UI.calMonth.getMonth() - 1, 1);
    if (nav.dataset.cal === "next") UI.calMonth = new Date(UI.calMonth.getFullYear(), UI.calMonth.getMonth() + 1, 1);
    if (nav.dataset.cal === "today") { UI.calMonth = new Date(); UI.calSelected = todayStr(); }
    if (nav.dataset.cal === "ics") {
      const upcoming = S.tasks.filter(t => t.due && t.status !== "done");
      if (!upcoming.length) { toast("No upcoming tasks with due dates"); return; }
      exportICS(upcoming);
      return;
    }
    renderCalendar(); return;
  }
  const cell = e.target.closest(".cal-cell");
  if (cell) { UI.calSelected = cell.dataset.day; renderCalendar(); return; }
  handleTasksClick(e); // agenda rows reuse task row actions
  renderCalendar();
}

function icsEscape(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
function exportICS(tasks) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MissionDeck//EN", "CALSCALE:GREGORIAN"];
  for (const t of tasks) {
    const d = parseDue(t.due);
    if (!d) continue;
    const fmt = x => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
    const end = new Date(d.getTime() + 30 * 60000);
    const p = projById(t.projectId);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${t.id}@missiondeck`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmt(d)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${icsEscape(t.title)}`,
      `DESCRIPTION:${icsEscape((p ? p.name + " · " : "") + (PRIO_NAME[t.priority] || "") + " priority" + (t.notes ? " — " + t.notes : ""))}`
    );
    if (t.recur === "daily") lines.push("RRULE:FREQ=DAILY");
    if (t.recur === "weekly") lines.push("RRULE:FREQ=WEEKLY");
    if (t.recur === "monthly") lines.push("RRULE:FREQ=MONTHLY");
    lines.push("BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(t.title)}`, "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  downloadText(tasks.length === 1 ? `${tasks[0].title.slice(0, 30)}.ics` : "missiondeck-tasks.ics",
    lines.join("\r\n"), "text/calendar;charset=utf-8");
  toast("Open the .ics file to add it to your calendar");
}

/* ============================================================
   NOTES
   ============================================================ */
function mdRender(src) {
  const escd = esc(src);
  const lines = escd.split("\n");
  let html = "", list = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  const inline = s => s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (/^### /.test(line)) { closeList(); html += `<h3>${inline(line.slice(4))}</h3>`; }
    else if (/^## /.test(line)) { closeList(); html += `<h2>${inline(line.slice(3))}</h2>`; }
    else if (/^# /.test(line)) { closeList(); html += `<h1>${inline(line.slice(2))}</h1>`; }
    else if (/^[-*] /.test(line)) { if (list !== "ul") { closeList(); html += "<ul>"; list = "ul"; } html += `<li>${inline(line.slice(2))}</li>`; }
    else if (/^\d+\. /.test(line)) { if (list !== "ol") { closeList(); html += "<ol>"; list = "ol"; } html += `<li>${inline(line.replace(/^\d+\. /, ""))}</li>`; }
    else if (line === "") { closeList(); }
    else { closeList(); html += `<p>${inline(line)}</p>`; }
  }
  closeList();
  return html;
}

function renderNotes() {
  const root = $("#view-notes");
  if (!root) return;
  if (UI.openNoteId) { renderNoteEditor(root); return; }

  const q = UI.noteSearch.trim().toLowerCase();
  let notes = S.notes.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  if (q) notes = notes.filter(n =>
    (n.title || "").toLowerCase().includes(q) ||
    (n.body || "").toLowerCase().includes(q) ||
    (n.tags || []).some(tag => tag.toLowerCase().includes(q)));

  root.innerHTML = `
    <div class="view-head">
      <div class="eyebrow">Field notes</div>
      <div class="view-title">Notes</div>
    </div>
    <div class="notes-toolbar">
      <input id="note-search" placeholder="Search all notes…" value="${esc(UI.noteSearch)}">
      <button class="btn" data-act="exportall" title="Export all notes">${ICONS.download}</button>
      <button class="btn btn-accent" data-act="newnote">+ New</button>
    </div>
    <div class="notes-grid">
      ${notes.map(n => {
        const nb = S.notebooks.find(x => x.id === n.notebookId);
        return `<div class="note-card" data-id="${n.id}">
          <div class="note-title">${esc(n.title || "Untitled")}</div>
          <div class="note-preview">${esc((n.body || "").replace(/[#*`>-]/g, "").slice(0, 180))}</div>
          <div class="note-foot">
            ${nb ? `<span class="tag" style="color:var(--violet);background:color-mix(in srgb,var(--violet) 12%,transparent)">${esc(nb.name)}</span>` : ""}
            ${(n.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}
            <span class="note-date">${new Date(n.updatedAt || n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
          </div>
        </div>`;
      }).join("") || `<div class="empty" style="grid-column:1/-1"><strong>No notes${q ? " match your search" : " yet"}.</strong></div>`}
    </div>`;

  $("#note-search").addEventListener("input", e => {
    UI.noteSearch = e.target.value;
    renderNotes();
    const inp = $("#note-search"); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  });
}

function handleNotesClick(e) {
  if (UI.openNoteId) return; // editor binds its own buttons
  if (e.target.closest("[data-act='newnote']")) {
    const n = { id: uid(), title: "", body: "", notebookId: S.notebooks[0] ? S.notebooks[0].id : "", tags: [], createdAt: Date.now(), updatedAt: Date.now() };
    S.notes.unshift(n); save();
    UI.openNoteId = n.id; UI.notePreview = false;
    renderNotes(); return;
  }
  if (e.target.closest("[data-act='exportall']")) {
    const md = S.notes.map(n => `# ${n.title || "Untitled"}\n\n${n.body || ""}\n\n---\n`).join("\n");
    downloadText("missiondeck-notes.md", md, "text/markdown;charset=utf-8");
    toast("All notes exported as markdown"); return;
  }
  const card = e.target.closest(".note-card");
  if (card) { UI.openNoteId = card.dataset.id; UI.notePreview = true; renderNotes(); }
}

function renderNoteEditor(root) {
  const n = S.notes.find(x => x.id === UI.openNoteId);
  if (!n) { UI.openNoteId = null; renderNotes(); return; }
  const nbOpts = S.notebooks.map(nb => `<option value="${nb.id}" ${nb.id === n.notebookId ? "selected" : ""}>${esc(nb.name)}</option>`).join("");

  root.innerHTML = `
    <div class="cal-head">
      <button class="btn btn-sm" id="nb-back">${ICONS.left} Notes</button>
      <span style="flex:1"></span>
      <button class="btn btn-sm" id="nb-dictate">${ICONS.mic} Dictate</button>
      <button class="btn btn-sm" id="nb-preview">${UI.notePreview ? "Edit" : "Preview"}</button>
      <button class="btn btn-sm" id="nb-export">${ICONS.download}</button>
      <button class="btn btn-sm btn-danger" id="nb-del">${ICONS.trash}</button>
    </div>
    <div class="note-editor">
      <div class="form-row"><input id="nb-title" placeholder="Note title" value="${esc(n.title)}" style="font-weight:700;font-size:1.05rem"></div>
      <div class="form-grid-2">
        <div class="form-row"><label>Notebook</label><select id="nb-notebook">${nbOpts}</select></div>
        <div class="form-row"><label>Tags (comma separated)</label><input id="nb-tags" value="${esc((n.tags || []).join(", "))}"></div>
      </div>
      ${UI.notePreview
        ? `<div class="card md-render">${mdRender(n.body || "") || '<p style="color:var(--muted)">Empty note.</p>'}</div>`
        : `<textarea id="nb-body" placeholder="Write in markdown… # heading, **bold**, - list">${esc(n.body)}</textarea>`}
    </div>`;

  const persist = () => {
    n.title = $("#nb-title").value;
    n.notebookId = $("#nb-notebook").value;
    n.tags = $("#nb-tags").value.split(",").map(s => s.trim()).filter(Boolean);
    const body = $("#nb-body");
    if (body) n.body = body.value;
    n.updatedAt = Date.now();
    save();
  };
  ["nb-title", "nb-tags"].forEach(id => $("#" + id).addEventListener("input", persist));
  $("#nb-notebook").addEventListener("change", persist);
  const body = $("#nb-body");
  if (body) body.addEventListener("input", persist);

  $("#nb-back").onclick = () => { persist(); UI.openNoteId = null; renderNotes(); };
  $("#nb-preview").onclick = () => { persist(); UI.notePreview = !UI.notePreview; renderNotes(); };
  $("#nb-export").onclick = () => {
    persist();
    downloadText(`${(n.title || "note").replace(/[^\w\- ]/g, "").slice(0, 40)}.md`, `# ${n.title}\n\n${n.body}`, "text/markdown;charset=utf-8");
    toast("Note exported");
  };
  $("#nb-del").onclick = () => {
    if (confirm(`Delete note "${n.title || "Untitled"}"?`)) {
      S.notes = S.notes.filter(x => x.id !== n.id);
      save(); UI.openNoteId = null; renderNotes();
    }
  };
  $("#nb-dictate").onclick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast("Speech recognition not available in this browser"); return; }
    if (UI.notePreview) { UI.notePreview = false; persist(); renderNotes(); setTimeout(() => $("#nb-dictate").click(), 80); return; }
    toast("Listening… tap Dictate again to stop");
    if (recog) { stopVoice(); return; }
    recog = new SR();
    recog.lang = "en-US"; recog.interimResults = false; recog.continuous = true;
    recog.onresult = ev => {
      let add = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++)
        if (ev.results[i].isFinal) add += ev.results[i][0].transcript + " ";
      const ta = $("#nb-body");
      if (ta && add) { ta.value = (ta.value ? ta.value + " " : "") + add.trim(); persist(); }
    };
    recog.onend = () => { recog = null; };
    try { recog.start(); } catch (e) {}
  };
}

/* ============================================================
   FOCUS — POMODORO
   ============================================================ */
const Pomo = { mode: "work", remaining: 25 * 60, total: 25 * 60, running: false, timer: null, taskId: "" };
function pomoDuration(mode) {
  return (mode === "work" ? S.settings.work : mode === "short" ? S.settings.short : S.settings.long) * 60;
}
function pomoSetMode(mode) {
  Pomo.mode = mode;
  Pomo.total = Pomo.remaining = pomoDuration(mode);
  pomoStop();
  renderFocus();
}
function pomoStart() {
  if (Pomo.running) return;
  Pomo.running = true;
  Pomo.timer = setInterval(() => {
    Pomo.remaining--;
    if (Pomo.remaining <= 0) { pomoFinish(); return; }
    updateFocusClock();
  }, 1000);
  renderFocus();
}
function pomoStop() {
  Pomo.running = false;
  if (Pomo.timer) { clearInterval(Pomo.timer); Pomo.timer = null; }
  document.title = "MissionDeck";
}
function pomoFinish() {
  pomoStop();
  beep();
  if (Pomo.mode === "work") {
    const mins = Math.round(Pomo.total / 60);
    S.pomo.sessions.push({ d: todayStr(), m: mins, t: Pomo.taskId || "" });
    if (Pomo.taskId) {
      const t = S.tasks.find(x => x.id === Pomo.taskId);
      if (t) t.timeSpent = (t.timeSpent || 0) + mins;
    }
    save();
    toast(`Focus session done — ${mins} min logged. Take a break.`);
    Pomo.mode = "short";
  } else {
    toast("Break's over — ready when you are.");
    Pomo.mode = "work";
  }
  Pomo.total = Pomo.remaining = pomoDuration(Pomo.mode);
  renderFocus();
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18, 0.36].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = i === 2 ? 880 : 660;
      g.gain.setValueAtTime(0.08, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.15);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.16);
    });
  } catch (e) {}
  if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
}
const fmtClock = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
function updateFocusClock() {
  const el = $("#pomo-time");
  if (el) el.textContent = fmtClock(Pomo.remaining);
  const ring = $("#pomo-ring");
  if (ring) {
    const C = 2 * Math.PI * 120;
    ring.style.strokeDashoffset = C * (1 - Pomo.remaining / Pomo.total);
  }
  if (Pomo.running) document.title = `${fmtClock(Pomo.remaining)} · MissionDeck`;
}

function renderFocus() {
  const root = $("#view-focus");
  if (!root) return;
  const C = 2 * Math.PI * 120;
  const sessions = S.pomo.sessions || [];
  const today = sessions.filter(s => s.d === todayStr());
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const week = sessions.filter(s => new Date(s.d + "T12:00") >= new Date(dateStrOf(weekAgo) + "T00:00"));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dateStrOf(d);
    days.push({ k, label: d.toLocaleDateString([], { weekday: "narrow" }), m: sessions.filter(s => s.d === k).reduce((a, s) => a + s.m, 0) });
  }
  const maxM = Math.max(1, ...days.map(d => d.m));
  const openTasks = S.tasks.filter(t => t.status !== "done");

  root.innerHTML = `
    <div class="view-head" style="text-align:center">
      <div class="eyebrow">Deep work</div>
      <div class="view-title">Focus</div>
    </div>
    <div class="focus-wrap">
      <div class="mode-tabs">
        <button class="chip ${Pomo.mode === "work" ? "on" : ""}" data-mode="work">Focus ${S.settings.work}m</button>
        <button class="chip ${Pomo.mode === "short" ? "on" : ""}" data-mode="short">Short break ${S.settings.short}m</button>
        <button class="chip ${Pomo.mode === "long" ? "on" : ""}" data-mode="long">Long break ${S.settings.long}m</button>
      </div>
      <div class="timer-ring">
        <svg viewBox="0 0 260 260">
          <circle class="ring-bg" cx="130" cy="130" r="120" fill="none" stroke-width="10"/>
          <circle id="pomo-ring" class="ring-fg" cx="130" cy="130" r="120" fill="none" stroke-width="10"
            stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Pomo.remaining / Pomo.total)}"/>
        </svg>
        <div class="timer-center">
          <div class="timer-time" id="pomo-time">${fmtClock(Pomo.remaining)}</div>
          <div class="timer-mode">${Pomo.mode === "work" ? "Focus" : Pomo.mode === "short" ? "Short break" : "Long break"}</div>
        </div>
      </div>
      <div class="focus-controls">
        <button class="btn btn-accent" id="pomo-toggle" style="min-width:120px">${Pomo.running ? "Pause" : "Start"}</button>
        <button class="btn" id="pomo-reset">Reset</button>
      </div>
      <div class="focus-task">
        <label>Log this session to a task (optional)</label>
        <select id="pomo-task">
          <option value="">— No task —</option>
          ${openTasks.map(t => `<option value="${t.id}" ${t.id === Pomo.taskId ? "selected" : ""}>${esc(t.title.slice(0, 48))}</option>`).join("")}
        </select>
      </div>
      <div class="stats-row">
        <div class="stat-tile"><div class="stat-num">${today.length}</div><div class="stat-label">Sessions today</div></div>
        <div class="stat-tile"><div class="stat-num">${fmtMins(today.reduce((a, s) => a + s.m, 0))}</div><div class="stat-label">Focus today</div></div>
        <div class="stat-tile"><div class="stat-num">${fmtMins(week.reduce((a, s) => a + s.m, 0))}</div><div class="stat-label">Last 7 days</div></div>
      </div>
      <div class="card weekbars">
        ${days.map(d => `<div class="wb ${d.k === todayStr() ? "today" : ""}">
          <div class="wb-bar" style="height:${Math.round(100 * d.m / maxM)}%" title="${d.m} min"></div>
          <div class="wb-label">${d.label}</div>
        </div>`).join("")}
      </div>
    </div>`;

  $$("[data-mode]", root).forEach(b => b.onclick = () => pomoSetMode(b.dataset.mode));
  $("#pomo-toggle").onclick = () => Pomo.running ? (pomoStop(), renderFocus()) : pomoStart();
  $("#pomo-reset").onclick = () => { pomoStop(); Pomo.total = Pomo.remaining = pomoDuration(Pomo.mode); renderFocus(); };
  $("#pomo-task").onchange = e => { Pomo.taskId = e.target.value; };
}

/* ============================================================
   SETTINGS
   ============================================================ */
function renderSettings() {
  const root = $("#view-settings");
  if (!root) return;
  root.innerHTML = `
    <div class="view-head">
      <div class="eyebrow">Tune the deck</div>
      <div class="view-title">Settings</div>
    </div>

    <div class="card settings-section">
      <h3>Appearance</h3>
      <div class="setting-row">
        <div class="setting-label">Theme</div>
        <select id="set-theme">
          <option value="dark" ${S.settings.theme === "dark" ? "selected" : ""}>Dark</option>
          <option value="light" ${S.settings.theme === "light" ? "selected" : ""}>Light</option>
        </select>
      </div>
    </div>

    <div class="card settings-section">
      <h3>Focus timer (minutes)</h3>
      <div class="setting-row"><div class="setting-label">Focus length</div><input type="number" id="set-work" min="1" max="120" value="${S.settings.work}"></div>
      <div class="setting-row"><div class="setting-label">Short break</div><input type="number" id="set-short" min="1" max="60" value="${S.settings.short}"></div>
      <div class="setting-row"><div class="setting-label">Long break</div><input type="number" id="set-long" min="1" max="90" value="${S.settings.long}"></div>
    </div>

    <div class="card settings-section">
      <h3>Projects</h3>
      <div id="proj-list">
        ${S.projects.map(p => `<div class="proj-row" data-id="${p.id}">
          <input type="color" value="${esc(p.color)}">
          <input type="text" value="${esc(p.name)}">
          <button class="icon-btn" data-act="delproj" title="Delete project">${ICONS.trash}</button>
        </div>`).join("")}
      </div>
      <div style="margin-top:10px"><button class="btn btn-sm" id="set-addproj">+ Add project</button></div>
    </div>

    <div class="card settings-section">
      <h3>Notebooks</h3>
      <div id="nb-list">
        ${S.notebooks.map(nb => `<div class="proj-row" data-id="${nb.id}">
          <input type="text" value="${esc(nb.name)}">
          <button class="icon-btn" data-act="delnb" title="Delete notebook">${ICONS.trash}</button>
        </div>`).join("")}
      </div>
      <div style="margin-top:10px"><button class="btn btn-sm" id="set-addnb">+ Add notebook</button></div>
    </div>

    <div class="card settings-section">
      <h3>Data</h3>
      <div class="setting-row">
        <div class="setting-label">Backup<div class="setting-hint">Everything as one JSON file — keep a copy somewhere safe.</div></div>
        <button class="btn btn-sm" id="set-export">${ICONS.download} Export</button>
      </div>
      <div class="setting-row">
        <div class="setting-label">Restore<div class="setting-hint">Import a backup file. Replaces current data.</div></div>
        <input type="file" id="set-import" accept=".json" style="display:none">
        <button class="btn btn-sm" id="set-importbtn">Import</button>
      </div>
      <div class="setting-row">
        <div class="setting-label">Reset everything<div class="setting-hint">Deletes all data on this device.</div></div>
        <button class="btn btn-sm btn-danger" id="set-reset">Reset</button>
      </div>
    </div>

    <div class="card settings-section">
      <h3>About</h3>
      <p style="font-size:.84rem;color:var(--muted);line-height:1.7">
        <strong style="color:var(--text)">MissionDeck v1.0</strong> — built for Jose Reyna.<br>
        All data lives on this device only (offline-first). Use Export for backups before clearing browser data.<br>
        To install on your phone: open this site in Chrome → menu (⋮) → <strong>Add to Home screen → Install</strong>.
      </p>
    </div>`;

  $("#set-theme").onchange = e => { S.settings.theme = e.target.value; save(); applyTheme(); };
  const num = (id, key, lo, hi) => $(id).onchange = e => {
    S.settings[key] = Math.min(hi, Math.max(lo, parseInt(e.target.value, 10) || lo));
    save();
    if (!Pomo.running) { Pomo.total = Pomo.remaining = pomoDuration(Pomo.mode); }
  };
  num("#set-work", "work", 1, 120); num("#set-short", "short", 1, 60); num("#set-long", "long", 1, 90);

  $("#proj-list").addEventListener("input", e => {
    const row = e.target.closest(".proj-row"); if (!row) return;
    const p = S.projects.find(x => x.id === row.dataset.id); if (!p) return;
    p.color = row.querySelector("input[type=color]").value;
    p.name = row.querySelector("input[type=text]").value;
    save();
  });
  $("#proj-list").addEventListener("click", e => {
    const btn = e.target.closest("[data-act='delproj']"); if (!btn) return;
    const row = btn.closest(".proj-row");
    const p = S.projects.find(x => x.id === row.dataset.id);
    if (S.projects.length <= 1) { toast("Keep at least one project"); return; }
    if (confirm(`Delete project "${p.name}"? Its tasks move to "${S.projects.find(x => x.id !== p.id).name}".`)) {
      const fallback = S.projects.find(x => x.id !== p.id).id;
      S.tasks.forEach(t => { if (t.projectId === p.id) t.projectId = fallback; });
      S.projects = S.projects.filter(x => x.id !== p.id);
      if (UI.projFilter === p.id) UI.projFilter = "all";
      save(); renderSettings();
    }
  });
  $("#set-addproj").onclick = () => {
    S.projects.push({ id: uid(), name: "New project", color: "#2FD4BE" });
    save(); renderSettings();
  };

  $("#nb-list").addEventListener("input", e => {
    const row = e.target.closest(".proj-row"); if (!row) return;
    const nb = S.notebooks.find(x => x.id === row.dataset.id); if (!nb) return;
    nb.name = row.querySelector("input[type=text]").value;
    save();
  });
  $("#nb-list").addEventListener("click", e => {
    const btn = e.target.closest("[data-act='delnb']"); if (!btn) return;
    const row = btn.closest(".proj-row");
    const nb = S.notebooks.find(x => x.id === row.dataset.id);
    if (S.notebooks.length <= 1) { toast("Keep at least one notebook"); return; }
    if (confirm(`Delete notebook "${nb.name}"?`)) {
      const fallback = S.notebooks.find(x => x.id !== nb.id).id;
      S.notes.forEach(n => { if (n.notebookId === nb.id) n.notebookId = fallback; });
      S.notebooks = S.notebooks.filter(x => x.id !== nb.id);
      save(); renderSettings();
    }
  });
  $("#set-addnb").onclick = () => {
    S.notebooks.push({ id: uid(), name: "New notebook" });
    save(); renderSettings();
  };

  $("#set-export").onclick = () => {
    downloadText(`missiondeck-backup-${todayStr()}.json`, JSON.stringify(S, null, 2), "application/json");
    toast("Backup exported");
  };
  $("#set-importbtn").onclick = () => $("#set-import").click();
  $("#set-import").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.tasks || !data.projects) throw new Error("bad file");
        if (confirm("Replace ALL current data with this backup?")) {
          S = data; save(); applyTheme(); setView("tasks");
          toast("Backup restored");
        }
      } catch (err) { toast("That file isn't a MissionDeck backup"); }
    };
    r.readAsText(f);
  };
  $("#set-reset").onclick = () => {
    if (confirm("Delete ALL tasks, notes and stats on this device?") && confirm("Last chance — really reset everything?")) {
      localStorage.removeItem(KEY);
      S = load(); applyTheme(); setView("tasks");
      toast("Fresh start");
    }
  };
}

/* ============================================================
   ROUTER / INIT
   ============================================================ */
const RENDER = {
  tasks: renderTasks, board: renderBoard, calendar: renderCalendar,
  notes: renderNotes, focus: renderFocus, settings: renderSettings,
  break: () => window.Games && window.Games.render()
};

function setView(name) {
  UI.view = name;
  $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  $("#fabs").classList.toggle("hidden", name !== "tasks");
  if (name !== "break" && window.Games) window.Games.pause();
  (RENDER[name] || (() => {}))();
  window.scrollTo({ top: 0 });
}

function init() {
  applyTheme();
  $$(".nav-item").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
  $("#view-tasks").addEventListener("click", handleTasksClick);
  $("#view-board").addEventListener("click", handleBoardClick);
  $("#view-calendar").addEventListener("click", handleCalendarClick);
  $("#view-notes").addEventListener("click", handleNotesClick);
  $("#fab-add").addEventListener("click", () => openTaskEditor(null));
  $("#fab-voice").addEventListener("click", openVoice);
  $("#modal-backdrop").addEventListener("click", e => { if (e.target.id === "modal-backdrop") closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#modal-backdrop").classList.contains("hidden")) closeModal(); });
  Pomo.total = Pomo.remaining = pomoDuration("work");
  setView("tasks");
}

/* expose a small API for games.js */
window.MD = {
  get state() { return S; },
  save, toast
};

document.addEventListener("DOMContentLoaded", init);
})();
