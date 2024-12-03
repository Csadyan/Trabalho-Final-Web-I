const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let player = {
  x: 650,
  y: 300,
  width: 30,
  height: 30,
  speed: 3,
  health: 20,
  knockback: -10
};

let mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

let projectiles = [];
let enemyProjectiles = [];
let enemies = [];

let keys = {
  w: false,
  a: false,
  s: false,
  d: false
};

let pistol_ammo=160
let rifle_ammo=240
let shotgun_ammo=30
let current_ammo=160
let previous_ammo="pistol"

let weaponisshotgun=false
let isShooting = false;
let canShoot = true;
let shootingInterval = 600;

let shootingSoundPath = 'SONS/ARMAS/_sub_tiro_unico.mp3';
let menuSoundtrack = new Audio('SONS/soundtrack.mp3');
let inGameMusic = new Audio('SONS/inGameMusic.mp3')

let currentWave = 0;
let enemiesInWave = 12;
let waveSpawned = false;
let waveActive = false;

let storeIsOpen = false

const enemyKnockback = 55;

let money = 100
let waveTimer = 0;
let timerInterval;
let waveCountdown = 5;
const playerImg = new Image();
playerImg.src = "player.png";


const backgroundImg = new Image();
backgroundImg.src = 'background.png';  

function drawBackground() {
  context.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height); 
}

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() in keys) {
    keys[e.key.toLowerCase()] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key.toLowerCase() in keys) {
    keys[e.key.toLowerCase()] = false;
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
  isShooting = true;
});

canvas.addEventListener('mouseup', () => {
  isShooting = false;
});


function shootProjectile(isshotgun = false) {
  if (current_ammo>=1){
    current_ammo-=1
    let shootingSound = new Audio(shootingSoundPath)
    shootingSound.play();

    const baseAngle = Math.atan2(mouse.y - (player.y + player.height / 2), mouse.x - (player.x + player.width / 2));
    const spread = 0.1; 
    const numProjectiles = isshotgun ? 9 : 1;
  
  
    for (let i = 0; i < numProjectiles; i++) {
      const angleOffset = (i - Math.floor(numProjectiles / 2)) * spread; // Calculate angle offset for each projectile
      const angle = baseAngle + angleOffset; // Adjust the base angle
  
      const velocity = {
        x: Math.cos(angle) * 7,
        y: Math.sin(angle) * 7
      };
  
      projectiles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: 5,
        velocity: velocity
      });
    }
  }
}

document.addEventListener('keydown', function(event) {
  if (previous_ammo=="pistol"){
    pistol_ammo=current_ammo
  }
  else if (previous_ammo=="rifle"){
    rifle_ammo=current_ammo
  }
  else if (previous_ammo=="shotgun"){
    shotgun_ammo=current_ammo
  }

  if (event.key === '1') {
    playerImg.src = "player.png";
    shootingInterval=600;
    current_ammo=pistol_ammo;
    previous_ammo="pistol"
    weaponisshotgun=false;
  }
  if (event.key === '2') {
    playerImg.src = "Player_rifle.png";
    shootingInterval=150;
    current_ammo=rifle_ammo;
    previous_ammo="rifle"
    weaponisshotgun=false;
  }
  if (event.key === '3') {
    playerImg.src = "Player_shotgun.png";
    current_ammo=shotgun_ammo;
    previous_ammo="shotgun"
    shootingInterval=900;
    weaponisshotgun=true;
  }

  if (event.key==='i' && currentWave>=1){
    openStore();
  }
});

function openStore() {
  if (storeIsOpen === false) {
    document.getElementById('Loja').style.display = 'block';
    storeIsOpen = true

  }
  else {
    document.getElementById('Loja').style.display = 'none';
    storeIsOpen = false
  }
}


function startWaveTimer() {
  waveTimer = 5;
  timerInterval = setInterval(() => {
    waveTimer--;
    if (waveTimer <= 0) {
      clearInterval(timerInterval);
      waveSpawned = false;  
    }
  }, 1000);
}


function displayAmmoCount() {
  context.fillStyle = 'black';
  context.font = '20px Arial';
  context.fillText(`Muniçao: ${current_ammo}`, canvas.width - 320, 30);
}

function displayWaveCount() {
  context.fillStyle = 'black';
  context.font = '20px Arial';
  context.fillText(`Wave: ${currentWave}`, canvas.width - 120, 60);
}

