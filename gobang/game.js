// --- Constants ---
const ROWS = 25;
const COLS = 20;
const WIN_COUNT = 5;
const PLAYERS = ["A", "B"];

// --- Game State ---
let board = [];
let currentPlayerIndex = 0;
let gameActive = false;
let scores = { A: 0, B: 0 };
let moveHistory = [];
let undosLeft = 5;

// --- HTML Elements ---
const modeSelector = document.getElementById("mode-selector");
const gameScreen = document.getElementById("game-screen");
const boardEl = document.getElementById("board");
const status = document.getElementById("status");
const restartButton = document.getElementById("restart");
const btnStart = document.getElementById("btn-start");
const scoreA = document.getElementById("score-a");
const scoreB = document.getElementById("score-b");
const undoButton = document.getElementById("undo");

// --- Start Game ---
function startGame() {
  modeSelector.style.display = "none";
  gameScreen.style.display = "flex";
  initBoard();
}

// --- Initialize Board ---
function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(""));
  currentPlayerIndex = 0;
  gameActive = true;
  status.textContent = `Player ${PLAYERS[currentPlayerIndex]}'s turn`;
  moveHistory = [];
  undosLeft = 5;
  undoButton.textContent = `Undo (${undosLeft})`;
  undoButton.disabled = false;
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

// --- Handle Cell Click ---
function handleCellClick(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const currentPlayer = PLAYERS[currentPlayerIndex];

  if (!gameActive || board[row][col] !== "") return;

  // Place the mark
  board[row][col] = currentPlayer;
  e.target.textContent = currentPlayer;
  e.target.classList.add(currentPlayer === "A" ? "player-a" : "player-b");
  moveHistory.push({ row, col, player: currentPlayer });


  // Check win
  const winningCells = checkWin(row, col, currentPlayer);
  if (winningCells) {
    highlightWin(winningCells);
    status.textContent = `Player ${currentPlayer} wins!`;
    updateScore(currentPlayer);
    gameActive = false;
    return;
  }

  // Switch turn
  currentPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
  status.textContent = `Player ${PLAYERS[currentPlayerIndex]}'s turn`;
}

// --- Check Win ---
function checkWin(row, col, player) {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
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

  // Go forward
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
    cells.push([r, c]);
    r += dr;
    c += dc;
  }

  // Go backward
  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
    cells.push([r, c]);
    r -= dr;
    c -= dc;
  }

  return cells;
}

function undoMove() {
  if (moveHistory.length === 0 || undosLeft === 0) return;

  const last = moveHistory.pop();
  board[last.row][last.col] = "";
  const index = last.row * COLS + last.col;
  const cell = boardEl.children[index];
  cell.textContent = "";
  cell.classList.remove("player-a", "player-b", "winning");

  // reactivate game in case it was over
  gameActive = true;

  // switch turn back
  currentPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
  status.textContent = `Player ${PLAYERS[currentPlayerIndex]}'s turn`;

  undosLeft--;
  undoButton.textContent = `Undo (${undosLeft})`;
  if (undosLeft === 0) undoButton.disabled = true;
}

// --- Highlight Winning Cells ---
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
function restartGame() {
  gameActive = false;
  boardEl.innerHTML = "";
  modeSelector.style.display = "flex";
  gameScreen.style.display = "none";
}

// --- Event Listeners ---
btnStart.addEventListener("click", startGame);
undoButton.addEventListener("click", undoMove);
restartButton.addEventListener("click", restartGame);