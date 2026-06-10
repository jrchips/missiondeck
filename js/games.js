/* ============================================================
   MissionDeck — games.js  (2048 + Snake)
   Talks to app.js through window.MD = { state, save, toast }
   ============================================================ */
(function () {
"use strict";

let current = null;        // "g2048" | "snake" | null
let cleanup = null;        // function to tear down the active game

/* ---------------- shared ---------------- */
function root() { return document.getElementById("view-break"); }

function bestOf(key) {
  const s = window.MD.state.scores || {};
  return s[key] || 0;
}
function setBest(key, val) {
  const S = window.MD.state;
  S.scores = S.scores || {};
  if (val > (S.scores[key] || 0)) {
    S.scores[key] = val;
    window.MD.save();
    return true;
  }
  return false;
}

function renderPicker() {
  current = null;
  root().innerHTML = `
    <div class="view-head" style="text-align:center">
      <div class="eyebrow">Earned downtime</div>
      <div class="view-title">Break</div>
      <div class="view-sub">Quick games for between focus sessions.</div>
    </div>
    <div class="game-picker">
      <div class="game-tile" data-game="g2048">
        <div class="game-emoji">🔢</div>
        <div class="game-name">2048</div>
        <div class="game-best">Best: ${bestOf("g2048")}</div>
      </div>
      <div class="game-tile" data-game="snake">
        <div class="game-emoji">🐍</div>
        <div class="game-name">Snake</div>
        <div class="game-best">Best: ${bestOf("snake")}</div>
      </div>
    </div>`;
}

function teardown() {
  if (cleanup) { cleanup(); cleanup = null; }
}

/* ============================================================
   2048
   ============================================================ */
function start2048() {
  current = "g2048";
  const R = root();
  R.innerHTML = `
    <div class="game-stage">
      <div class="game-topbar">
        <button class="btn btn-sm" data-game-back>‹ Games</button>
        <span style="flex:1"></span>
        <div class="score-pill"><div class="sp-label">Score</div><div class="sp-val" id="g2048-score">0</div></div>
        <div class="score-pill"><div class="sp-label">Best</div><div class="sp-val" id="g2048-best">${bestOf("g2048")}</div></div>
        <button class="btn btn-sm" id="g2048-new">New</button>
      </div>
      <div id="g2048-board">
        ${'<div class="t-cell"></div>'.repeat(16)}
      </div>
      <p style="text-align:center;color:var(--muted);font-size:.76rem;margin-top:10px">Swipe or use arrow keys. Join tiles to reach 2048.</p>
    </div>`;

  const board = document.getElementById("g2048-board");
  const scoreEl = document.getElementById("g2048-score");
  const bestEl = document.getElementById("g2048-best");

  let grid, score, over, tiles;

  const COLORS = {
    2:    ["var(--surface-3)", "var(--text)"],
    4:    ["#3A4656", "var(--text)"],
    8:    ["#1B7A6E", "#EAFFFB"],
    16:   ["#2FD4BE", "#062420"],
    32:   ["#F0A93C", "#2A1B02"],
    64:   ["#E2854C", "#2A1102"],
    128:  ["#E2574C", "#FFF1EF"],
    256:  ["#C2474C", "#FFF1EF"],
    512:  ["#9B7EDE", "#150B33"],
    1024: ["#7E5ED4", "#F2ECFF"],
    2048: ["#FFD75E", "#3A2B00"]
  };

  function reset() {
    grid = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    score = 0; over = false;
    addTile(); addTile();
    draw();
  }
  function emptyCells() {
    const out = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!grid[r][c]) out.push([r, c]);
    return out;
  }
  function addTile() {
    const cells = emptyCells();
    if (!cells.length) return;
    const [r, c] = cells[Math.floor(Math.random() * cells.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  function canMove() {
    if (emptyCells().length) return true;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = grid[r][c];
      if ((r < 3 && grid[r + 1][c] === v) || (c < 3 && grid[r][c + 1] === v)) return true;
    }
    return false;
  }
  function slide(row) {
    const vals = row.filter(v => v);
    let gained = 0;
    for (let i = 0; i < vals.length - 1; i++) {
      if (vals[i] === vals[i + 1]) {
        vals[i] *= 2; gained += vals[i];
        vals.splice(i + 1, 1);
      }
    }
    while (vals.length < 4) vals.push(0);
    return [vals, gained];
  }
  function move(dir) {  // 0 left, 1 up, 2 right, 3 down
    if (over) return;
    let moved = false, gained = 0;
    const get = (i, j) =>
      dir === 0 ? grid[i][j] : dir === 2 ? grid[i][3 - j] :
      dir === 1 ? grid[j][i] : grid[3 - j][i];
    const set = (i, j, v) => {
      if (dir === 0) grid[i][j] = v;
      else if (dir === 2) grid[i][3 - j] = v;
      else if (dir === 1) grid[j][i] = v;
      else grid[3 - j][i] = v;
    };
    for (let i = 0; i < 4; i++) {
      const row = [get(i, 0), get(i, 1), get(i, 2), get(i, 3)];
      const [out, g] = slide(row);
      gained += g;
      for (let j = 0; j < 4; j++) {
        if (get(i, j) !== out[j]) moved = true;
        set(i, j, out[j]);
      }
    }
    if (!moved) return;
    score += gained;
    addTile();
    if (!canMove()) {
      over = true;
      if (setBest("g2048", score)) window.MD.toast("New 2048 high score: " + score);
    }
    draw();
  }
  function draw() {
    // remove old tiles + veil
    Array.from(board.querySelectorAll(".t-tile, .game-over-veil")).forEach(el => el.remove());
    const rect = board.getBoundingClientRect();
    const pad = 8, gap = 8;
    const cell = (rect.width - pad * 2 - gap * 3) / 4;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const el = document.createElement("div");
      el.className = "t-tile";
      const [bg, fg] = COLORS[v] || COLORS[2048];
      el.style.cssText = `width:${cell}px;height:${cell}px;left:${pad + c * (cell + gap)}px;top:${pad + r * (cell + gap)}px;background:${bg};color:${fg};font-size:${v >= 1024 ? cell * 0.3 : v >= 128 ? cell * 0.36 : cell * 0.42}px`;
      el.textContent = v;
      board.appendChild(el);
    }
    scoreEl.textContent = score;
    if (score > bestOf("g2048")) bestEl.textContent = score;
    if (over) {
      const veil = document.createElement("div");
      veil.className = "game-over-veil";
      veil.innerHTML = `<div>Game over — ${score}</div><button class="btn btn-accent" id="g2048-again">Play again</button>`;
      board.appendChild(veil);
      veil.querySelector("#g2048-again").onclick = reset;
    }
  }

  // input: keyboard
  const keyHandler = e => {
    const map = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 };
    if (map[e.key] === undefined) return;
    e.preventDefault();
    move(map[e.key]);
  };
  document.addEventListener("keydown", keyHandler);

  // input: swipe
  let tx = null, ty = null;
  const ts = e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; };
  const te = e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    tx = ty = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 2 : 0);
    else move(dy > 0 ? 3 : 1);
  };
  board.addEventListener("touchstart", ts, { passive: true });
  board.addEventListener("touchend", te, { passive: true });

  const resizeHandler = () => draw();
  window.addEventListener("resize", resizeHandler);

  document.getElementById("g2048-new").onclick = reset;

  cleanup = () => {
    document.removeEventListener("keydown", keyHandler);
    window.removeEventListener("resize", resizeHandler);
    board.removeEventListener("touchstart", ts);
    board.removeEventListener("touchend", te);
    if (!over && score > 0) setBest("g2048", score);
  };

  reset();
}

