// --- Constants ---
const ROWS = 20;
const COLS = 25;
const WIN_COUNT = 5;

// --- Game State ---
let board = [];
let gameActive = false;
let myPlayerIndex = null;
let currentPlayerIndex = 0;
let scores = { A: 0, B: 0 };

// --- Socket Connection ---
const socket = io();

// --- HTML Elements ---
const roomScreen = document.getElementById("room-screen");
const gameScreen = document.getElementById("game-screen");
const boardEl = document.getElementById("board");
const status = document.getElementById("status");
const restartButton = document.getElementById("restart");
const btnCreate = document.getElementById("btn-create");
const btnJoin = document.getElementById("btn-join");
const roomCodeInput = document.getElementById("room-code-input");
const roomCodeDisplay = document.getElementById("room-code-display");
const roomCodeText = document.getElementById("room-code-text");
const waitingText = document.getElementById("waiting-text");
const errorMessage = document.getElementById("error-message");
const roomLabel = document.getElementById("room-label");
const playerLabel = document.getElementById("player-label");
const scoreA = document.getElementById("score-a");
const scoreB = document.getElementById("score-b");

// --- Helper: Show Error ---
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove("hidden");
  setTimeout(() => errorMessage.classList.add("hidden"), 4000);
}

// --- Helper: Get Player Symbol ---
function getSymbol(playerIndex) {
  return playerIndex === 0 ? "A" : "B";
}

// --- Create Room ---
btnCreate.addEventListener("click", () => {
  socket.emit("create_room");
});

// --- Join Room ---
btnJoin.addEventListener("click", () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (code.length !== 4) {
    showError("Please enter a valid 4 letter room code.");
    return;
  }
  socket.emit("join_room", code);
});

// --- Socket: Room Created ---
socket.on("room_created", ({ roomCode, playerIndex }) => {
  myPlayerIndex = playerIndex;
  roomCodeText.textContent = roomCode;
  roomCodeDisplay.classList.remove("hidden");
});

// --- Socket: Room Joined ---
socket.on("room_joined", ({ roomCode, playerIndex }) => {
  myPlayerIndex = playerIndex;
});

// --- Socket: Game Start ---
socket.on("game_start", ({ message }) => {
  roomScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  const symbol = getSymbol(myPlayerIndex);
  playerLabel.innerHTML = `You are playing as: <span style="color:${symbol === "A" ? "#00ffff" : "#00ff00"}">${symbol}</span>`;
  roomLabel.textContent = `ROOM: ${roomCodeText.textContent}`;
  initBoard();
});

// --- Socket: Error ---
socket.on("error", (msg) => {
  showError(msg);
});

// --- Initialize Board ---
function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(""));
  currentPlayerIndex = 0;
  gameActive = true;
  updateStatus();
  renderBoard();
}

// --- Render Board ---
function renderBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("click", handleCellClick);
      boardEl.appendChild(cell);
    }
  }
}

// --- Update Status ---
function updateStatus() {
  const currentSymbol = getSymbol(currentPlayerIndex);
  if (currentPlayerIndex === myPlayerIndex) {
    status.textContent = "Your turn";
  } else {
    status.textContent = `Waiting for Player ${currentSymbol}...`;
  }
}

// --- Handle Cell Click ---
function handleCellClick(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);

  if (!gameActive) return;
  if (currentPlayerIndex !== myPlayerIndex) return;
  if (board[row][col] !== "") return;

  socket.emit("make_move", { row, col });
}

// --- Socket: Move Made ---
socket.on("move_made", ({ row, col, player }) => {
  board[row][col] = player;
  const index = row * COLS + col;
  const cell = boardEl.children[index];
  cell.textContent = player;
  cell.classList.add(player === "A" ? "player-a" : "player-b");

  const winningCells = checkWin(row, col, player);
  if (winningCells) {
    highlightWin(winningCells);
    socket.emit("declare_win", player);
    return;
  }

  currentPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
  updateStatus();
});

// --- Socket: Game Over ---
socket.on("game_over", ({ winner }) => {
  status.textContent = `Player ${winner} wins!`;
  updateScore(winner);
  gameActive = false;
});

// --- Socket: Game Restart ---
socket.on("game_restart", () => {
  initBoard();
});

// --- Socket: Player Disconnected ---
socket.on("player_disconnected", (msg) => {
  status.textContent = msg;
  gameActive = false;
});

// --- Check Win ---
function checkWin(row, col, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of directions) {
    const cells = getCellsInDirection(row, col, dr, dc, player);
    if (cells.length >= WIN_COUNT) return cells;
  }
  return null;
}

// --- Get Cells In Direction ---
function getCellsInDirection(row, col, dr, dc, player) {
  const cells = [[row, col]];
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
    cells.push([r, c]);
    r += dr;
    c += dc;
  }
  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
    cells.push([r, c]);
    r -= dr;
    c -= dc;
  }
  return cells;
}

// --- Highlight Win ---
function highlightWin(winningCells) {
  winningCells.forEach(([r, c]) => {
    const index = r * COLS + c;
    boardEl.children[index].classList.add("winning");
  });
}

// --- Update Score ---
function updateScore(result) {
  scores[result]++;
  scoreA.textContent = `A : ${scores.A}`;
  scoreB.textContent = `B : ${scores.B}`;
}

// --- Restart ---
restartButton.addEventListener("click", () => {
  socket.emit("request_restart");
});