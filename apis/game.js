const Game = require("../db/game");

const updatePlayerReadySocket = async (socket, data) => {
  try {
    const { gameId, player } = data;

    const game = await Game.findById(gameId).populate({
      path: "players",
      select: "username _id",
    });

    // check if game exists
    if (!game) {
      return socket.emit("game-start", {
        message: "Game does not exist",
      });
    }

    // check if user is part of game
    if (!game.players.find((p) => p._id.toString() === player.toString())) {
      return socket.emit("game-start", {
        message: "You are not part of this game",
      });
    }

    // mark player as ready
    game.playersReady[
      game.players.findIndex((p) => p._id.toString() === player)
    ] = true;

    // check if both players are ready
    if (game.playersReady[0] && game.playersReady[1]) {
      game.start = new Date(); // set start time of game to now
      game.turn = game.players[0]._id; // set turn to white player
    }

    // update game
    await game.save();

    // get updated game
    const updatedGame = await Game.findById(gameId)
      .populate({
        path: "players",
        select: "username _id",
      })
      .populate({
        path: "winner",
        select: "username _id",
      });

    const gameChannel = `game-${gameId.toString()}-start`;

    return [gameChannel, updatedGame];
  } catch (error) {
    socket.emit("game-start", {
      message: error.message,
    });
  }
};

