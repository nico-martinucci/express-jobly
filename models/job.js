"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForJobSearchFilter } = require("../helpers/sql");

/** Related function for jobs. */

class Job {
    
    /** Create a job (from data), update db, return new job data.
     * data should be {title*, salary, equity, companyHandle*}
     *      * = required
     * returns { id, title, salary, equity, companyHandle }
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
     * Valid filter options:
     * - title (will find case-insensitive, partial matches)
     * - minSalary
     * - hasEquity 
     * - company_handle (local-only option; case-sensitive, exact math search)
     * 
     * returns [{ id, title, salary, equity, companyHandle}, ...]
     */
    static async findAll(queryData={}) {
        const query = sqlForJobSearchFilter(queryData); // TODO: ask David about clever way to not have two functions for this
        const queryText = `
            SELECT j.id,
                   j.title,
                   j.salary,
                   j.equity,
                   c.name AS "company"
                FROM jobs AS j
                    JOIN companies AS c ON j.company_handle = c.handle
                ${query.text}
                ORDER BY id`
        const jobsRes = await db.query(
            queryText,
            query.values
        )

        return jobsRes.rows;
    }

    /** Get one job, based on the provided job id.
     * 
     * returns { id, title, salary, equity, { company } },
     *      where company = { handle, name, numEmployees, description, logoUrl }
     * 
     * throws a NotFoundError if not found.
     */
    static async get(id) {
        const jobRes = await db.query(
            `SELECT j.id,
                    j.title,
                    j.salary,
                    j.equity,
                    c.handle,
                    c.name,
                    c.num_employees AS "numEmployees",
                    c.description,
                    c.logo_url AS "logoUrl"
                FROM jobs AS j
                    JOIN companies AS c ON j.company_handle = c.handle
                WHERE j.id = $1`,
            [id]
        );

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);
        
        const jobData = {
            id: job.id,
            title: job.title,
            salary: job.salary,
            equity: job.equity,
            company: {
                handle: job.handle,
                name: job.name,
                numEmployees: job.numEmployees,
                description: job.description,
                logoUrl: job.logoUrl
            }
        }

        return jobData;
    }

    /** Update a job, given its ID and the data to update.
     * Only a job's title, salary, and equity can be updated.
     * 
     * returns { id, title, salary, equity, companyHandle }
     * 
     * throws NotFoundError if job not found, BadRequestError if bad data 
     * provided.
     */
    static async update(id, data) {
        if (Object.keys(data).length === 0) {
            throw new BadRequestError(`No update data provided.`)
        }
        
        const { setCols, values } = sqlForPartialUpdate(
            data,
            { companyHandle: "company_handle" }
        );
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `
            UPDATE jobs
            SET ${setCols}
                WHERE id = ${idVarIdx}
                RETURNING id, title, salary, equity, 
                        company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        return job;
    }

    /** Delete a job, based on the provided job ID.
     * 
     * throws NotFoundError if job not found.
     */
    static async remove(id) {
        const result = await db.query(
            `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
            [id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job with id: ${id}`);
    }
}


module.exports = Job;