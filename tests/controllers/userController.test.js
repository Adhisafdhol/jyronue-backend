const request = require("supertest");
const db = require("../../db/queries");

const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: false }));

const userController = require("../../controllers/userController");
app.post("/user/signup", userController.user_signup_post);

// Integration tests

describe("Test user signup post route", () => {
  afterAll(async () => {
    await db.deleteUserByUsername({ username: "test_user_it_1" });
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
