"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");

const { ensureIsAdmin } = require("../middleware/auth");

const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companySearchSchema = require("../schemas/companySearch.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.post(
	"/",
	ensureIsAdmin,
	async function (req, res, next) {
		const validator = jsonschema.validate(
			req.body,
			companyNewSchema,
			{ required: true }
		);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		const company = await Company.create(req.body);
		return res.status(201).json({ company });
	}
);

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
	const request = req.query;

	for (let data of ["minEmployees", "maxEmployees"]) {
		if (request[data] || request[data] === 0) {
			request[data] = Number(request[data]);
		}
	}

	const validator = jsonschema.validate(
		request,
		companySearchSchema,
		{ required: true }
	);

	if (!validator.valid) {
		const errs = validator.errors.map(e => e.stack);
		throw new BadRequestError(errs);
	}

	if (request.minEmployees > request.maxEmployees) {
		throw new BadRequestError("minEmployees must be less than maxEmployees.");
	}

	const companies = await Company.findAll(request);

	return res.json({ companies });
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */
router.get("/:handle", async function (req, res, next) {
	const company = await Company.get(req.params.handle);

	return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch(
	"/:handle",
	ensureIsAdmin,
	async function (req, res, next) {
		const validator = jsonschema.validate(
			req.body,
			companyUpdateSchema,
			{ required: true }
		);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		const company = await Company.update(req.params.handle, req.body);
		
		return res.json({ company });
	}
);

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete(
	"/:handle",
	ensureIsAdmin,
	async function (req, res, next) {
		await Company.remove(req.params.handle);
		return res.json({ deleted: req.params.handle });
	}
);


module.exports = router;
