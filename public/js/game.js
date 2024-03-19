// Checkers game board initial state, 0 = empty, 1 = white, 2 = black, 3 = white king, 4 = black king
const startBoard = [
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 0, 2, 0, 2, 0, 2],
  [2, 0, 2, 0, 2, 0, 2, 0],
  [0, 2, 0, 2, 0, 2, 0, 2],
]; // initial state. Each player has a white space at their end of the board

const drawBoard = () => {
  // get the div for turn message
  const turnMessage = document.getElementById("turnMessage");

  // if current player has a turn, display the message
  if (gameObject.turn && gameObject.turn.toString() === player) {
    turnMessage.innerHTML = "It's your turn!";
    timerFunction(); // restart the timer with the updated time remaining
  } else {
    turnMessage.innerHTML = "It's your opponent's turn!";
    clearInterval(timerForGame); // stop the timer if it's not the current player's turn
  }

  // get the p tags for scores
  const whiteScore = document.getElementById("whiteScore");
  const blackScore = document.getElementById("blackScore");

  // update the scores
  whiteScore.innerHTML = `White: ${gameObject.playersScore[0]}`;
  blackScore.innerHTML = `Black: ${gameObject.playersScore[1]}`;

  // Get the div with the id of gameBoard
  const gameBoard = document.getElementById("gameBoard");

  // clear the game board before drawing
  gameBoard.innerHTML = "";

  const boardState = gameObject.boardState;

  // Loop through the boardState array
  for (let i = 0; i < boardState.length; i++) {
    // Create a new row div
    const row = document.createElement("div");

    // Add the class of row to the row div
    row.classList.add("row");

    // Loop through the columns in the row
    for (let j = 0; j < boardState[i].length; j++) {
      // Create a new div for the squares in the row
      const square = document.createElement("div");
      const piece = document.createElement("div");

      // To alternate the colors of the squares
      if (i % 2 === 0) {
        if (j % 2 === 0) {
          square.classList.add("square", "blackBlock");
        } else {
          square.classList.add("square", "whiteBlock");
        }
      } else {
        if (j % 2 !== 0) {
          square.classList.add("square", "blackBlock");
        } else {
          square.classList.add("square", "whiteBlock");
        }
      }

      // Add the piece to the square
      if (boardState[i][j] === 1) {
        piece.classList.add("occupied", "whitePiece");
        // square.classList.add("occupied", "whitePiece");
      } else if (boardState[i][j] === 2) {
        piece.classList.add("occupied", "blackPiece");

        // square.classList.add("occupied", "blackPiece");
      } else if (boardState[i][j] === 3) {
        piece.classList.add("occupied", "whiteKing");
      } else if (boardState[i][j] === 4) {
        piece.classList.add("occupied", "blackKing");
      }

      // Add the click event listener to the square
      square.addEventListener("click", () => {
        squareClicked(i, j);
      });

      // Add the piece to the square
      square.appendChild(piece);

      // Add the square to the row
      row.appendChild(square);
    }

    // Add the row to the game board
    gameBoard.appendChild(row);
  }
};

let firstClickExists = false;
let move = [];
function squareClicked(x, y) {
  // always wait for the player to click on 2 squares
  // the first click will be the piece to move
  // the second click will be the destination square

  if (!firstClickExists) {
    firstClickExists = true;
    move.push({ x, y });
  } else {
    firstClickExists = false;
    move.push({ x, y });

    // get time remaining for the player

    // send the move to the server
    socket.emit("game-move", {
      gameId: gameObject._id.toString(),
      player: player,
      move,
      timeRemaining,
    });

    // clear the move array
    move = [];
  }
}

function timerFunction() {
  const playerColor =
    gameObject.players.findIndex((p) => p._id.toString() === player) === 0
      ? "white"
      : "black";

  const playerIndex = playerColor === "white" ? 0 : 1;

  // initialize the timer countdown for the game using the time remaining for this player
  timeRemaining = gameObject.playersTimeLeft[playerIndex];

  // if the timer is already running, stop it
  if (timerForGame) {
    clearInterval(timerForGame);
  }

  // set the timer to run every second
  timerForGame = setInterval(function () {
    // update the timer
    $("#timer").html(timeRemaining);

    // decrement the time remaining
    timeRemaining--;

    // if the time remaining is less than 0, stop the timer
    if (timeRemaining < 0) {
      socket.emit("time-over", {
        gameId: gameObject._id.toString(),
        player: player,
      });
      clearInterval(timerForGame);
    }
  }, 1000);
}

let socket;
let timerForGame;
let timeRemaining;
$(document).ready(function () {
  // append a timer to the page
  $("#displayMessage").append("<div id='timer'></div>");

  const playerColor =
    gameObject.players.findIndex((p) => p._id.toString() === player) === 0
      ? "white"
      : "black";

  const playerIndex = playerColor === "white" ? 0 : 1;

  // Connect to the socket
  socket = io();

  socket.on("connect", function () {
    console.log("Connected to server");
  });

  socket.on("disconnect", function () {
    console.log("Disconnected from server");
  });

  socket.on("newMessage", function (message) {
    alert(message);
  });

  socket.on(`game-${gameObject._id.toString()}`, function (message) {
    if (message.boardState) {
      gameObject = message;
      drawBoard();
    } else {
      alert(message.message);
    }
  });

  socket.on(`game-${gameObject._id.toString()}-finished`, function (message) {
    alert("Game finished reloading page for results");
    setTimeout(() => {
      location.reload();
    }, 1000);
  });

  socket.on("game-start", function (game) {
    // Update the game object
    gameObject = game;

    // Update the board
    drawBoard();

    // check if game has a start time now
    if (gameObject.start) {
      timerFunction();
    }
  });

  socket.on(`game-${gameObject._id.toString()}-start`, function (game) {
    // Update the game object
    gameObject = game;

    // Update the board
    drawBoard();

    // check if game has a start time now
    if (gameObject.start) {
      timerFunction();
    }
  });

  socket.connect();

  if (!gameObject.playersReady[playerIndex]) {
    // prompt the user to ask if they want to start the game
    const startGame = confirm(
      "Do you want to start the game? Choosing OK, notifies you're ready to play."
    );
    if (startGame) {
      socket.emit("game-ready", {
        gameId: gameObject._id.toString(),
        player: player,
      });
    }
  }

  // if the game has a start time, initialize the timer
  if (gameObject.start && !gameObject.end) {
    // timerFunction();
    // Draw the game board
    drawBoard();
  }
});