const validMovesForPiece = (playerPlayingAs, board, fromX, fromY) => {
  // get all valid moves for a piece at from position
  const validMoves = [];

  // check if the piece at from position is a king piece
  const isKingPiece = [3, 4].includes(board[fromX][fromY]);

  // check if the piece at from position is a normal piece
  const isNormalPiece = [1, 2].includes(board[fromX][fromY]);

  // set the direction of the piece based on the player playing as
  const direction = playerPlayingAs === "white" ? 1 : -1;

  // in case of a king piece, we can move in both directions diagonally
  if (isKingPiece) {
    // check if we can move diagonally forward left direction and stay within the board
    if (fromX + direction >= 0 && fromX + direction < 8 && fromY - 1 >= 0) {
      // check if the position is empty
      if (board[fromX + direction][fromY - 1] === 0) {
        validMoves.push({ x: fromX + direction, y: fromY - 1 });
      } else {
        // check if the position is occupied by an opponent piece
        if (
          (playerPlayingAs === "white" &&
            [2, 4].includes(board[fromX + direction][fromY - 1])) ||
          (playerPlayingAs === "black" &&
            [1, 3].includes(board[fromX + direction][fromY - 1]))
        ) {
          // check if we can jump over the opponent piece and stay within the board
          if (
            fromX + 2 * direction >= 0 &&
            fromX + 2 * direction < 8 &&
            fromY - 2 >= 0
          ) {
            // check if the position is empty
            if (board[fromX + 2 * direction][fromY - 2] === 0) {
              validMoves.push({ x: fromX + 2 * direction, y: fromY - 2 });
            }
          }
        }
      }
    }

    // check if we can move diagonally forward right direction
    if (fromX + direction >= 0 && fromX + direction < 8 && fromY + 1 < 8) {
      // check if the position is empty
      if (board[fromX + direction][fromY + 1] === 0) {
        validMoves.push({ x: fromX + direction, y: fromY + 1 });
      } else {
        // check if the position is occupied by an opponent piece
        if (
          (playerPlayingAs === "white" &&
            [2, 4].includes(board[fromX + direction][fromY + 1])) ||
          (playerPlayingAs === "black" &&
            [1, 3].includes(board[fromX + direction][fromY + 1]))
        ) {
          // check if we can jump over the opponent piece and stay within the board
          if (
            fromX + 2 * direction >= 0 &&
            fromX + 2 * direction < 8 &&
            fromY + 2 < 8
          ) {
            // check if the position is empty
            if (board[fromX + 2 * direction][fromY + 2] === 0) {
              validMoves.push({ x: fromX + 2 * direction, y: fromY + 2 });
            }
          }
        }
      }
    }

    // check if we can move diagonally backward left direction
    if (fromX - direction >= 0 && fromY - 1 >= 0) {
      // check if the position is empty
      if (board[fromX - direction][fromY - 1] === 0) {
        validMoves.push({ x: fromX - direction, y: fromY - 1 });
      } else {
        // check if the position is occupied by an opponent piece
        if (
          (playerPlayingAs === "white" &&
            [2, 4].includes(board[fromX - direction][fromY - 1])) ||
          (playerPlayingAs === "black" &&
            [1, 3].includes(board[fromX - direction][fromY - 1]))
        ) {
          // check if we can jump over the opponent piece
          if (fromX - 2 * direction >= 0 && fromY - 2 >= 0) {
            // check if the position is empty
            if (board[fromX - 2 * direction][fromY - 2] === 0) {
              validMoves.push({ x: fromX - 2 * direction, y: fromY - 2 });
            }
          }
        }
      }
    }

    // check if we can move diagonally backward right direction
    if (fromX - direction >= 0 && fromY + 1 < 8) {
      // check if the position is empty
      if (board[fromX - direction][fromY + 1] === 0) {
        validMoves.push({ x: fromX - direction, y: fromY + 1 });
      } else {
        // check if the position is occupied by an opponent piece
        if (
          (playerPlayingAs === "white" &&
            [2, 4].includes(board[fromX - direction][fromY + 1])) ||
          (playerPlayingAs === "black" &&
            [1, 3].includes(board[fromX - direction][fromY + 1]))
        ) {
          // check if we can jump over the opponent piece
          if (fromX - 2 * direction >= 0 && fromY + 2 < 8) {
            // check if the position is empty
            if (board[fromX - 2 * direction][fromY + 2] === 0) {
              validMoves.push({ x: fromX - 2 * direction, y: fromY + 2 });
            }
          }
        }
      }
    }
  }

  // in case of a normal piece, we can move in only one direction diagonally
  if (isNormalPiece) {
    // check if we can move diagonally forward left direction
    if (fromX + direction >= 0 && fromY - 1 >= 0) {
      // check if the position is empty
      if (board[fromX + direction][fromY - 1] === 0) {
        validMoves.push({ x: fromX + direction, y: fromY - 1 });
      } else {
        // check if the position is occupied by an opponent piece
        if (
          (playerPlayingAs === "white" &&
            [2, 4].includes(board[fromX + direction][fromY - 1])) ||
          (playerPlayingAs === "black" &&
            [1, 3].includes(board[fromX + direction][fromY - 1]))
        ) {
          // check if we can jump over the opponent piece and stay within the board
          if (
            fromX + 2 * direction >= 0 &&
            fromX + 2 * direction < 8 &&
            fromY - 2 >= 0
          ) {
            // check if the position is empty
            if (board[fromX + 2 * direction][fromY - 2] === 0) {
              validMoves.push({ x: fromX + 2 * direction, y: fromY - 2 });
            }
          }
        }
      }
    }

    // check if we can move diagonally forward right direction
    if (fromX + direction >= 0 && fromY + 1 < 8) {
      // check if the position is empty
      if (board[fromX + direction][fromY + 1] === 0) {
        validMoves.push({ x: fromX + direction, y: fromY + 1 });
      } else {
        // check if the position is occupied by an opponent piece
        if (
          (playerPlayingAs === "white" &&
            [2, 4].includes(board[fromX + direction][fromY + 1])) ||
          (playerPlayingAs === "black" &&
            [1, 3].includes(board[fromX + direction][fromY + 1]))
        ) {
          // check if we can jump over the opponent piece
          if (fromX + 2 * direction >= 0 && fromY + 2 < 8) {
            // check if the position is empty
            if (board[fromX + 2 * direction][fromY + 2] === 0) {
              validMoves.push({ x: fromX + 2 * direction, y: fromY + 2 });
            }
          }
        }
      }
    }
  }

  return validMoves;
};

