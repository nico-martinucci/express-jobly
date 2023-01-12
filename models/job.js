"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForCompanySearchFilter } = require("../helpers/sql");

/** Related function for jobs. */

class Job {
    
    /** Create a job (from data), update db, return new job data.
     * data should be {title*, salary, equity, companyHandle*}
     *      * = required
     * returns {id, title, salary, equity, companyHandle}
     * 
     * throws BadRequestError if title and/or company are missing.
     * 
     */
    static async create({ title, salary, equity, companyHandle }) {
        if (!title || !companyHandle) {
            throw new BadRequestError("title and company handle are required.");
        } 
        
        const result = await db.query(
            `INSERT INTO jobs(
                title,
                salary,
                equity,
                company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );

        const job = result.rows[0];

        return job;
    }

    /** Find all jobs, optionally queried by the values provided in queryData
     * object.
     * 
     * returns [{ id, title, salary, equity, companyHandle}, ...]
     */
    static async findAll(queryData={}) {

        // FIXME: update to function call when helper is written
        const query = { text: "", values: [] } 
        
        const queryText = `
            SELECT id,
                   title,
                   salary,
                   equity,
                   company_handle AS "companyHandle"
                FROM jobs
                    ${query.text}
                ORDER BY id`
        const jobsRes = await db.query(
            queryText,
            query.values
        )

        return jobsRes.rows;
    }
}


module.exports = Job;