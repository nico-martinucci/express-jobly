"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");

const {
	ensureIsAdmin,
	ensureIsAdminOrCurrentUser
} = require("../middleware/auth");

const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const userApplySchema = require("../schemas/userApply.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post(
	"/",
	ensureIsAdmin,
	async function (req, res, next) {
		const validator = jsonschema.validate(
			req.body,
			userNewSchema,
			{ required: true }
		);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		const user = await User.register(req.body);
		const token = createToken(user);
		return res.status(201).json({ user, token });
	}
);


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get(
	"/",
	ensureIsAdmin,
	async function (req, res, next) {
		const users = await User.findAll();
		return res.json({ users });
	}
);


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: admin or current user
 **/

router.get(
	"/:username",
	ensureIsAdminOrCurrentUser,
	async function (req, res, next) {
		const user = await User.get(req.params.username);
		return res.json({ user });
	}
);


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or current user
 **/

router.patch(
	"/:username",
	ensureIsAdminOrCurrentUser,
	async function (req, res, next) {
		const validator = jsonschema.validate(
			req.body,
			userUpdateSchema,
			{ required: true }
		);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		const user = await User.update(req.params.username, req.body);
		return res.json({ user });
	}
);


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or current user
 **/

router.delete(
	"/:username",
	ensureIsAdminOrCurrentUser,
	async function (req, res, next) {
		await User.remove(req.params.username);
		return res.json({ deleted: req.params.username });
	}
);


/** POST /:username/jobs/:id
 * 
 * applies the specific user to the specified job
 * 
 * returns { applied: jobId }
 * 
 * Authorization required: admin or current user
 * 
 */
router.post(
	"/:username/jobs/:id",
	ensureIsAdminOrCurrentUser,
	async function (req, res, next) {
		const request = req.params;

		request.id = Number(request.id);

		const validator = jsonschema.validate(
			request,
			userApplySchema,
			{ required: true }
		);
	
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		console.log("request.username value in post route: ", request.username);

		const application = await User.apply(request.username, request.id);

		return res.json(application);
	}
)


module.exports = router;