function displayMoneyCount() {
  context.fillStyle = 'black';
  context.font = '20px Arial';
  context.fillText(`Dinheiro: ${money}`, canvas.width - 320, 60);
}

function displayEnemyCount() {
  context.fillStyle = 'black';
  context.font = '20px Arial';
  context.fillText(`Inimigos restantes: ${enemies.length}`, canvas.width - 600, 30);
}

function stopWaveTimer() {
  clearInterval(timerInterval);
}

function displayWaveTimer() {
  context.fillStyle = 'black';
  context.font = '20px Arial';
  context.fillText(`Tempo: ${waveTimer} s`, canvas.width - 120, 30);
}


const enemyImages = {};
const enemyTypes = ['normal', 'blue', 'red', 'yellow'];

function preloadImages() {
  enemyTypes.forEach(type => {
    const img = new Image();
    img.src = `enemy${enemyTypes.indexOf(type) + 1}.png`;
    enemyImages[type] = img;
  });
}

preloadImages(); 

function spawnWave() {
  if (enemies.length == 0 && waveSpawned && !waveTimer) {
    waveActive = false;
    startWaveTimer();
  }

  if (enemies.length === 0 && !waveActive && waveTimer <= 0) {
    waveSpawned = true;
    currentWave++;
    for (let i = 0; i < enemiesInWave; i++) {
      spawnEnemy();
    }
    enemiesInWave += 5;
    waveActive = true;
    stopWaveTimer();
  }
}


function spawnEnemy() {
  const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

  while (true){
    x= Math.random() * (canvas.width - 20);
    y= Math.random() * (canvas.height - 20);

    if (x <= canvas.width/3.3 || x >= canvas.width/1.5  ) {
      break
    };
  }

  const enemy = {
    x:x,
    y:y,
    width: 30,
    height: 30,
    height: 30,
    speed: 1,
    health: 2+ currentWave/4,
    type: enemyType,
    canMove: true
  };

  if (enemyType === 'blue') {
    enemy.speed = 2;
    enemy.health = 1 + currentWave/5;
  } else if (enemyType === 'red') {
    enemy.speed = 0.5;
    enemy.health = 5+ currentWave/3;
  } else if (enemyType === 'yellow') {
    enemy.range = 300;
    enemy.canShoot = true;
  }

  enemies.push(enemy);
}

function spawnEnemyAtPosition(x, y) {
  const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

  const enemy = {
    x: x,
    y: y,
    width: 30,
    height: 30,
    speed: 1,
    health: 2+ currentWave/4,
    type: enemyType,
    canMove: true
  };

  if (enemyType === 'blue') {
    enemy.speed = 2;
    enemy.health = 1 + currentWave/5;
  } else if (enemyType === 'red') {
    enemy.speed = 0.5;
    enemy.health = 5+ currentWave/3;
  } else if (enemyType === 'yellow') {
    enemy.range = 300;
    enemy.canShoot = true;
  }

  enemies.push(enemy);
}

function drawPlayer() {
  const angle = Math.atan2(mouse.y - (player.y + player.height / 2), mouse.x - (player.x + player.width / 2));
  context.save();
  context.translate(player.x + player.width / 2, player.y + player.height / 2);
  context.rotate(angle + Math.PI / 2);
  context.drawImage(playerImg, -player.width / 2, -player.height / 2, 30, 50);
  context.restore();
}

function drawHealth() {
  context.fillStyle = 'black';
  context.font = '20px Arial';
  context.fillText(`Vida: ${player.health}`, 10, 30);
}

function drawMousePointer() {
  context.beginPath();
  context.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
  context.strokeStyle = 'red';
  context.lineWidth = 2;
  context.stroke();
  context.closePath();
}

function drawProjectiles() {
  projectiles.forEach((proj, projIndex) => {
    proj.x += proj.velocity.x;
    proj.y += proj.velocity.y;

    if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
      projectiles.splice(projIndex, 1);
    }

    context.beginPath();
    context.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    context.fillStyle = 'black';
    context.fill();
    context.closePath();
  });
}

function drawEnemyProjectiles() {
  enemyProjectiles.forEach((proj, projIndex) => {
    proj.x += proj.velocity.x;
    proj.y += proj.velocity.y;

    if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
      enemyProjectiles.splice(projIndex, 1);
    }


    if (isCollidingCircleRect(proj, player)) {
      player.health -= 1;
      enemyProjectiles.splice(projIndex, 1);
    }

    context.beginPath();
    context.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    context.fillStyle = 'red';
    context.fill();
    context.closePath();
  });
}

