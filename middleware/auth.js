"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
}

/**
 * checkIfAdmin: checks if the currently logged in user is an admin; throws
 * UnauthorizedError if not.
 */

function ensureIsAdmin(req, res, next) {
  if (!res.locals.user.isAdmin) {
    throw new UnauthorizedError("admin access required.")
  }

  return next();
}

/**
 * ensureIsAdminOrCurrentUser: checks if the currently logged in user is an 
 * admin, OR matches the user being accessed.
 */

function ensureIsAdminOrCurrentUser(req, res, next) {
  const isMatchingUser = req.params.username === res.locals.user.username;
  if (!res.locals.user.isAdmin && !isMatchingUser) {
    throw new UnauthorizedError("must be admin or current user.")
  }

  return next();
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureIsAdminOrCurrentUser
};