/* ============================================================
   SNAKE
   ============================================================ */
function startSnake() {
  current = "snake";
  const R = root();
  R.innerHTML = `
    <div class="game-stage">
      <div class="game-topbar">
        <button class="btn btn-sm" data-game-back>‹ Games</button>
        <span style="flex:1"></span>
        <div class="score-pill"><div class="sp-label">Score</div><div class="sp-val" id="snake-score">0</div></div>
        <div class="score-pill"><div class="sp-label">Best</div><div class="sp-val" id="snake-best">${bestOf("snake")}</div></div>
        <button class="btn btn-sm" id="snake-new">New</button>
      </div>
      <div style="position:relative">
        <canvas id="snake-canvas" width="400" height="400"></canvas>
        <div id="snake-veil"></div>
      </div>
      <div class="dpad">
        <button class="btn d-up" data-dir="up" aria-label="Up">▲</button>
        <button class="btn d-left" data-dir="left" aria-label="Left">◀</button>
        <button class="btn d-down" data-dir="down" aria-label="Down">▼</button>
        <button class="btn d-right" data-dir="right" aria-label="Right">▶</button>
      </div>
      <p style="text-align:center;color:var(--muted);font-size:.76rem;margin-top:10px">Swipe, arrow keys, or buttons. Eat the gems, don't bite yourself.</p>
    </div>`;

  const canvas = document.getElementById("snake-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("snake-score");
  const bestEl = document.getElementById("snake-best");
  const veilWrap = document.getElementById("snake-veil");

  const N = 20, CELL = 400 / N;
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  let snake, dir, nextDir, food, score, dead, timer, started;

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: "down", down: "up", left: "right", right: "left" };

  function reset() {
    snake = [[10, 10], [9, 10], [8, 10]];
    dir = "right"; nextDir = "right";
    score = 0; dead = false; started = false;
    placeFood();
    scoreEl.textContent = "0";
    veilWrap.innerHTML = "";
    stopLoop();
    draw();
    showOverlay("Tap a direction to start");
  }
  function showOverlay(text, withBtn) {
    veilWrap.innerHTML = `<div class="game-over-veil" style="inset:0;position:absolute">
      <div style="font-size:1.05rem;text-align:center;padding:0 14px">${text}</div>
      ${withBtn ? '<button class="btn btn-accent" id="snake-again">Play again</button>' : ""}
    </div>`;
    if (withBtn) veilWrap.querySelector("#snake-again").onclick = reset;
  }
  function clearOverlay() { veilWrap.innerHTML = ""; }
  function placeFood() {
    do {
      food = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)];
    } while (snake.some(s => s[0] === food[0] && s[1] === food[1]));
  }
  function startLoop() {
    stopLoop();
    timer = setInterval(step, Math.max(70, 140 - score * 3));
  }
  function stopLoop() { if (timer) { clearInterval(timer); timer = null; } }

  function setDir(d) {
    if (dead) return;
    if (d === OPP[dir]) return;
    nextDir = d;
    if (!started) { started = true; clearOverlay(); startLoop(); }
  }

  function step() {
    dir = nextDir;
    const [dx, dy] = DIRS[dir];
    const head = [snake[0][0] + dx, snake[0][1] + dy];
    if (head[0] < 0 || head[0] >= N || head[1] < 0 || head[1] >= N ||
        snake.some(s => s[0] === head[0] && s[1] === head[1])) {
      dead = true;
      stopLoop();
      const isRecord = setBest("snake", score);
      showOverlay(`Game over — ${score}${isRecord ? " · New best!" : ""}`, true);
      bestEl.textContent = bestOf("snake");
      return;
    }
    snake.unshift(head);
    if (head[0] === food[0] && head[1] === food[1]) {
      score++;
      scoreEl.textContent = score;
      if (score > bestOf("snake")) bestEl.textContent = score;
      placeFood();
      startLoop(); // speed up
    } else {
      snake.pop();
    }
    draw();
  }

  function draw() {
    ctx.fillStyle = css("--surface") || "#161C24";
    ctx.fillRect(0, 0, 400, 400);
    // subtle grid
    ctx.strokeStyle = css("--surface-2") || "#1D242F";
    ctx.lineWidth = 1;
    for (let i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(400, i * CELL); ctx.stroke();
    }
    // food: little gem (diamond)
    const fx = food[0] * CELL + CELL / 2, fy = food[1] * CELL + CELL / 2, r = CELL * 0.36;
    ctx.fillStyle = css("--amber") || "#F0A93C";
    ctx.beginPath();
    ctx.moveTo(fx, fy - r); ctx.lineTo(fx + r, fy); ctx.lineTo(fx, fy + r); ctx.lineTo(fx - r, fy);
    ctx.closePath(); ctx.fill();
    // snake
    const accent = css("--accent") || "#2FD4BE";
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? accent : `color-mix(in srgb, ${accent} ${Math.max(30, 85 - i * 4)}%, transparent)`;
      const pad = 1.5;
      ctx.beginPath();
      ctx.roundRect(s[0] * CELL + pad, s[1] * CELL + pad, CELL - pad * 2, CELL - pad * 2, 4);
      ctx.fill();
    });
  }

  // input
  const keyHandler = e => {
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (!map[e.key]) return;
    e.preventDefault();
    setDir(map[e.key]);
  };
  document.addEventListener("keydown", keyHandler);

  let tx = null, ty = null;
  const ts = e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; };
  const te = e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    tx = ty = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? "right" : "left");
    else setDir(dy > 0 ? "down" : "up");
  };
  canvas.addEventListener("touchstart", ts, { passive: true });
  canvas.addEventListener("touchend", te, { passive: true });

  Array.from(R.querySelectorAll("[data-dir]")).forEach(b =>
    b.addEventListener("click", () => setDir(b.dataset.dir)));

  document.getElementById("snake-new").onclick = reset;

  cleanup = () => {
    stopLoop();
    document.removeEventListener("keydown", keyHandler);
    canvas.removeEventListener("touchstart", ts);
    canvas.removeEventListener("touchend", te);
    if (!dead && score > 0) setBest("snake", score);
  };

  reset();
}

/* ---------------- public API ---------------- */
window.Games = {
  render() {
    teardown();
    renderPicker();
  },
  pause() {
    // called when user leaves the Break view
    teardown();
    current = null;
  }
};

document.addEventListener("click", e => {
  const back = e.target.closest("[data-game-back]");
  if (back) { teardown(); renderPicker(); return; }
  const tile = e.target.closest(".game-tile");
  if (tile && root() && root().contains(tile)) {
    teardown();
    if (tile.dataset.game === "g2048") start2048();
    if (tile.dataset.game === "snake") startSnake();
  }
});
})();
