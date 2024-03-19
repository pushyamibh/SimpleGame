// Entry point for the application

// Setup the server

// setup environment variables
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const app = express();
const morgan = require("morgan");
const passport = require("passport");
const { signupApi } = require("./apis/user");
const { viewGames, createGame, getGame } = require("./apis/home");
const expressRateLimit = require("express-rate-limit");
const expressMongoSanitize = require("express-mongo-sanitize");

// https server
const https = require("https");

const socket = require("./sockets");
const appSession = require("./session");

const { Router } = express;

const expressLogs = fs.createWriteStream(
  path.join(__dirname, "logs/express.log"),
  { flags: "a" } // 'a' means appending (old data will be preserved)
);

// Setup morgan to log to express.log
app.use(morgan("combined", { stream: expressLogs }));

require("./db");

require("./passport");

const limiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter); // apply to all requests

// security headers using helmet
const crypto = require("crypto");

app.use((req, res, next) => {
  // Set nonce for CSP
  res.locals.nonce = crypto.randomBytes(64).toString("hex");
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        connectSrc: [
          "'self'",
          `wss://${process.env.SERVER}:${process.env.PORT}`,
        ],
        scriptSrc: [
          "'self'",
          "sha256-f9d3428a29c4155a1c43d76887f589c8fbda121d4ff6d6761bdd3fd01ea605bc", // game.js
          "sha256-f420549bb836c6600f0849cf20be7274774b5a0add77ba3a1462a5e72ca28690", // home.js
          "sha256-a6f3f0faea4b3d48e03176341bef0ed3151ffbf226d4c6635f1c6039c0500575", // jquery
          "sha256-7cdf2f717d942f24c3b295531c4b5e2bc85ddeb4006f9b61362c1a923016ef94", // semantic
          "sha256-907ae7db99cd3733cf8d56529300bb9e6e2c1dfc69ad9a05a7f875618d64a14a", // socket.io
          (req, res) => {
            return `'nonce-${res.locals.nonce}'`;
          },
        ],
      },
    }, // set csp headers
    hidePoweredBy: true, // remove the X-Powered-By header
  })
);

// Setup express to use json and urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup mongo sanitize
// By default, $ and . characters are removed completely from user-supplied input in the following places:
// - req.body
// - req.params
// - req.headers
// - req.query
// This prevents multiple forms of NoSQL injection attacks.
app.use(expressMongoSanitize());

// Setup pug view engine and views folder
app.set("view engine", "pug");
app.set("views", "./views");

// Setup static files
app.use(express.static("public"));

// Setup session
app.use(appSession);

// Setup passport
app.use(passport.initialize());
app.use(passport.session());

// Start the server
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.locals.user = req.user?._id;
  next();
});

// Unauthenticated routes
// signup routes
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  signupApi(req, res);
});

// to prevent brute force attacks
const ExpressBrute = require("express-brute");
const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

// signin routes
app.get("/signin", (req, res) => {
  res.render("signin");
});

app.post(
  "/signin",
  bruteforce.prevent,
  passport.authenticate("local", {
    failureRedirect: "/signin",
    successRedirect: "/home",
  }),
  function (req, res) {
    res.redirect("/home");
  }
);

// authentication routes
const authenticatedRouter = Router();

app.use(
  "/",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect("/signin");
    }
  },
  authenticatedRouter
);

// index route
authenticatedRouter.get("/", (req, res) => {
  res.render("home");
});

// home route
authenticatedRouter.get("/home", (req, res) => {
  viewGames(req, res);
  // res.render("game");
});

// game route
authenticatedRouter.get("/game", (req, res) => {
  res.render("game");
});

// create game route
authenticatedRouter.post("/createGame", (req, res) => {
  createGame(req, res);
});

// get game route
authenticatedRouter.get("/game/:id", (req, res) => {
  getGame(req, res);
});

authenticatedRouter.get("/signout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/signin");
  });
});

const httpsOptions = {
  key: fs.readFileSync("./server.key"),
  cert: fs.readFileSync("./server.crt"),
};

// Setup server
const server = https.createServer(httpsOptions, app);

// Setup socket
socket(server);

server.listen(port, () => console.log(`Listening on port ${port}...`));
