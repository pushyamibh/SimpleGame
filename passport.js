const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./db/user");

const logincheck = (username, password, next) => {
  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return next(null, false, { message: "Incorrect username." });
      }
      user.comparePassword(password).then((isValid) => {
        if (!isValid) {
          return next(null, false, { message: "Incorrect password." });
        }
        return next(null, user);
      });
    })
    .catch((err) => {
      next(err);
    });
};

const signinStragety = new LocalStrategy(
  {
    usernameField: "username",
    passwordField: "password",
  },
  logincheck
);

passport.use("local", signinStragety);

// Serialize user into the session using the _id property
passport.serializeUser((user, next) => {
  next(null, user._id);
});

passport.deserializeUser((id, next) => {
  User.findById(id)
    .then((user) => {
      next(null, user);
    })
    .catch((err) => {
      next(err);
    });
});
