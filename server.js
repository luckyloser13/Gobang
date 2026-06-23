const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// --- Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- Serve Static Files ---
app.use(express.static("gobang-live"));

// --- Room Storage ---
const rooms = {};

// --- Generate Room Code ---
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// --- Socket Connection ---
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // --- Create Room ---
  socket.on("create_room", () => {
    // prevent creating multiple rooms
    if (socket.roomCode) return;

    const code = generateRoomCode();
    rooms[code] = {
      players: [socket.id],
      board: Array.from({ length: 21 }, () => Array(20).fill("")),
      currentPlayer: 0,
        firstPlayer: 0,
      gameActive: false
    };
    socket.join(code);
    socket.roomCode = code;
    socket.playerIndex = 0;
    socket.emit("room_created", { roomCode: code, playerIndex: 0 });
    console.log(`Room created: [${code}]`);
    console.log("Active rooms:", Object.keys(rooms));
  });

  // --- Join Room ---
  socket.on("join_room", (rawCode) => {
    // prevent joining multiple rooms
    if (socket.roomCode) return;

    const code = rawCode.trim().toUpperCase();
    const room = rooms[code];

    if (!room) {
      socket.emit("error", "Room not found. Check the code and try again.");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("error", "Room is full.");
      return;
    }

    room.players.push(socket.id);
    room.gameActive = true;
    socket.join(code);
    socket.roomCode = code;
    socket.playerIndex = 1;

    socket.emit("room_joined", { roomCode: code, playerIndex: 1 });
    io.to(code).emit("game_start");
    console.log(`Player joined room: [${code}]`);
  });

  // --- Handle Move ---
  socket.on("make_move", ({ row, col }) => {
    const code = socket.roomCode;
    const room = rooms[code];

    if (!room || !room.gameActive) return;
    if (room.currentPlayer !== socket.playerIndex) return;
    if (room.board[row][col] !== "") return;

    const player = socket.playerIndex === 0 ? "A" : "B";
    room.board[row][col] = player;
    room.currentPlayer = room.currentPlayer === 0 ? 1 : 0;

    io.to(code).emit("move_made", { row, col, player });
  });

  // --- Declare Win ---
  socket.on("declare_win", (player) => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room) return;

    room.gameActive = false;
    io.to(code).emit("game_over", { winner: player });
  });

  // --- Request Restart ---
  socket.on("request_restart", () => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room) return;

    room.board = Array.from({ length: 21 }, () => Array(20).fill(""));
    room.gameActive = true;
    room.firstPlayer = room.firstPlayer === 0 ? 1 : 0;
    room.currentPlayer = room.firstPlayer;

    io.to(code).emit("game_restart", { firstPlayer: room.firstPlayer });
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    const code = socket.roomCode;
    if (code && rooms[code]) {
      io.to(code).emit("player_disconnected", "Opponent disconnected.");
      delete rooms[code];
      console.log(`Room [${code}] closed.`);
    }
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

