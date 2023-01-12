"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getJobOneId,
    u1Token,
    u2Token
} = require("./_testCommon");

const adminToken = u1Token;
const regUserToken = u2Token;

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// FIXME: once these tests are working, try to move jogOneId to a global variable.

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "testJob3",
        salary: 10,
        equity: 0.1,
        companyHandle: "c1"
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: newJob,
        });
    });

    test("unauthorized for regular user", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${regUserToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: 100000,
                equity: 0.1
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: 1,
                salary: "ten million",
                equity: "not enough",
                companyHandle: true
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: "testJob1",
                        salary: 100,
                        equity: 0,
                        companyHandle: "c1"
                    },
                    {
                        id: expect.any(Number),
                        title: "testJob2",
                        salary: 1000,
                        equity: 0.1,
                        companyHandle: "c2"
                    },
                    {
                        id: expect.any(Number),
                        title: "another1",
                        salary: 10000,
                        equity: 0,
                        companyHandle: "c3"
                    }
                ],
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
    /* TODO: uncomment these once filters are set up
    test(
        "filters with optional 'title' filtering criteria, case insensitive",
        async function () {
            const resp = await request(app)
                .get("/jobs")
                .query({ title: "test" });

            expect(resp.body).toEqual({
                "jobs": [
                    {
                        id: expect.any(Number),
                        title: "testJob1",
                        salary: 100,
                        equity: 0,
                        companyHandle: "c1"
                    },
                    {
                        id: expect.any(Number),
                        title: "testJob2",
                        salary: 1000,
                        equity: 0.1,
                        companyHandle: "c2"
                    }
                ]
            });
        });

    test("returns no jobs with bad filtering criteria", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ nameLike: "foobar" });

        expect(resp.body).toEqual({ "jobs": [] });
    });

    test("returns jobs with salary at least minSalary", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 500 });

        expect(resp.body).toEqual({
            "jobs": [
                {
                    id: expect.any(Number),
                    title: "testJob2",
                    salary: 1000,
                    equity: 0.1,
                    companyHandle: "c2"
                },
                {
                    id: expect.any(Number),
                    title: "another1",
                    salary: 10000,
                    equity: 0,
                    companyHandle: "c3"
                }
            ]
        });
    });

    test("returns no jobs if minSalary too high", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 100000000000 });

        expect(resp.body).toEqual({ "jobs": [] });
    });

    test("throws error if minSalary is negative", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: -1 });

        expect(resp.status).toEqual(400)
        expect(resp.body).toEqual({
            "error": {
                "message": [
                    "instance.minSalary must be greater than or equal to 0"
                ],
                "status": 400
            }
        });
    });

    test("returns jobs w/ equity", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ hasEquity: true });

        expect(resp.body).toEqual({
            "jobs": [
                {
                    id: expect.any(Number),
                    title: "testJob2",
                    salary: 1000,
                    equity: 0.1,
                    companyHandle: "c2"
                }
            ]
        });
    });
    
    test("returns jobs w/o equity", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ hasEquity: true });

        expect(resp.body).toEqual({
            "jobs": [
                {
                    id: expect.any(Number),
                    title: "testJob1",
                    salary: 100,
                    equity: 0,
                    companyHandle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "another1",
                    salary: 10000,
                    equity: 0,
                    companyHandle: "c3"
                }
            ]
        });
    });

    test("multi-criteria filtering", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({
                title: "test",
                minSalary: 50,
                hasEquity: false
            });

        expect(resp.body).toEqual({
            "jobs": [
                {
                    id: expect.any(Number),
                    title: "testJob1",
                    salary: 100,
                    equity: 0,
                    companyHandle: "c1"
                }
            ]
        });
    });

    test("non-string passed to title", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({
                title: 10
            });

        expect(resp.body.error.staus).toEqual(400);
    });

    test("non-number passed to minSalary", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({
                minSalary: "money please"
            });

        expect(resp.body.error.staus).toEqual(400);
    });

    test("non-boolean passed to hasEquity", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({
                hasEquity: "true!!!"
            });

        expect(resp.body.error.staus).toEqual(400);
    });

    test("bad query string payload", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({
                foo: "bar",
            });

        expect(resp.body).toEqual({
            "error": {
                "message": [
                    "instance is not allowed to have the additional property \"foo\""
                ],
                "status": 400
            }
        });
    });
    */
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app).get(`/jobs/${jobOneId}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "testJob1",
                salary: 100,
                equity: 0,
                companyHandle: "c1"
            },
        });
    });

    test("not found for no such company", async function () {
        const resp = await request(app).get(`/jobs/-1`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app)
            .patch(`/jobs/${jobOneId}`)
            .send({
                title: "newJobName",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "newJobName",
                salary: 100,
                equity: 0,
                companyHandle: "c1"
            },
        });
    });

    test("unauth for regular user", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app)
            .patch(`/jobs/${jobOneId}`)
            .send({
                title: "newJobName",
            })
            .set("authorization", `Bearer ${regUserToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app)
            .patch(`/jobs/${jobOneId}`)
            .send({
                title: "newJobName",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such company", async function () {
        const resp = await request(app)
            .patch(`/jobs/-1`)
            .send({
                title: "newJobNameNope",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app)
            .patch(`/jobs/${jobOneId}`)
            .send({
                id: "c1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app)
            .patch(`/jobs/${jobOneId}`)
            .send({
                salary: "double",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app)
            .delete(`/jobs/${jobOneId}`)
            .set("authorization", `Bearer ${adminToken}`);

        expect(resp.body).toEqual({ deleted: jobOneId });
    });

    test("unauth for regular user", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app)
            .delete(`/jobs/${jobOneId}`)
            .set("authorization", `Bearer ${regUserToken}`);

        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const jobOneId = await getJobOneId();
        const resp = await request(app)
            .delete(`/jobs/${jobOneId}`);

        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/jobs/nope`)
            .set("authorization", `Bearer ${adminToken}`);

        expect(resp.statusCode).toEqual(404);
    });
});