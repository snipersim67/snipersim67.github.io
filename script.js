const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.font = "14px JetBrains Mono";

// ======================
// INPUT
// ======================
const keys = {};
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let shooting = false;

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener("mousedown", () => shooting = true);
canvas.addEventListener("mouseup", () => shooting = false);

// ======================
// PLAYER
// ======================
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 16,
  speed: 5,
  hp: 100
};

// ======================
// OBJECTS
// ======================
const bullets = [];
const enemies = [];
let score = 0;
let gameOver = false;

// ======================
// SPAWN ENEMIES
// ======================
function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) { x = Math.random() * canvas.width; y = -30; }
  if (side === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }
  if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 30; }
  if (side === 3) { x = -30; y = Math.random() * canvas.height; }

  enemies.push({ x, y, r: 18, hp: 40, speed: 2 });
}
setInterval(spawnEnemy, 800);

// ======================
// SHOOTING
// ======================
setInterval(() => {
  if (!shooting || gameOver) return;

  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  bullets.push({
    x: player.x,
    y: player.y,
    r: 4,
    speed: 10,
    angle
  });
}, 120);

// ======================
// UPDATE
// ======================
function update() {
  if (gameOver) return;

  // Movement
  if (keys.w) player.y -= player.speed;
  if (keys.s) player.y += player.speed;
  if (keys.a) player.x -= player.speed;
  if (keys.d) player.x += player.speed;

  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
  player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

  // Bullets
  bullets.forEach((b, i) => {
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;

    if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height)
      bullets.splice(i, 1);
  });

  // Enemies
  enemies.forEach((e, ei) => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);

    e.x += Math.cos(a) * e.speed;
    e.y += Math.sin(a) * e.speed;

    if (dist < e.r + player.r) {
      player.hp -= 0.5;
      if (player.hp <= 0) gameOver = true;
    }

    bullets.forEach((b, bi) => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.r) {
        e.hp -= 20;
        bullets.splice(bi, 1);

        if (e.hp <= 0) {
          enemies.splice(ei, 1);
          score++;
        }
      }
    });
  });
}

// ======================
// DRAW
// ======================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  // Bullets
  ctx.fillStyle = "#fbbf24";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Enemies
  ctx.fillStyle = "#ef4444";
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // UI
  ctx.fillStyle = "#e5e7eb";
  ctx.fillText(`HP: ${Math.max(0, Math.floor(player.hp))}`, 15, 25);
  ctx.fillText(`Score: ${score}`, 15, 45);

  if (gameOver) {
    ctx.font = "40px JetBrains Mono";
    ctx.fillText("GAME OVER", canvas.width / 2 - 140, canvas.height / 2);
  }
}

// ======================
// LOOP
// ======================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
