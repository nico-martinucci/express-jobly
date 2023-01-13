"use strict";


const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "testJob3",
        salary: 10,
        equity: 0.1,
        companyHandle: "c1"
    };
    
    test("works", async function () {
        console.log("value of testJobIds at top of 'works' test: ", testJobIds);
        const job = await Job.create(newJob);

        expect(job).toEqual({
            id: expect.any(Number),
            ...newJob
        });

        testJobIds.testJob3 = job.id;

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE title = 'testJob3'`
        );

        expect(result.rows).toEqual([
            {
                id: testJobIds.testJob3,
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
                id: testJobIds.testJob1,
                title: "testJob1",
                salary: 100,
                equity: 0,
                company: "C1" 
            },
            {
                id: testJobIds.testJob2,
                title: "testJob2",
                salary: 1000,
                equity: 0.1,
                company: "C2" 
            },
            {
                id: testJobIds.another1,
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
                id: testJobIds.testJob2,
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
                id: testJobIds.testJob1,
                title: "testJob1",
                salary: 100,
                equity: 0,
                company: "C1" 
            },
            {
                id: testJobIds.testJob2,
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
        const job = await Job.get(testJobIds.testJob1);

        expect(job).toEqual({
            id: testJobIds.testJob1,
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
        const job = await Job.update(testJobIds.testJob1, updateData);

        expect(job).toEqual({
            id: testJobIds.testJob1,
            ...updateData,
            companyHandle: "c1"
        })
        
        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = $1`,
            [testJobIds.testJob1]
        );

        expect(result.rows[0]).toEqual({
            id: testJobIds.testJob1,
            title: "newTestJob1Title",
            salary: 10000000,
            equity: 0.5,
            company_handle: "c1" 
        });
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "newTestJob1Title",
            salary: null,
            equity: null
        };
        
        const job = await Job.update(testJobIds.testJob1, updateDataSetNulls);

        expect(job).toEqual({
            id: testJobIds.testJob1,
            ...updateDataSetNulls,
            companyHandle: "c1"
        });
        
        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = $1`,
            [testJobIds.testJob1]
        );

        expect(result.rows[0]).toEqual({
            id: testJobIds.testJob1,
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
        try {
            await Job.update(testJobIds.testJob1, {});
            throw new Error("fail test, you shouldn't get here");
        } catch(err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {  
        await Job.remove(testJobIds.testJob1);

        const result = await db.query(
            `SELECT id
                FROM jobs
                WHERE id = $1`,
            [testJobIds.testJob1]
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