const isValidMove = (playerPlayingAs, board, move) => {
  // checkers game logic
  const allowedPiecesForBlack = [2, 4]; // 2 is normal piece, 4 is king piece
  const allowedPiecesForWhite = [1, 3]; // 1 is normal piece, 3 is king piece

  const [{ x: fromX, y: fromY }, { x: toX, y: toY }] = move;

  const pieceAtFromPosition = board[fromX][fromY];
  const pieceAtToPosition = board[toX][toY];

  // check if the piece at from position is of the same color as the player playing
  if (
    (playerPlayingAs === "white" &&
      !allowedPiecesForWhite.includes(pieceAtFromPosition)) ||
    (playerPlayingAs === "black" &&
      !allowedPiecesForBlack.includes(pieceAtFromPosition))
  ) {
    return [false, false, board, "You cannot move this piece, it is not yours"];
  }

  // check if the to position is empty
  if (pieceAtToPosition !== 0) {
    return [
      false,
      false,
      board,
      "You cannot move to this position, it is occupied",
    ];
  }

  // check if the move is valid and update the board if it is

  // get all the valid moves for the piece at from position
  const validMovesForPieceValue = validMovesForPiece(
    playerPlayingAs,
    board,
    fromX,
    fromY
  );

  if (validMovesForPieceValue.length === 0) {
    return [false, false, board, "Ran out of moves or not a valid move"];
  }

  // check if the move is valid
  const isValidMove = validMovesForPieceValue.find(
    (move) => move.x === toX && move.y === toY
  );

  if (isValidMove) {
    // update the board
    board[fromX][fromY] = 0;

    // check if the piece at from position is a king piece
    const isKingPiece = [3, 4].includes(pieceAtFromPosition);

    // check if the piece at from position is a normal piece
    const isNormalPiece = [1, 2].includes(pieceAtFromPosition);

    // check if it is a single move or a jump move
    const isSingleMove =
      Math.abs(fromX - toX) === 1 && Math.abs(fromY - toY) === 1;

    if (isSingleMove) {
      board[toX][toY] = pieceAtFromPosition;
    } else {
      // if it is a jump move, then we need to remove the opponent piece
      const opponentPieceX = (fromX + toX) / 2;
      const opponentPieceY = (fromY + toY) / 2;
      board[opponentPieceX][opponentPieceY] = 0;
      board[toX][toY] = pieceAtFromPosition;
    }

    // check if the normal piece has reached the end of the board
    if (isNormalPiece) {
      if (playerPlayingAs === "white" && toX === 7) {
        board[toX][toY] = 3; // set the piece to a king piece
      } else if (playerPlayingAs === "black" && toX === 0) {
        board[toX][toY] = 4; // set the piece to a king piece
      }
    }

    return [true, false, board, "Valid move"];
  }

  // by default, the move is invalid
  return [false, false, board, "Invalid move"];
};

