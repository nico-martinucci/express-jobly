"use strict";

const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testJobIds = {};

async function commonBeforeAll() {
	await db.query("DELETE FROM jobs");
	// noinspection SqlWithoutWhere
	await db.query("DELETE FROM companies");
	// noinspection SqlWithoutWhere
	await db.query("DELETE FROM users");

	await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img'),
           ('c4', 'C4', 0, 'Desc4', 'http://c4.img')`);

	await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
		[
			await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
			await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
		]);

	const results = await db.query(`
    INSERT INTO jobs(title, 
                     salary, 
                     equity, 
                     company_handle)
    VALUES ('testJob1', 100, 0, 'c1'),
           ('testJob2', 1000, 0.1, 'c2'),
           ('another1', 10000, 0, 'c3')
	RETURNING title, id`);
	
	for (let job of results.rows) {
		testJobIds[job.title] = job.id;
	}
}

async function commonBeforeEach() {
	await db.query("BEGIN");
}

async function commonAfterEach() {
	await db.query("ROLLBACK");
}

async function commonAfterAll() {
	await db.end();
}


module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testJobIds
};