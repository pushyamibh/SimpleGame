const User = require("../db/user");

const signupApi = async (req, res) => {
  try {
    const { username, password, confirm } = req.body;

    if (!username || !password || !confirm) {
      return res.render("signup", { message: "Please fill all fields" });
    }

    if (password !== confirm) {
      return res.render("signup", { message: "Passwords do not match" });
    }

    // validate password
    if (
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        password
      ) === false
    ) {
      return res.render("signup", { message: "Password is not strong enough" });
    }

    const user = new User({ username, password });
    await user.save();

    // return res.redirect("index", {
    //   title: "Checkers Game",
    //   message: "Signup successful",
    // });

    return res.redirect(200, "index", {
      title: "Checkers Game",
      message: "Signup successful",
    });
  } catch (error) {
    return res.render("signup", { message: error.message });
  }
};

module.exports = { signupApi };
