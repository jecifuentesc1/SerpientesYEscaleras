//  Constantes del juego
const gridSize = 10,
  cellSize = 2,
  totalCells = gridSize * gridSize;

//  Escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  70,
  innerWidth / innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

//  Tablero y serpientes/escaleras
const board = [];
const laddersAndSnakes = {
  3: 22,
  5: 8,
  11: 26,
  20: 29,
  27: 1,
  21: 9,
  17: 4,
  19: 7,
  35: 45,
  47: 15,
  39: 60,
  63: 81,
  99: 2,
  91: 50,
  89: 70,
};
// Cargar sonidos
const dadoSound = new Audio('src/audios/dado.mp3');
const moveSound = new Audio('src/audios/mov.mp3');
const ladderSound = new Audio('src/audios/ladder.mp3');
const snakeSound = new Audio('src/audios/snake.mp3');
const winnerSound = new Audio('src/audios/winner.mp3');

const loader = new THREE.TextureLoader();
const snakeTexture = loader.load("src/img/snake.jpg");
const ladderTexture = loader.load("src/img/ladder.jpg");

// Construcción del tablero 10×10
for (let y = 0; y < gridSize; y++) {
  for (let x = 0; x < gridSize; x++) {
    const index = y * gridSize + (y % 2 === 0 ? x : gridSize - 1 - x);
    const geom = new THREE.BoxGeometry(cellSize, 0.2, cellSize);
    let color = (x + y) % 2 === 0 ? 0xffffff : 0xcccccc;
    let texture = null;
    if (laddersAndSnakes[index] !== undefined) {
      if (laddersAndSnakes[index] > index) {
        color = 0x00ff00;
        texture = ladderTexture;
      } else {
        color = 0xff0000;
        texture = snakeTexture;
      }
    }
    const mat = new THREE.MeshBasicMaterial({ color });
    const cell = new THREE.Mesh(geom, mat);
    cell.position.set(x * cellSize, 0, -y * cellSize);
    scene.add(cell);
    board[index] = cell.position.clone();

    // Ícono serpiente/escalera sobre la casilla
    if (texture) {
      const iconGeom = new THREE.PlaneGeometry(1.4, 1.4);
      const iconMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const icon = new THREE.Mesh(iconGeom, iconMat);
      icon.position.set(cell.position.x, 0.21, cell.position.z);
      icon.rotation.x = -Math.PI / 2;
      scene.add(icon);
    }
  }
}

/*//  Jugadores como esferas
const player1 = new THREE.Mesh(
  new THREE.SphereGeometry(0.5),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
const player2 = new THREE.Mesh(
  new THREE.SphereGeometry(0.5),
  new THREE.MeshBasicMaterial({ color: 0x0000ff })
);
player1.position.set(0, 0.6, 0.5);
player2.position.set(0, 0.6, -0.5);
scene.add(player1, player2);*/

// Jugadores como planos con texturas

const player1Texture = loader.load("src/img/player_1.png");
const player2Texture = loader.load("src/img/player_2.png");

const player1Material = new THREE.MeshBasicMaterial({
  map: player1Texture,
  transparent: true,
  side: THREE.DoubleSide,
});
const player2Material = new THREE.MeshBasicMaterial({
  map: player2Texture,
  transparent: true,
  side: THREE.DoubleSide,
});

const player1 = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), player1Material);
const player2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), player2Material);

player1.position.set(0, 1.5, 0.5);
player2.position.set(0, 1.5, -0.5);

// Rotar los planos para que estén de frente a la cámara
player1.rotation.x = 0;
player2.rotation.x = 0;

scene.add(player1, player2);


// Esperar a que ambos modelos estén cargados antes de iniciar el juego
function startGame(numPlayers) {
  if (modelsLoaded < 2) {
    alert("Cargando modelos, por favor espera...");
    return;
  }
  document.getElementById("menu").style.display = "none";
  document.getElementById("rollButton").style.display = "inline-block";
  positions = [0, 0];
  movePlayer(player1, 0);
  movePlayer(player2, 0);
  updateScores();
  isPlaying = true;
  isBot = true; // Jugador 2 siempre bot
  turn = 0;
  jugadorEnTurnoTiro = false;
}
//  Estado del juego
let positions = [0, 0],
  turn = 0,
  isPlaying = false,
  isBot = false,
  jugadorEnTurnoTiro = false,
  resultado = 1;

