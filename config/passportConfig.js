const db = require("../db/queries");
const bcrypt = require("bcrypt");

const strategy = async (username, password, done) => {
  try {
    const user = await db.getUserByUsername({ username });

    if (!user) {
      return done(null, false, { message: "Incorrect username" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return done(null, false, { message: "Incorrect password" });
    }

    // Return user if both username and password are correct
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

const serializeUser = (user, done) => {
  done(null, user.id);
};

const deserializeUser = async (id, done) => {
  try {
    const user = await db.getUserById({ id });

    done(null, user);
  } catch (err) {
    done(err);
  }
};

module.exports = {
  strategy,
  serializeUser,
  deserializeUser,
};
