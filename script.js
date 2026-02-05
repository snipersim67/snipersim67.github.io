/* =========================================================
   RIVALS-STYLE SHOOTER — CORE ENGINE
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* =========================
   GLOBAL STATE
========================= */
const keys = {};
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let shooting = false;
let shake = 0;
let gameOver = false;

/* =========================
   PLAYER
========================= */
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 16,
  speed: 5,
  angle: 0,
  hp: 100,
  maxHp: 100,
  dashCooldown: 0
};

/* =========================
   WEAPONS
========================= */
const weapons = {
  rifle: { rate: 90, speed: 11, damage: 12 },
  pistol: { rate: 250, speed: 9, damage: 25 }
};
let currentWeapon = "rifle";

/* =========================
   GAME OBJECTS
========================= */
const bullets = [];
const enemies = [];
let boss = null;

/* =========================
   STATS
========================= */
let score = 0;
let streak = 0;
let highScore = loadSave();

/* =========================
   MAP (TILE WALLS)
========================= */
const map = {
  tile: 50,
  walls: [
    { x: 6, y: 4 },
    { x: 7, y: 4 },
    { x: 8, y: 4 },
    { x: 6, y: 5 }
  ]
};

/* =========================
   INPUT
========================= */
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "1") currentWeapon = "pistol";
  if (e.key === "2") currentWeapon = "rifle";
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
canvas.addEventListener("mousedown", () => shooting = true);
canvas.addEventListener("mouseup", () => shooting = false);

/* =========================
   SHOOTING LOOP
========================= */
setInterval(() => {
  if (!shooting || gameOver) return;
  const w = weapons[currentWeapon];

  bullets.push({
    x: player.x,
    y: player.y,
    a: player.angle + (Math.random() - 0.5) * 0.1,
    s: w.speed,
    d: w.damage,
    r: 3
  });

  shake = 6;
}, 90);

/* =========================
   ENEMY SPAWN
========================= */
function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * canvas.width; y = -30; }
  if (side === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }
  if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 30; }
  if (side === 3) { x = -30; y = Math.random() * canvas.height; }

  enemies.push({ x, y, r: 18, hp: 40, speed: 2.2 });
}
setInterval(spawnEnemy, 800);

/* =========================
   BOSS
========================= */
function spawnBoss() {
  boss = { x: canvas.width / 2, y: 100, r: 45, hp: 500, phase: 1 };
}
setTimeout(spawnBoss, 20000);

/* =========================
   UPDATE
========================= */
function update() {
  if (gameOver) return;

  // Movement
  if (keys.w) player.y -= player.speed;
  if (keys.s) player.y += player.speed;
  if (keys.a) player.x -= player.speed;
  if (keys.d) player.x += player.speed;

  // Dash
  if (keys.shift && player.dashCooldown <= 0) {
    player.x += Math.cos(player.angle) * 120;
    player.y += Math.sin(player.angle) * 120;
    player.dashCooldown = 80;
    shake = 12;
  }
  if (player.dashCooldown > 0) player.dashCooldown--;

  // Aim
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Bullets
  bullets.forEach((b, i) => {
    b.x += Math.cos(b.a) * b.s;
    b.y += Math.sin(b.a) * b.s;
    if (out(b)) bullets.splice(i, 1);
  });

  // Enemies
  enemies.forEach((e, ei) => {
    moveToward(e, player, e.speed);
    if (hit(e, player)) damagePlayer(0.6);
    bullets.forEach((b, bi) => {
      if (hit(e, b)) {
        e.hp -= b.d;
        bullets.splice(bi, 1);
        shake = 5;
        if (e.hp <= 0) killEnemy(ei);
      }
    });
  });

  // Boss
  if (boss) {
    boss.x += Math.sin(Date.now() / 500) * 2;
    bullets.forEach((b, bi) => {
      if (hit(boss, b)) {
        boss.hp -= b.d;
        bullets.splice(bi, 1);
      }
    });
    if (boss.hp <= 0) boss = null;
  }

  clamp(player);
}

/* =========================
   DRAW
========================= */
function draw() {
  ctx.save();
  ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  shake *= 0.9;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap();
  drawPlayer();
  bullets.forEach(drawBullet);
  enemies.forEach(drawEnemy);
  if (boss) drawBoss();
  drawUI();

  ctx.restore();
}

/* =========================
   HELPERS
========================= */
function drawPlayer() {
  shadow(player);
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = "#38bdf8";
  circle(0, 0, player.r);
  ctx.fillRect(0, -4, 28, 8);
  ctx.restore();
}

function drawEnemy(e) {
  shadow(e);
  ctx.fillStyle = "#ef4444";
  circle(e.x, e.y, e.r);
}

function drawBoss() {
  shadow(boss);
  ctx.fillStyle = "#a855f7";
  circle(boss.x, boss.y, boss.r);
}

function drawBullet(b) {
  ctx.fillStyle = "#fbbf24";
  circle(b.x, b.y, b.r);
}

function drawUI() {
  bar(20, 20, 200, player.hp / player.maxHp, "#22c55e");
  ctx.fillStyle = "#e5e7eb";
  ctx.fillText(`Score: ${score}`, 20, 55);
  ctx.fillText(`Streak: ${streak}`, 20, 75);
  ctx.fillText(`Best: ${highScore}`, 20, 95);
}

function drawMap() {
  ctx.fillStyle = "#020617";
  map.walls.forEach(w =>
    ctx.fillRect(w.x * map.tile, w.y * map.tile, map.tile, map.tile)
  );
}

/* =========================
   UTIL
========================= */
function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function shadow(o) {
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(o.x, o.y + o.r + 6, o.r, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}
function hit(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
}
function moveToward(a, b, s) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  a.x += Math.cos(ang) * s;
  a.y += Math.sin(ang) * s;
}
function clamp(o) {
  o.x = Math.max(o.r, Math.min(canvas.width - o.r, o.x));
  o.y = Math.max(o.r, Math.min(canvas.height - o.r, o.y));
}
function out(b) {
  return b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height;
}
function damagePlayer(d) {
  player.hp -= d;
  if (player.hp <= 0) gameOver = true;
}
function killEnemy(i) {
  enemies.splice(i, 1);
  score++;
  streak++;
  if (score > highScore) save(score);
}

/* =========================
   SAVE SYSTEM
========================= */
function save(s) {
  localStorage.setItem("rivalsSave", s);
}
function loadSave() {
  return Number(localStorage.getItem("rivalsSave")) || 0;
}

/* =========================
   LOOP
========================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