//  Cámara y luces
camera.position.set((cellSize * gridSize) / 2, 20, cellSize * 6);
camera.lookAt((cellSize * gridSize) / 2, 0, (-cellSize * gridSize) / 2);
scene.add(new THREE.AmbientLight(0xffffff, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

//  Mover jugador con GSAP
function movePlayer(player, index) {
  const target = board[index];
  const offsetZ = player === player1 ? 0.5 : -0.5;
  return gsap.to(player.position, {
    x: target.x,
    z: target.z + offsetZ,
    duration: 1,
    ease: "power1.inOut",
  });
}

//  Actualizar marcador en pantalla
function updateScores() {
  document.getElementById("score1").innerText = positions[0];
  document.getElementById("score2").innerText = positions[1];
}

//  Crear y texturizar dado 2×2×2
const dadoGeom = new THREE.BoxGeometry(2, 2, 2);
const tLoader = new THREE.TextureLoader();
const dadoMats = [
  new THREE.MeshStandardMaterial({
    map: tLoader.load("src/img/facedado1.png"),
    side: THREE.DoubleSide,
  }),
  new THREE.MeshStandardMaterial({
    map: tLoader.load("src/img/facedado2.png"),
    side: THREE.DoubleSide,
  }),
  new THREE.MeshStandardMaterial({
    map: tLoader.load("src/img/facedado3.png"),
    side: THREE.DoubleSide,
  }),
  new THREE.MeshStandardMaterial({
    map: tLoader.load("src/img/facedado4.png"),
    side: THREE.DoubleSide,
  }),
  new THREE.MeshStandardMaterial({
    map: tLoader.load("src/img/facedado5.png"),
    side: THREE.DoubleSide,
  }),
  new THREE.MeshStandardMaterial({
    map: tLoader.load("src/img/facedado6.png"),
    side: THREE.DoubleSide,
  }),
];
const dado = new THREE.Mesh(dadoGeom, dadoMats);
dado.position.set(-32, 1.5, -17);
scene.add(dado);

//  Normales locales de cada cara (en orden de materiales)
const faceNormals = [
  new THREE.Vector3(1, 0, 0), // facedado1.png
  new THREE.Vector3(-1, 0, 0), // facedado2.png
  new THREE.Vector3(0, 1, 0), // facedado3.png
  new THREE.Vector3(0, -1, 0), // facedado4.png
  new THREE.Vector3(0, 0, 1), // facedado5.png
  new THREE.Vector3(0, 0, -1), // facedado6.png
];

//  Detección de cara superior tras rotación
function getUpFace() {
  const upWorld = new THREE.Vector3(0, 1, 0);
  let bestDot = -Infinity,
    bestIndex = 0;
  for (let i = 0; i < faceNormals.length; i++) {
    // transforma normal local → espacio mundial
    const worldNormal = faceNormals[i]
      .clone()
      .applyQuaternion(dado.quaternion)
      .normalize();
    const dot = worldNormal.dot(upWorld);
    if (dot > bestDot) {
      bestDot = dot;
      bestIndex = i;
    }
  }
  // +1 porque materials[0]→1, materials[1]→2, …
  return bestIndex + 1;
}

//  Lógica para mover ficha tras tirada
async function avanzarJugador() {
  if (jugadorEnTurnoTiro) return;
  jugadorEnTurnoTiro = true;

  const player = turn === 0 ? player1 : player2;
  let newIndex = positions[turn] + resultado;

  if (newIndex >= totalCells - 1) {
    alert(`¡Jugador ${turn + 1} ha ganado!`);
    winnerSound.play();
    isPlaying = false;
    return;
  }

  positions[turn] = newIndex;
  moveSound.play();
  await movePlayer(player, newIndex);

  if (laddersAndSnakes[newIndex] !== undefined) {
    const next = laddersAndSnakes[newIndex];
    alert(
      (next > newIndex ? "⬆️ Escalera" : "⬇️ Serpiente") +
        `: Jugador ${turn + 1} va a la casilla ${next}`
    );
    positions[turn] = next;
    await movePlayer(player, next);
    next > newIndex ? ladderSound.play() : snakeSound.play();
  }

  updateScores();
  turn = 1 - turn;
  jugadorEnTurnoTiro = false;

  // Si el segundo jugador es bot, que vuelva a tirar
  if (isBot && turn === 1) {
    setTimeout(() => document.getElementById("rollButton").click(), 500);
  }
}

//  Animar y detectar cara tras giro
document.getElementById("rollButton").addEventListener("click", () => {
  if (!isPlaying || jugadorEnTurnoTiro) return;

  // Cada eje gira 4 vueltas + multiplo de 90° para alinear caras
  const extraX = (Math.floor(Math.random() * 4) * Math.PI) / 2;
  const extraY = (Math.floor(Math.random() * 4) * Math.PI) / 2;
  const extraZ = (Math.floor(Math.random() * 4) * Math.PI) / 2;
  dadoSound.play();

  gsap.to(dado.rotation, {
    x: `+=${Math.PI * 2 * 4 + extraX}`,
    y: `+=${Math.PI * 2 * 4 + extraY}`,
    z: `+=${Math.PI * 2 * 4 + extraZ}`,
    duration: 1,
    ease: "power2.inOut",
    onComplete: () => {
      // Detecta qué cara quedó arriba
      resultado = getUpFace();
      alert(`Jugador ${turn + 1} tiró un ${resultado}`);
      avanzarJugador();
    },
  });
});

//  Iniciar juego
function startGame(numPlayers) {
  document.getElementById("menu").style.display = "none";
  document.getElementById("rollButton").style.display = "inline-block";
  positions = [0, 0];
  movePlayer(player1, 0);
  movePlayer(player2, 0);
  updateScores();
  isPlaying = true;
  isBot = (numPlayers === 1); 
  turn = 0;
  jugadorEnTurnoTiro = false;
}

//  Loop de render
(function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
})();
