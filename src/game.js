// --- Board State ---
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = false;
let vsAI = false;
let scores = { X: 0, O: 0, Draw: 0 };

// --- Phase Tracking ---
let phase = "placement"; // "placement" or "movement"
let piecesPlaced = { X: 0, O: 0 };
let selectedCell = null; // index of selected piece in movement phase

// --- Win Conditions ---
const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// --- Adjacent Cells ---
const adjacentCells = {
  0: [1, 3, 4],
  1: [0, 2, 3, 4, 5],
  2: [1, 4, 5],
  3: [0, 1, 4, 6, 7],
  4: [0, 1, 2, 3, 5, 6, 7, 8],
  5: [1, 2, 4, 7, 8],
  6: [3, 4, 7],
  7: [3, 4, 5, 6, 8],
  8: [4, 5, 7],
};

// --- HTML Elements ---
const cells = document.querySelectorAll(".cell");
const status = document.getElementById("status");
const restartButton = document.getElementById("restart");
const scoreX = document.getElementById("score-x");
const scoreO = document.getElementById("score-o");
const scoreDraw = document.getElementById("score-draw");
const modeSelector = document.getElementById("mode-selector");
const btnTwoPlayer = document.getElementById("btn-two-player");
const btnVsAI = document.getElementById("btn-vs-ai");
const phaseLabel = document.getElementById("phase-label");

// --- Mode Selection ---
function startGame(mode) {
  vsAI = mode === "ai";
  gameActive = true;
  currentPlayer = "X";
  board = ["", "", "", "", "", "", "", "", ""];
  phase = "placement";
  piecesPlaced = { X: 0, O: 0 };
  selectedCell = null;
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("selected", "highlight");
  });
  status.textContent = "Player X's turn";
  phaseLabel.textContent = "Phase: Placement";
  modeSelector.style.display = "none";
}

btnTwoPlayer.addEventListener("click", () => startGame("two-player"));
btnVsAI.addEventListener("click", () => startGame("ai"));

// --- Handle Cell Click ---
function handleCellClick(e) {
  const index = parseInt(e.target.getAttribute("data-index"));
  if (!gameActive) return;

  if (phase === "placement") {
    handlePlacement(index);
  } else {
    handleMovement(index);
  }
}

// --- Placement Phase ---
function handlePlacement(index) {
  if (board[index] !== "") return;
  if (piecesPlaced[currentPlayer] >= 3) return;

  board[index] = currentPlayer;
  cells[index].textContent = currentPlayer;
  piecesPlaced[currentPlayer]++;

  if (checkWin(board, currentPlayer)) {
    endGame(currentPlayer);
    return;
  }

  // check if both players placed all 3 pieces
  if (piecesPlaced.X === 3 && piecesPlaced.O === 3) {
    phase = "movement";
    phaseLabel.textContent = "Phase: Movement";
    status.textContent = `Player ${currentPlayer === "X" ? "O" : "X"}'s turn — select a piece to move`;
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  status.textContent = `Player ${currentPlayer}'s turn`;

  if (vsAI && currentPlayer === "O" && gameActive) {
    setTimeout(aiPlacement, 400);
  }
}

// --- Movement Phase ---
function handleMovement(index) {
  // if no piece selected yet
  if (selectedCell === null) {
    if (board[index] !== currentPlayer) {
      status.textContent = `Select one of your own pieces to move!`;
      return;
    }
    selectedCell = index;
    cells[index].classList.add("selected");
    highlightMoves(index);
    return;
  }

  // deselect if clicking the same cell
  if (selectedCell === index) {
    cells[index].classList.remove("selected");
    clearHighlights();
    selectedCell = null;
    return;
  }

  // try to move to clicked cell
  if (adjacentCells[selectedCell].includes(index) && board[index] === "") {
    // move the piece
    board[index] = currentPlayer;
    board[selectedCell] = "";
    cells[index].textContent = currentPlayer;
    cells[selectedCell].textContent = "";
    cells[selectedCell].classList.remove("selected");
    clearHighlights();
    selectedCell = null;

    if (checkWin(board, currentPlayer)) {
      endGame(currentPlayer);
      return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    status.textContent = `Player ${currentPlayer}'s turn — select a piece to move`;

    if (vsAI && currentPlayer === "O" && gameActive) {
      setTimeout(aiMovement, 400);
    }
  } else if (board[index] === currentPlayer) {
    // switch selection to another own piece
    cells[selectedCell].classList.remove("selected");
    clearHighlights();
    selectedCell = index;
    cells[index].classList.add("selected");
    highlightMoves(index);
  } else {
    status.textContent = `Invalid move! Select an adjacent empty cell.`;
  }
}

// --- Highlight Valid Moves ---
function highlightMoves(index) {
  adjacentCells[index].forEach(adj => {
    if (board[adj] === "") {
      cells[adj].classList.add("highlight");
    }
  });
}

// --- Clear Highlights ---
function clearHighlights() {
  cells.forEach(cell => cell.classList.remove("highlight"));
}

// --- End Game ---
function endGame(winner) {
  status.textContent = `Player ${winner} wins!`;
  updateScore(winner);
  gameActive = false;
}

// --- AI Placement ---
function aiPlacement() {
  const empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  const index = empty[Math.floor(Math.random() * empty.length)];
  handlePlacement(index);
}

// --- AI Movement ---
function aiMovement() {
  const aiPieces = board.map((v, i) => v === "O" ? i : null).filter(v => v !== null);
  for (const piece of aiPieces) {
    for (const adj of adjacentCells[piece]) {
      if (board[adj] === "") {
        selectedCell = piece;
        handleMovement(adj);
        return;
      }
    }
  }
}

// --- Check Win ---
function checkWin(boardState, player) {
  return winConditions.some(([a, b, c]) =>
    boardState[a] === player &&
    boardState[b] === player &&
    boardState[c] === player
  );
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
  phase = "placement";
  piecesPlaced = { X: 0, O: 0 };
  selectedCell = null;
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("selected", "highlight");
  });
  status.textContent = "Player X's turn";
  phaseLabel.textContent = "Phase: Placement";
  modeSelector.style.display = "flex";
}

// --- Event Listeners ---
cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
restartButton.addEventListener("click", restartGame);