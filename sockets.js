const { Server } = require("socket.io");
const appSession = require("./session");
const {
  updatePlayerReadySocket,
  handleMove,
  handleTimeOver,
} = require("./apis/game");

const passport = require("passport");

const socket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use((socket, next) => {
    appSession(socket.request, {}, next);
  });

  io.use((socket, next) => {
    passport.initialize()(socket.request, {}, next);
  });

  io.use((socket, next) => {
    passport.session()(socket.request, {}, next);
  });

  io.use((socket, next) => {
    if (socket.request.user) {
      next();
    } else {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("game-ready", async (data) => {
      const response = await updatePlayerReadySocket(socket, data);

      if (typeof response === "object") {
        const [gameChannel, update] = response;

        // Send the update to the game channel
        io.emit(gameChannel, update);
      }
    });

    socket.on("time-over", async (data) => {
      const response = await handleTimeOver(socket, data);

      if (typeof response === "object") {
        const [gameChannel, update] = response;

        // Send the update to the game channel
        io.emit(gameChannel, update);
      }
    });

    socket.on("game-move", async (data) => {
      const response = await handleMove(socket, data);

      if (typeof response === "object") {
        const [gameChannel, update] = response;

        // Send the update to the game channel
        io.emit(gameChannel, update);
      }
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};

module.exports = socket;
