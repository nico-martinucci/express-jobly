"use strict";


const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getJobOneId
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const { testData } = require("../config");
console.log("value of testData.jobIds object: ", testData.jobIds);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "testJob3",
        salary: 10,
        equity: 0.1,
        companyHandle: "c1"
    };
    
    test("works", async function () {
        console.log("value of testData.jobIds object at top of first test: ", testData.jobIds);
        const job = await Job.create(newJob);

        expect(job).toEqual({
            id: expect.any(Number),
            ...newJob
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE title = 'testJob3'`
        );

        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "testJob3",
                salary: 10,
                equity: 0.1,
                company_handle: "c1"
            }
        ]);
    });

    test("error if required value omited", async function () {
        const invalidJob = {
            title: null,
            salary: 10,
            equity: 0.1,
            companyHandle: null
        };

        try {
            await Job.create(invalidJob);
            throw new Error("fail test, you shouldn't get here");
        } catch(err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
})

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        const jobs = await Job.findAll();

        expect(jobs).toEqual([
            {
                id: expect.any(Number), // TODO: change to test exact ID from commonBeforeAll function results
                title: "testJob1",
                salary: 100,
                equity: 0,
                company: "C1" 
            },
            {
                id: expect.any(Number),
                title: "testJob2",
                salary: 1000,
                equity: 0.1,
                company: "C2" 
            },
            {
                id: expect.any(Number),
                title: "another1",
                salary: 10000,
                equity: 0,
                company: "C3" 
            }
        ]);
    });

    test("works: all filters applied w/ results", async function () {
        const queryData = {
            title: "2",
            minSalary: 500,
            hasEquity: true
        };

        const jobs = await Job.findAll(queryData);

        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "testJob2",
                salary: 1000,
                equity: 0.1,
                company: "C2" 
            }
        ]);
    });

    test("works: one filter applied w/ results", async function () {
        const queryData = {
            title: "test"
        };

        const jobs = await Job.findAll(queryData);

        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "testJob1",
                salary: 100,
                equity: 0,
                company: "C1" 
            },
            {
                id: expect.any(Number),
                title: "testJob2",
                salary: 1000,
                equity: 0.1,
                company: "C2" 
            }
        ]);
    });
    
    test("works: one filter applied w/o results", async function () {
        const queryData = {
            title: "taco"
        };

        const jobs = await Job.findAll(queryData);

        expect(jobs).toEqual([]);
    });
});

/************************************** get */

describe("get", function () {
    test("works for valid ID", async function () {
        const jobOneId = await getJobOneId();
        const job = await Job.get(jobOneId);

        expect(job).toEqual({
            id: jobOneId,
            title: "testJob1",
            salary: 100,
            equity: 0,
            company: {
                handle: "c1",
                name: "C1",
                numEmployees: 1,
                description: "Desc1",
                logoUrl: "http://c1.img"
            }
        });
    });

    test("not found if ID does not exist", async function () {
        const badJobId = -1;
        try {
            await Job.get(badJobId);
            throw new Error("fail test, you shouldn't get here");
        } catch(err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "newTestJob1Title",
        salary: 10000000,
        equity: 0.5
    }
    
    test("works", async function () {
        const jobOneId = await getJobOneId(); // TODO: change to global constant, AFTER test set-up
        const job = await Job.update(jobOneId, updateData);

        expect(job).toEqual({
            id: jobOneId,
            ...updateData,
            companyHandle: "c1"
        })
        
        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = $1`,
            [jobOneId]
        );

        expect(result.rows[0]).toEqual({
            id: jobOneId,
            title: "newTestJob1Title",
            salary: 10000000,
            equity: 0.5,
            company_handle: "c1" 
        });
    });

    test("works: null fields", async function () {
        const jobOneId = await getJobOneId();
        const updateDataSetNulls = {
            title: "newTestJob1Title",
            salary: null,
            equity: null
        };
        
        const job = await Job.update(jobOneId, updateDataSetNulls);

        expect(job).toEqual({
            id: jobOneId,
            ...updateDataSetNulls,
            companyHandle: "c1"
        });
        
        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = $1`,
            [jobOneId]
        );

        expect(result.rows[0]).toEqual({
            id: jobOneId,
            title: "newTestJob1Title",
            salary: null,
            equity: null,
            company_handle: "c1" 
        });
    });

    test("not found if no such company", async function () {
        try {
            await Job.update(-1, updateData);
            throw new Error("fail test, you shouldn't get here");
        } catch(err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
    
    test("bad request with no data", async function () {
        const jobOneId = await getJobOneId();
        try {
            await Job.update(jobOneId, {});
            throw new Error("fail test, you shouldn't get here");
        } catch(err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        const jobOneId = await getJobOneId();
        
        await Job.remove(jobOneId);

        const result = await db.query(
            `SELECT id
                FROM jobs
                WHERE id = $1`,
            [jobOneId]
        );

        expect(result.rows.length).toEqual(0);
    });

    test("not found if no such company", async function () {
        try {
            await Job.remove(-1);
            throw new Error("fail test, you shouldn't get here");
        } catch(err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }   
    });
});