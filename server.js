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
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [socket.id],
      board: Array.from({ length: 20 }, () => Array(25).fill("")),
      currentPlayer: 0,
      gameActive: false
    };
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerIndex = 0;
    socket.emit("room_created", { roomCode, playerIndex: 0 });
    console.log(`Room created: ${roomCode}`);
    console.log("All rooms:", Object.keys(rooms));

  });

  // --- Join Room ---
  socket.on("join_room", (roomCode) => {
    roomCode = roomCode.trim().toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("error", "Room not found.");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("error", "Room is full.");
      return;
    }

    room.players.push(socket.id);
    room.gameActive = true;
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerIndex = 1;

    socket.emit("room_joined", { roomCode, playerIndex: 1 });
    io.to(roomCode).emit("game_start", { message: "Both players connected. Game starting!" });
    console.log(`Player joined room: ${roomCode}`);
  });

  // --- Handle Move ---
  socket.on("make_move", ({ row, col }) => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];

    if (!room || !room.gameActive) return;
    if (room.currentPlayer !== socket.playerIndex) return;
    if (room.board[row][col] !== "") return;

    const player = socket.playerIndex === 0 ? "A" : "B";
    room.board[row][col] = player;
    room.currentPlayer = room.currentPlayer === 0 ? 1 : 0;

    io.to(roomCode).emit("move_made", { row, col, player });
  });

  // --- Handle Win ---
  socket.on("declare_win", (player) => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    if (!room) return;

    room.gameActive = false;
    io.to(roomCode).emit("game_over", { winner: player });
  });

  // --- Handle Restart ---
  socket.on("request_restart", () => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    if (!room) return;

    room.board = Array.from({ length: 20 }, () => Array(25).fill(""));
    room.currentPlayer = 0;
    room.gameActive = true;

    io.to(roomCode).emit("game_restart");
  });

  // --- Handle Disconnect ---
  socket.on("disconnect", () => {
    const roomCode = socket.roomCode;
    if (roomCode && rooms[roomCode]) {
      io.to(roomCode).emit("player_disconnected", "Opponent disconnected.");
      delete rooms[roomCode];
      console.log(`Room ${roomCode} closed.`);
    }
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});