"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");

const { ensureIsAdmin } = require("../middleware/auth");

const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearch = require("../schemas/jobSearch.json");

// TODO: bring in the correct search filter function once it's written
// const { sqlForCompanySearchFilter } = require("../helpers/sql");

const router = new express.Router();


/** POST / { job } => { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */
router.post(
    "/",
    ensureIsAdmin,
    async function (req, res, next) {
        const validator = jsonschema.validate(
            req.body,
            jobNewSchema,
            { required: true }
        );

        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);

        return res.status(201).json({ job });
    }
);

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * TODO: Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */
router.get(
    "/",
    async function (req, res, next) {
        const jobs = await Job.findAll();

        return res.json({ jobs });
    }
);

/** GET /:id => { job: { id, title, salary, equity, companyHandle } }
 *
 * Authorization required: none
 */
router.get(
    "/:id",
    async function (req, res, next) {
        const job = await Job.get(req.params.id);

        return res.json({ job });
    }
)

/** PATCH /:id { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */
router.patch(
    "/:id",
    ensureIsAdmin,
    async function (req, res, next) {
        const validator = jsonschema.validate(
            req.body,
            jobUpdateSchema,
            { required: true }
        );

        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);

        return res.json({ job })
    }
)

/** DELETE /:id  =>  { deleted: id }
 *
 * Deletes the job with the provided id.
 * 
 * Authorization: admin
 */
router.delete(
    "/:id",
    ensureIsAdmin,
    async function (req, res, next) {
        await Job.remove(req.params.id);

        return res.json({ deleted: parseInt(req.params.id) })
    }
)


module.exports = router;