const handleMove = async (socket, data) => {
  try {
    const { gameId, player, move, timeRemaining } = data;

    // get game
    const game = await Game.findById(gameId).populate({
      path: "players",
      select: "username _id",
    });

    // check if game exists
    if (!game) {
      return socket.emit("newMessage", {
        message: "Game does not exist",
      });
    }

    const gameChannel = `game-${gameId}`;

    // check if user is part of game
    if (!game.players.find((p) => p._id.toString() === player.toString())) {
      return socket.emit(gameChannel, {
        message: "You are not part of this game",
      });
    }

    // check if game has started
    if (!game.start) {
      return socket.emit(gameChannel, {
        message: "Game has not started yet",
      });
    }

    // check if game has ended
    if (game.end) {
      return socket.emit(gameChannel, {
        message: "Game has ended",
      });
    }

    // check if it is the player's turn
    if (game.turn.toString() !== player.toString()) {
      return socket.emit(gameChannel, {
        message: "It is not your turn",
      });
    }

    const playerPlayingAs =
      game.players.findIndex((p) => p._id.toString() === player.toString()) ===
      0
        ? "white"
        : "black";

    if (timeRemaining <= 0) {
      const playerIndex = playerPlayingAs === "white" ? 0 : 1;

      // get index of opponent player
      const opponentPlayerIndex = playerIndex === 0 ? 1 : 0;

      const winner = game.players[opponentPlayerIndex]; // set winner to opponent player as the player ran out of time

      const updatedGame = await Game.findOneAndUpdate(
        { _id: gameId },
        {
          history: [...game.history, { player, move, timeRemaining: 0 }],
          end: new Date(),
          winner,
        },
        { new: true }
      ).populate({
        path: "players",
        select: "username _id",
      });

      const gameFinishedChannel = `game-${gameId}-finished`;

      return [gameFinishedChannel, updatedGame];
    }

    // check if move is valid or not and also update the board if it is valid
    // and if the move resulted in a game ending
    const [isValidMoveResponse, resultInEnd, updatedBoard, invalidReason] =
      isValidMove(playerPlayingAs, game.boardState, move);

    if (!isValidMoveResponse) {
      return socket.emit(gameChannel, {
        message: invalidReason || "Invalid move",
      });
    }

    const moveForHistory = {
      player,
      move,
      timeRemaining,
    };

    // get score for both players
    const numberOfWhitePieces = updatedBoard
      .flat()
      .filter((p) => [1, 3].includes(p)).length;

    const numberOfBlackPieces = updatedBoard
      .flat()
      .filter((p) => [2, 4].includes(p)).length;

    const whiteScore = 12 - numberOfBlackPieces;
    const blackScore = 12 - numberOfWhitePieces;

    let updateObject = {
      history: [...game.history, moveForHistory],
      boardState: updatedBoard,
      turn: game.players.find((p) => p._id.toString() !== player.toString())
        ._id,
      playersScore: [whiteScore, blackScore],
    };

    const playerIndex = playerPlayingAs === "white" ? 0 : 1;

    updateObject.playersLastMoveTime = game.playersLastMoveTime;

    updateObject.playersLastMoveTime[playerIndex] = new Date(); // set last move time for player

    // timeleft
    updateObject.playersTimeLeft = game.playersTimeLeft;

    updateObject.playersTimeLeft[playerIndex] = timeRemaining; // set time left for player

    if (resultInEnd) {
      updateObject.end = new Date(); // set end time of game to now
    }

    // if move is valid update the game
    const updatedGame = await Game.findOneAndUpdate(
      { _id: gameId },
      updateObject,
      { new: true }
    )
      .populate({
        path: "players",
        select: "username _id",
      })
      .populate({
        path: "winner",
        select: "username _id",
      });

    // if it is a valid move, emit the updated game to all players
    return [gameChannel, updatedGame];
  } catch (error) {
    socket.emit("newMessage", {
      message: error.message,
    });
  }
};

const handleTimeOver = async (socket, data) => {
  try {
    const { gameId, player } = data;

    // get game
    const game = await Game.findById(gameId).populate({
      path: "players",
      select: "username _id",
    });

    // check if game exists
    if (!game) {
      return socket.emit("newMessage", {
        message: "Game does not exist",
      });
    }

    const gameChannel = `game-${gameId}`;
    const gameFinishedChannel = `game-${gameId}-finished`;

    // check if user is part of game
    if (!game.players.find((p) => p._id.toString() === player.toString())) {
      return socket.emit(gameChannel, {
        message: "You are not part of this game",
      });
    }

    // check if game has started
    if (!game.start) {
      return socket.emit(gameChannel, {
        message: "Game has not started yet",
      });
    }

    // check if game has ended
    if (game.end) {
      return socket.emit(gameChannel, {
        message: "Game has ended",
      });
    }

    const playerPlayingAs =
      game.players.findIndex((p) => p._id.toString() === player.toString()) ===
      0
        ? "white"
        : "black";

    // end the game
    const playerIndex = playerPlayingAs === "white" ? 0 : 1;

    // get index of opponent player
    const opponentPlayerIndex = playerIndex === 0 ? 1 : 0;

    const winner = game.players[opponentPlayerIndex]; // set winner to opponent player as the player ran out of time

    const updatedGame = await Game.findOneAndUpdate(
      { _id: gameId },
      {
        winner,
        end: new Date(),
        history: [...game.history, { player, move: null, timeRemaining: 0 }],
      },
      { new: true }
    )
      .populate({
        path: "players",
        select: "username _id",
      })
      .populate({
        path: "winner",
        select: "username _id",
      });

    return [gameFinishedChannel, updatedGame];
  } catch (error) {
    socket.emit("newMessage", {
      message: error.message,
    });
  }
};

module.exports = {
  updatePlayerReadySocket,
  handleMove,
  handleTimeOver,
};