const database = require("./index");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema for a checkers game, which also stores the game history
const gameSchema = new Schema(
  {
    players: {
      type: [Schema.Types.ObjectId], // White player is at index 0, black player is at index 1
      required: true,
      ref: "User",
    },
    playersReady: {
      type: [Schema.Types.Boolean], // White player is at index 0, black player is at index 1
      default: [false, false],
    },
    playersScore: {
      type: [Schema.Types.Number], // White player is at index 0, black player is at index 1
      default: [0, 0],
    },
    playersLastMoveTime: {
      type: [Schema.Types.Date],
      default: [],
    },
    playersTimeLeft: {
      type: [Schema.Types.Number],
      default: [60, 60], // 60 seconds for each player by default (for demo purposes)
    },
    history: {
      type: Schema.Types.Array,
      default: [],
    },
    boardState: {
      type: Schema.Types.Array,
      default: [
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2, 0, 2, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
      ],
    },
    turn: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    start: {
      type: Schema.Types.Date,
    },
    end: {
      type: Schema.Types.Date,
    },
  },
  { timestamps: true }
);

module.exports = database.model("Game", gameSchema);
