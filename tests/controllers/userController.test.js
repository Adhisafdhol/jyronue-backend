const request = require("supertest");
const db = require("../../db/queries");

const express = require("express");
const app = express();

const session = require("express-session");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportConfig = require("../../config/passportConfig");
passport.use(new LocalStrategy(passportConfig.strategy));
passport.serializeUser(passportConfig.serializeUser);
passport.deserializeUser(passportConfig.deserializeUser);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    cookie: {
      secure: false,
    },
    secret: "test",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.session());

const userRouter = require("../../routes/user");
app.use("/user", userRouter);

// Integration tests

describe("Test user signup post route", () => {
  beforeAll(async () => {
    try {
      await db.deleteUserByUsername({ username: "test_user_it_1" });
    } catch (err) {
      console.log("nothing to delete");
    }
  });

  test("Cannot create an account without username", (done) => {
    request(app)
      .post("/user/signup")
      .type("form")
      .send({
        username: "",
        password: "12345678",
      })
      .expect("Content-Type", /json/)
      .expect({
        message: "Failed to create user account",
        errors: [
          {
            field: "username",
            value: "",
            msg: "Username is required",
          },
        ],
      })
      .expect(422, done);
  });

  test("Creating an account with proper fields will be successful", (done) => {
    request(app)
      .post("/user/signup")
      .type("form")
      .send({
        username: "test_user_it_1",
        password: "12345678",
      })
      .expect("Content-Type", /json/)
      .expect({
        message: "Successfully created an account with username test_user_it_1",
      })
      .expect(200, done);
  });

  test("Cannot create an account with username longer than 32 characters will fail", (done) => {
    request(app)
      .post("/user/signup")
      .type("form")
      .send({
        username: "abcdefghijklmnopqrstuvwxyz123456789",
        password: "12345678",
      })
      .expect("Content-Type", /json/)
      .expect({
        message: "Failed to create user account",
        errors: [
          {
            field: "username",
            value: "abcdefghijklmnopqrstuvwxyz123456789",
            msg: "Username cannot exceed 32 characters",
          },
        ],
      })
      .expect(422, done);
  });
  test("Cannot create an account with username that has already been used", (done) => {
    request(app)
      .post("/user/signup")
      .type("form")
      .send({
        username: "test_user_it_1",
        password: "12345678",
      })
      .expect("Content-Type", /json/)
      .expect({
        message: "Failed to create user account",
        errors: [
          {
            field: "username",
            value: "test_user_it_1",
            msg: "Username is already taken",
          },
        ],
      })
      .expect(422, done);
  });
  test("Cannot create an account with password less than 8 characters long", (done) => {
    request(app)
      .post("/user/signup")
      .type("form")
      .send({
        username: "test_user_it_2",
        password: "1234567",
      })
      .expect("Content-Type", /json/)
      .expect({
        message: "Failed to create user account",
        errors: [
          {
            field: "password",
            value: "1234567",
            msg: "Password must contain at least 8 characters",
          },
        ],
      })
      .expect(422, done);
  });
  test("Cannot create an account with taken username even if it has different cases", (done) => {
    request(app)
      .post("/user/signup")
      .type("form")
      .send({
        username: "Test_user_it_1",
        password: "12345678",
      })
      .expect("Content-Type", /json/)
      .expect({
        message: "Failed to create user account",
        errors: [
          {
            field: "username",
            value: "Test_user_it_1",
            msg: "Username is already taken",
          },
        ],
      })
      .expect(422, done);
  });
});

describe("Test user login post route", () => {
  test("Login post redirect to login get when both inputs are valid", (done) => {
    request(app)
      .post("/user/login")
      .type("form")
      .send({
        username: "valid_user",
        password: "12345678",
      })
      .expect(302)
      .expect("Location", "/user/login")
      .expect("set-cookie", /^connect.sid=/)
      .end(done);
  });

  const agent = request.agent(app);

  test("Cannot login with incorrect username", (done) => {
    agent
      .post("/user/login")
      .type("form")
      .send({
        username: "invalid_user",
        password: "12345678",
      })
      .redirects(1)
      .expect("Content-Type", /json/)
      .expect(401)
      .expect({
        message: "Failed to log in",
        error: "Incorrect username",
      })
      .end(done);
  });

  test("Cannot login with incorrect password", (done) => {
    agent
      .post("/user/login")
      .type("form")
      .send({
        username: "valid_user",
        password: "12345678",
      })
      .redirects(1)
      .expect("Content-Type", /json/)
      .expect(401)
      .expect({
        message: "Failed to log in",
        error: "Incorrect password",
      })
      .end(done);
  });
  test("Login successfully with valid credentials", (done) => {
    agent
      .post("/user/login")
      .type("form")
      .send({
        username: "valid_user",
        password: "valid_password",
      })
      .redirects(1)
      .expect("Content-Type", /json/)
      .expect(200)
      .expect({
        message: "Successfully logged in as valid_user",
      })
      .end(done);
  });
});
