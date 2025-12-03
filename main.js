// ----------------------
// VARIABLES
// ----------------------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let money = parseInt(localStorage.getItem("money") || "150");
let enemies = [];
let towers = [];
let projectiles = [];
let canPlaceTower = false;

let path = [];
let towerSpots = [];
let fondoActual = "";
let fondoImg = new Image();

document.getElementById("money").innerText = money;

// ----------------------
// CARGAR MAPA ALEATORIO
// ----------------------
async function cargarMapaAleatorio() {
  const lista = await fetch("maps/maps.json").then(r => r.json());
  const archivo = lista[Math.floor(Math.random() * lista.length)];

  const mapa = await fetch("maps/" + archivo).then(r => r.json());

  console.log("MAPA CARGADO:", mapa.name);

  path = mapa.path;
  towerSpots = mapa.towerSpots;
  fondoActual = "assets/" + mapa.background;

  fondoImg.src = fondoActual;
}

cargarMapaAleatorio();

// ----------------------
// ENEMIGOS
// ----------------------
function spawnEnemy() {
  enemies.push({
    x: path[0].x,
    y: path[0].y,
    speed: 1,
    hp: 20,
    pathIndex: 0
  });
}

setInterval(spawnEnemy, 2000);

// Movimiento
function moveEnemy(enemy) {
  const target = path[enemy.pathIndex + 1];
  if (!target) return;

  let dx = target.x - enemy.x;
  let dy = target.y - enemy.y;
  let dist = Math.hypot(dx, dy);

  if (dist < 1) {
    enemy.pathIndex++;
    return;
  }

  enemy.x += (dx / dist) * enemy.speed;
  enemy.y += (dy / dist) * enemy.speed;
}

// ----------------------
// TIENDAS Y TORRES
// ----------------------
canvas.addEventListener("click", e => {
  if (!canPlaceTower) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // verificar spots válidos
  let valido = towerSpots.some(s => Math.hypot(s.x - x, s.y - y) < 20);
  if (!valido) return;

  towers.push({
    x, y,
    range: 80,
    cooldown: 0
  });

  money -= 100;
  localStorage.setItem("money", money);
  document.getElementById("money").innerText = money;
  canPlaceTower = false;
});

function buyTower() {
  if (money >= 100) {
    canPlaceTower = true;
  }
}

// ----------------------
// TORRES ATACAN
// ----------------------
function updateTowers() {
  towers.forEach(t => {
    if (t.cooldown > 0) t.cooldown--;

    let target = null;
    let minDist = Infinity;

    enemies.forEach(e => {
      let d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d < t.range && d < minDist) {
        minDist = d;
        target = e;
      }
    });

    if (target && t.cooldown === 0) {
      projectiles.push({
        x: t.x,
        y: t.y,
        target,
        speed: 3
      });
      t.cooldown = 40;
    }
  });
}

// ----------------------
// PROYECTILES
// ----------------------
function updateProjectiles() {
  projectiles.forEach((p, i) => {
    let dx = p.target.x - p.x;
    let dy = p.target.y - p.y;
    let dist = Math.hypot(dx, dy);

    if (dist < 5) {
      p.target.hp -= 10;
      projectiles.splice(i, 1);
      return;
    }

    p.x += (dx / dist) * p.speed;
    p.y += (dy / dist) * p.speed;
  });
}

function resetProgress() {
  localStorage.setItem("money", 150);
  money = 150;
  document.getElementById("money").innerText = money;
}

// ----------------------
// DIBUJAR
// ----------------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(fondoImg, 0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let p of path) ctx.lineTo(p.x, p.y);
  ctx.stroke();

  towerSpots.forEach(s => {
    ctx.strokeStyle = "cyan";
    ctx.strokeRect(s.x - 15, s.y - 15, 30, 30);
  });

  enemies.forEach(e => {
    ctx.fillStyle = "red";
    ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
  });

  towers.forEach(t => {
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  projectiles.forEach(p => {
    ctx.fillStyle = "white";
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  });
}

// ----------------------
// LOOP
// ----------------------
function gameLoop() {
  enemies.forEach(moveEnemy);

  enemies = enemies.filter(e => {
    if (e.hp <= 0) {
      money += 10;
      localStorage.setItem("money", money);
      document.getElementById("money").innerText = money;
      return false;
    }
    return true;
  });

  updateTowers();
  updateProjectiles();
  draw();

  requestAnimationFrame(gameLoop);
}

gameLoop();
