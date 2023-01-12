"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureIsAdminOrCurrentUser
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

function next(err) {
  if (err) throw new Error("Got error from middleware");
}

describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);

    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);

    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);

    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };

    expect(() => ensureLoggedIn(req, res, next)).toThrowError();
  });
});

describe("ensureIsAdmin", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { isAdmin: true } } };

    ensureIsAdmin(req, res, next);
  });

  test("unauth if not admin", function () {
    const req = {};
    const res = { locals: { user: { isAdmin: false } } };

    expect(() => ensureIsAdmin(req, res, next)).toThrowError();
  });
  
  test("unauth if not logged in", function () {
    const req = {};
    const res = { locals: {} };

    expect(() => ensureIsAdmin(req, res, next)).toThrowError();
  });
});

describe("ensureIsAdminOrCurrentUser", function () {
  test("works for admin", function () {
    const req = { params: { username: "u1" } };
    const res = { locals: { user: { isAdmin: true } } };

    ensureIsAdminOrCurrentUser(req, res, next);
  });
  
  test("works for current user", function () {
    const req = { params: { username: "u2" } };
    const res = { locals: { user: { 
      isAdmin: false,
      username: "u2" 
    } } };

    ensureIsAdminOrCurrentUser(req, res, next);
  });

  test("unauth if not admin or current user", function () {
    const req = { params: { username: "u2" } };
    const res = { locals: { user: { 
      isAdmin: false,
      username: "u3" 
    } } };

    expect(() => ensureIsAdminOrCurrentUser(req, res, next)).toThrowError();
  });
  
  test("unauth if not logged in", function () {
    const req = {};
    const res = { locals: {} };

    expect(() => ensureIsAdminOrCurrentUser(req, res, next)).toThrowError();
  });
});