const Game = require("../db/game");

const viewGames = async (req, res) => {
  try {
    const games = await Game.find({})
      .populate({
        path: "players",
        select: "username _id",
      })
      .populate({
        path: "winner",
        select: "username _id",
      });
    res.render("home", { games });
  } catch (error) {
    res.render("home", { message: error.message });
  }
};

const createGame = async (req, res) => {
  try {
    let { color: playAsColor } = req.body;

    playAsColor = playAsColor.toLowerCase();

    // create game
    if (playAsColor === "white") {
      const game = new Game({ players: [req.user._id, null] });
      await game.save();
    } else {
      const game = new Game({ players: [null, req.user._id] });
      await game.save();
    }

    // redirect to home
    res.redirect("/home");
  } catch (error) {
    res.render("home", { message: error.message });
  }
};

const getGame = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await Game.findById(id)
      .populate({
        path: "players",
        select: "username _id",
      })
      .populate({
        path: "winner",
        select: "username _id",
      });

    // check if game exists
    if (!game) {
      return res.render("home", { message: "Game does not exist" });
    }

    // check if user is in game already and requesting to play
    if (
      (game.players[0] &&
        game.players[0]._id.toString() === req.user._id.toString()) ||
      (game.players[1] &&
        game.players[1]._id.toString() === req.user._id.toString())
    ) {
      return res.render("game", { game, nonceForScript: res.locals.nonce });
    }

    // check if game is full
    if (game.players[0] && game.players[1]) {
      return res.render("home", { message: "Game is full" });
    }

    // check which color to play as
    let playAsColor = "white";
    if (game.players[0]) {
      playAsColor = "black";
    }

    // add user to game
    if (playAsColor === "white") {
      game.players[0] = req.user._id.toString();
    } else {
      game.players[1] = req.user._id.toString();
    }

    // update game
    await game.save();

    const updatedGame = await Game.findById(id).populate({
      path: "players",
      select: "username _id",
    });

    res.render("game", { game: updatedGame, nonceForScript: res.locals.nonce });
  } catch (error) {
    res.render("home", { message: error.message });
  }
};

module.exports = {
  viewGames,
  createGame,
  getGame,
};
