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

// for security, either specifically allow or broadly deny

/**
 * checkIfAdmin: checks if there is a currently logged in user, and then checks
 * if they are an admin; throws UnauthorizedError if not logged in or not admin.
 */

function ensureIsAdmin(req, res, next) {
  if (!res.locals.user) throw new UnauthorizedError();
  
  if (!res.locals.user.isAdmin) {
    throw new UnauthorizedError("admin access required.")
  }

  return next();
}

/**
 * ensureIsAdminOrCurrentUser: checks if there is a currently logged in user,
 * and they are an admin OR if their username matches the user being accessed;
 * throws an UnauthorizedError if not logged in, not current user, OR not admin.
 */

function ensureIsAdminOrCurrentUser(req, res, next) {
  if (!res.locals.user) throw new UnauthorizedError();
  
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
