// --- Game State ---
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = false;
let vsAI = false;
let scores = { X: 0, O: 0, Draw: 0 };

// --- Win Conditions ---
const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],             // diagonals
];

// --- Grab HTML Elements ---
const cells = document.querySelectorAll(".cell");
const status = document.getElementById("status");
const restartButton = document.getElementById("restart");
const scoreX = document.getElementById("score-x");
const scoreO = document.getElementById("score-o");
const scoreDraw = document.getElementById("score-draw");
const modeSelector = document.getElementById("mode-selector");
const btnTwoPlayer = document.getElementById("btn-two-player");
const btnVsAI = document.getElementById("btn-vs-ai");

// --- Mode Selection ---
function startGame(mode) {
  vsAI = mode === "ai";
  gameActive = true;
  currentPlayer = "X";
  board = ["", "", "", "", "", "", "", "", ""];
  cells.forEach((cell) => (cell.textContent = ""));
  status.textContent = "Player X's turn";
  modeSelector.style.display = "none";
}

btnTwoPlayer.addEventListener("click", () => startGame("two-player"));
btnVsAI.addEventListener("click", () => startGame("ai"));

// --- Handle Cell Click ---
function handleCellClick(e) {
  const index = e.target.getAttribute("data-index");

  if (board[index] !== "" || !gameActive) return;

  makeMove(index, currentPlayer);

  if (checkWin(board, currentPlayer)) {
    status.textContent = `Player ${currentPlayer} wins!`;
    updateScore(currentPlayer);
    gameActive = false;
    return;
  }

  if (checkDraw(board)) {
    status.textContent = "It's a draw!";
    updateScore("Draw");
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  status.textContent = `Player ${currentPlayer}'s turn`;

  if (vsAI && currentPlayer === "O" && gameActive) {
    setTimeout(aiMove, 400);
  }
}

// --- Make a Move ---
function makeMove(index, player) {
  board[index] = player;
  cells[index].textContent = player;
}

// --- AI Move ---
function aiMove() {
  const bestIndex = getBestMove(board);
  makeMove(bestIndex, "O");

  if (checkWin(board, "O")) {
    status.textContent = "AI wins!";
    updateScore("O");
    gameActive = false;
    return;
  }

  if (checkDraw(board)) {
    status.textContent = "It's a draw!";
    updateScore("Draw");
    gameActive = false;
    return;
  }

  currentPlayer = "X";
  status.textContent = "Player X's turn";
}

// --- Minimax ---
function minimax(boardState, depth, isMaximizing) {
  if (checkWin(boardState, "O")) return 10 - depth;
  if (checkWin(boardState, "X")) return depth - 10;
  if (checkDraw(boardState)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    boardState.forEach((cell, i) => {
      if (cell === "") {
        boardState[i] = "O";
        best = Math.max(best, minimax(boardState, depth + 1, false));
        boardState[i] = "";
      }
    });
    return best;
  } else {
    let best = Infinity;
    boardState.forEach((cell, i) => {
      if (cell === "") {
        boardState[i] = "X";
        best = Math.min(best, minimax(boardState, depth + 1, true));
        boardState[i] = "";
      }
    });
    return best;
  }
}

// --- Get Best Move ---
function getBestMove(boardState) {
  let bestScore = -Infinity;
  let bestIndex = null;

  boardState.forEach((cell, i) => {
    if (cell === "") {
      boardState[i] = "O";
      const score = minimax(boardState, 0, false);
      boardState[i] = "";
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
  });

  return bestIndex;
}

// --- Check Win ---
function checkWin(boardState, player) {
  return winConditions.some(([a, b, c]) =>
    boardState[a] === player &&
    boardState[b] === player &&
    boardState[c] === player
  );
}

// --- Check Draw ---
function checkDraw(boardState) {
  return boardState.every((cell) => cell !== "");
}

// --- Update Scoreboard ---
function updateScore(result) {
  scores[result]++;
  scoreX.textContent = `X : ${scores.X}`;
  scoreO.textContent = `O : ${scores.O}`;
  scoreDraw.textContent = `Draw : ${scores.Draw}`;
}

// --- Restart ---
function restartGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = false;
  cells.forEach((cell) => (cell.textContent = ""));
  status.textContent = "Player X's turn";
  modeSelector.style.display = "flex";
}

// --- Event Listeners ---
cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
restartButton.addEventListener("click", restartGame);