function isCollidingCircleRect(circle, rect) {
  const rectX = rect.x + 20; 
  const rectY = rect.y;     
  const distX = Math.abs(circle.x - rectX - 15);
  const distY = Math.abs(circle.y - rectY - 15);

  if (distX > (15 + circle.radius)) return false;
  if (distY > (15 + circle.radius)) return false;

  if (distX <= 15) return true;
  if (distY <= 15) return true;

  const dx = distX - 15;
  const dy = distY - 15;
  return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

function shootEnemyProjectile(enemy) {
  const angle = Math.atan2(player.y + player.height / 2 - enemy.y, player.x + player.width / 2 - enemy.x);
  const velocity = {
    x: Math.cos(angle) * 3,
    y: Math.sin(angle) * 3
  };
  enemyProjectiles.push({
    x: enemy.x + enemy.width / 2,
    y: enemy.y + enemy.height / 2,
    radius: 5,
    velocity: velocity,
    angle: angle
  });
}

function updatePlayerMovement() {
  if (keys.w) player.y -= player.speed;
  if (keys.s) player.y += player.speed;
  if (keys.a) player.x -= player.speed;
  if (keys.d) player.x += player.speed;

  player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
  player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
}

function drawEnemies() {
  enemies.forEach((enemy, enemyIndex) => {
    const angle = Math.atan2(player.y + player.height / 2 - enemy.y, player.x + player.width / 2 - enemy.x);

    if (enemy.type === 'yellow' && !enemy.canMove) {
    } else {
      enemy.x += Math.cos(angle) * enemy.speed;
      enemy.y += Math.sin(angle) * enemy.speed;
    }

    projectiles.forEach((proj, projIndex) => {
      if (isCollidingCircleRect(proj, enemy)) {
        enemy.health -= 1;
        projectiles.splice(projIndex, 1);
        if (enemy.health <= 0) {
          enemies.splice(enemyIndex, 1);
          money += Math.ceil(Math.random()*(10+currentWave/2))
        }
      }
    });

    if (isCollidingCircleRect({
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      radius: enemy.width / 2
    }, player)) {
      player.health -= 1;
      player.x -= Math.cos(angle) * player.knockback;
      player.y -= Math.sin(angle) * player.knockback;
      enemy.x -= Math.cos(angle) * enemyKnockback;
      enemy.y -= Math.sin(angle) * enemyKnockback;
      player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
      player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
    }

    if (enemy.type === 'yellow') {
      const distanceToPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
      if (distanceToPlayer < enemy.range && enemy.canShoot) {
        shootEnemyProjectile(enemy);
        enemy.canShoot = false;
        enemy.canMove = false; 
        setTimeout(() => {
          enemy.canShoot = true;
          enemy.canMove = true; 
        }, 1000);
      }
    }

    
    context.save();
    context.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    context.rotate(angle - Math.PI / 2);
    context.drawImage(enemyImages[enemy.type], -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
    context.restore();
  });
}

function gameOver() {
  stopWaveTimer();
  document.getElementById('gameOver').style.display = 'block';
}

function updateGame() {
  drawBackground();

  if (player.health > 0) {
    inGameMusic.play()
    updatePlayerMovement();
    drawPlayer();
    drawHealth();
    drawMousePointer();
    drawProjectiles();
    drawEnemyProjectiles();
    drawEnemies();
    displayWaveTimer();
    displayAmmoCount();
    displayEnemyCount();
    displayWaveCount();
    displayMoneyCount();
    if (isShooting && canShoot) {
      shootProjectile(weaponisshotgun);
      canShoot = false;
      setTimeout(() => canShoot = true, shootingInterval);
    }

    spawnWave(); 

  } else {
    gameOver();
  }

  requestAnimationFrame(updateGame);
}


window.onload = function() {
  menuSoundtrack.play()
};

document.getElementById('playButton').addEventListener('click', () => {
  document.getElementById('menu').style.display = 'none';
  menuSoundtrack.pause();
  canvas.style.display = 'block';
  updateGame();
});

document.getElementById('controlsButton').addEventListener('click', () => {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('controles').style.display = 'flex';
});

document.getElementById('returnButton').addEventListener('click', () => {
  document.getElementById('menu').style.display = 'flex';
  document.getElementById('controles').style.display = 'none';
});