// --- Game State ---
let ROWS = 21;
let COLS = 20;
const WIN_COUNT = 5;

let players = [];
let currentPlayerIndex = 0;
let board = [];
let gameActive = false;
let moveHistory = [];
let undosLeft = 5;
let playerCount = 0;
let symbolsChosen = [];
let currentSetupPlayer = 0;

// --- HTML Elements ---
const screenPlayerCount = document.getElementById("screen-player-count");
const screenSymbolSelect = document.getElementById("screen-symbol-select");
const screenBoardSize = document.getElementById("screen-board-size");
const gameScreen = document.getElementById("game-screen");
const boardEl = document.getElementById("board");
const status = document.getElementById("status");
const scoreboard = document.getElementById("scoreboard");
const restartButton = document.getElementById("restart");
const undoButton = document.getElementById("undo");
const symbolPrompt = document.getElementById("symbol-prompt");
const symbolInput = document.getElementById("symbol-input");
const symbolError = document.getElementById("symbol-error");
const btnConfirmSymbol = document.getElementById("btn-confirm-symbol");
const symbolsChosenEl = document.getElementById("symbols-chosen");
const inputRows = document.getElementById("input-rows");
const inputCols = document.getElementById("input-cols");
const btnStartGame = document.getElementById("btn-start-game");

// --- Step 1: Player Count Selection ---
document.querySelectorAll(".count-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    playerCount = parseInt(btn.getAttribute("data-count"));
    currentSetupPlayer = 0;
    symbolsChosen = [];
    symbolsChosenEl.innerHTML = "";
    symbolPrompt.textContent = `Player 1, choose your symbol`;
    symbolInput.value = "";
    screenPlayerCount.classList.add("hidden");
    screenSymbolSelect.classList.remove("hidden");
    screenSymbolSelect.style.display = "flex";
  });
});

// --- Step 2: Symbol Selection ---
btnConfirmSymbol.addEventListener("click", confirmSymbol);
symbolInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") confirmSymbol();
});

function confirmSymbol() {
  const symbol = symbolInput.value.trim().toUpperCase();

  if (symbol.length !== 1) {
    showSymbolError("Please enter exactly one character!");
    return;
  }

  if (symbolsChosen.includes(symbol)) {
    showSymbolError("Symbol already taken!");
    return;
  }

  symbolsChosen.push(symbol);
  symbolInput.value = "";
  symbolError.classList.add("hidden");

  // show chosen symbol
  const tag = document.createElement("div");
  tag.classList.add("chosen-symbol");
  tag.textContent = symbol;
  symbolsChosenEl.appendChild(tag);

  currentSetupPlayer++;

  if (currentSetupPlayer < playerCount) {
    symbolPrompt.textContent = `Player ${currentSetupPlayer + 1}, choose your symbol`;
    symbolInput.focus();
  } else {
    // all symbols chosen, go to board size screen
    screenSymbolSelect.classList.add("hidden");
    screenBoardSize.classList.remove("hidden");
    screenBoardSize.style.display = "flex";
  }
}

function showSymbolError(msg) {
  symbolError.textContent = msg;
  symbolError.classList.remove("hidden");
  setTimeout(() => symbolError.classList.add("hidden"), 3000);
}

// --- Step 3: Board Size & Start ---
btnStartGame.addEventListener("click", () => {
  const rows = parseInt(inputRows.value);
  const cols = parseInt(inputCols.value);

  if (rows < 10 || rows > 50 || cols < 10 || cols > 50) {
    alert("Rows and columns must be between 10 and 50.");
    return;
  }

  ROWS = rows;
  COLS = cols;

  // build players array from chosen symbols
  players = symbolsChosen.map((symbol, i) => ({
    symbol,
    score: 0,
    name: `Player ${i + 1}`
  }));

  screenBoardSize.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameScreen.style.display = "flex";

  initBoard();
});

// --- Initialize Board ---
function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(""));
  currentPlayerIndex = 0;
  gameActive = true;
  moveHistory = [];
  undosLeft = 5;
  undoButton.textContent = `Undo (${undosLeft})`;
  undoButton.disabled = false;
  updateStatus();
  renderScoreboard();
  renderBoard();
}

// --- Render Board ---
function renderBoard() {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, 40px)`;
  boardEl.style.gridTemplateRows = `repeat(${ROWS}, 40px)`;

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

// --- Render Scoreboard ---
function renderScoreboard() {
  scoreboard.innerHTML = "";
  players.forEach(p => {
    const el = document.createElement("div");
    el.id = `score-${p.symbol}`;
    el.textContent = `${p.name} (${p.symbol}) : ${p.score}`;
    scoreboard.appendChild(el);
  });
}

// --- Update Status ---
function updateStatus() {
  const p = players[currentPlayerIndex];
  status.textContent = `${p.name} (${p.symbol})'s turn`;
}

// --- Handle Cell Click ---
function handleCellClick(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const currentPlayer = players[currentPlayerIndex];

  if (!gameActive || board[row][col] !== "") return;

  board[row][col] = currentPlayer.symbol;
  e.target.textContent = currentPlayer.symbol;
  moveHistory.push({ row, col, playerIndex: currentPlayerIndex });

  const winningCells = checkWin(row, col, currentPlayer.symbol);
  if (winningCells) {
    highlightWin(winningCells);
    status.textContent = `${currentPlayer.name} (${currentPlayer.symbol}) wins!`;
    currentPlayer.score++;
    renderScoreboard();
    gameActive = false;
    return;
  }

  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updateStatus();
}

// --- Check Win ---
function checkWin(row, col, symbol) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of directions) {
    const cells = getCellsInDirection(row, col, dr, dc, symbol);
    if (cells.length >= WIN_COUNT) return cells;
  }
  return null;
}

// --- Get Cells In Direction ---
function getCellsInDirection(row, col, dr, dc, symbol) {
  const cells = [[row, col]];
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === symbol) {
    cells.push([r, c]);
    r += dr;
    c += dc;
  }
  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === symbol) {
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

// --- Undo ---
function undoMove() {
  if (moveHistory.length === 0 || undosLeft === 0) return;

  const last = moveHistory.pop();
  board[last.row][last.col] = "";
  const index = last.row * COLS + last.col;
  const cell = boardEl.children[index];
  cell.textContent = "";
  cell.classList.remove("winning");

  gameActive = true;
  currentPlayerIndex = last.playerIndex;
  updateStatus();

  undosLeft--;
  undoButton.textContent = `Undo (${undosLeft})`;
  if (undosLeft === 0) undoButton.disabled = true;
}

// --- Restart ---
function restartGame() {
  gameScreen.classList.add("hidden");
  gameScreen.style.display = "none";
  screenPlayerCount.classList.remove("hidden");
  screenPlayerCount.style.display = "flex";
  players = [];
  symbolsChosen = [];
  symbolsChosenEl.innerHTML = "";
  currentSetupPlayer = 0;
}

// --- Event Listeners ---
restartButton.addEventListener("click", restartGame);
undoButton.addEventListener("click", undoMove);