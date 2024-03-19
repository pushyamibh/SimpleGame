const session = require("express-session");

const appSession = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    path: "/",
  }, // for https only
});

module.exports = appSession;
