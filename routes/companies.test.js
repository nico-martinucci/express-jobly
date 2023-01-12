"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token
} = require("./_testCommon");

const adminToken = u1Token;
const regUserToken = u2Token;

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /companies", function () {
	const newCompany = {
		handle: "new",
		name: "New",
		logoUrl: "http://new.img",
		description: "DescNew",
		numEmployees: 10,
	};

	test("ok for admin", async function () {
		const resp = await request(app)
			.post("/companies")
			.send(newCompany)
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			company: newCompany,
		});
	});

	test("unauthorized for regular user", async function () {
		const resp = await request(app)
			.post("/companies")
			.send(newCompany)
			.set("authorization", `Bearer ${regUserToken}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app)
			.post("/companies")
			.send(newCompany)
		expect(resp.statusCode).toEqual(401);
	});

	test("bad request with missing data", async function () {
		const resp = await request(app)
			.post("/companies")
			.send({
				handle: "new",
				numEmployees: 10,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request with invalid data", async function () {
		const resp = await request(app)
			.post("/companies")
			.send({
				...newCompany,
				logoUrl: "not-a-url",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /companies */

describe("GET /companies", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/companies");
		expect(resp.body).toEqual({
			companies:
				[
					{
						handle: "c1",
						name: "C1",
						description: "Desc1",
						numEmployees: 1,
						logoUrl: "http://c1.img",
					},
					{
						handle: "c2",
						name: "C2",
						description: "Desc2",
						numEmployees: 2,
						logoUrl: "http://c2.img",
					},
					{
						handle: "c3",
						name: "C3",
						description: "Desc3",
						numEmployees: 3,
						logoUrl: "http://c3.img",
					},
					{
						handle: "test1",
						name: "TEST ONE",
						numEmployees: 4,
						description: "Desc4",
						logoUrl: "http://c4.img",
					},
					{
						handle: "test2",
						name: "test two",
						numEmployees: 5,
						description: "Desc5",
						logoUrl: "http://c5.img",
					}
				],
		});
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE companies CASCADE");
		const resp = await request(app)
			.get("/companies")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});

	// NEW TESTS vvv

	test(
		"filters with optional 'nameLike' filtering criteria, case insensitive",
		async function () {
			const resp = await request(app)
				.get("/companies")
				.query({ nameLike: "test" });

			expect(resp.body).toEqual({
				"companies": [
					{
						"handle": "test1",
						"name": "TEST ONE",
						"description": "Desc4",
						"numEmployees": 4,
						"logoUrl": "http://c4.img"
					},
					{
						"handle": "test2",
						"name": "test two",
						"description": "Desc5",
						"numEmployees": 5,
						"logoUrl": "http://c5.img"
					}
				]
			});
		});

	test("returns no companies with bad filtering criteria", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({ nameLike: "foobar" });

		expect(resp.body).toEqual({ "companies": [] });
	});

	test("returns companies with MIN number employees", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({ minEmployees: 4 });

		expect(resp.body).toEqual({
			"companies": [
				{
					"handle": "test1",
					"name": "TEST ONE",
					"description": "Desc4",
					"numEmployees": 4,
					"logoUrl": "http://c4.img"
				},
				{
					"handle": "test2",
					"name": "test two",
					"description": "Desc5",
					"numEmployees": 5,
					"logoUrl": "http://c5.img"
				}
			]
		});
	});

	test("returns no companies if MIN employees too high", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({ minEmployees: 10 });

		expect(resp.body).toEqual({ "companies": [] });
	});

	test("throws error is MIN is negative", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({ minEmployees: -1 });

		expect(resp.status).toEqual(400)
		expect(resp.body).toEqual({
			"error": {
				"message": [
					"instance.minEmployees must be greater than or equal to 0"
				],
				"status": 400
			}
		});
	});

	test("returns companies with MAX number employees", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({ maxEmployees: 2 });

		expect(resp.body).toEqual({
			"companies": [
				{
					"handle": "c1",
					"name": "C1",
					"description": "Desc1",
					"numEmployees": 1,
					"logoUrl": "http://c1.img",
				},
				{
					"handle": "c2",
					"name": "C2",
					"description": "Desc2",
					"numEmployees": 2,
					"logoUrl": "http://c2.img",
				}
			]
		});
	});

	test("returns no companies if MAX employees too low", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({ maxEmployees: 0 });

		expect(resp.body).toEqual({ "companies": [] });
	});

	test("throws error if MAX is negative", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({ maxEmployees: -1 });

		expect(resp.status).toEqual(400)
		expect(resp.body).toEqual({
			"error": {
				"message": [
					"instance.maxEmployees must be greater than or equal to 0"
				],
				"status": 400
			}
		});
	});

	test("returns error if MIN greater than MAX", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({ maxEmployees: 0, minEmployees: 5 });

		expect(resp.statusCode).toEqual(400);
		expect(resp.body).toEqual({
			"error": {
				"message": "minEmployees must be less than maxEmployees.",
				"status": 400
			}
		});
	});

	test("multi-criteria filtering", async function () {
		const resp = await request(app)
			.get("/companies")
			.query({
				nameLike: "test",
				minEmployees: 2,
				maxEmployees: 4
			});

		expect(resp.body).toEqual({
			"companies": [
				{
					"handle": "test1",
					"name": "TEST ONE",
					"description": "Desc4",
					"numEmployees": 4,
					"logoUrl": "http://c4.img"
				}
			]
		});
	});

	test("bad query string payload", async function () {
		const resp = await request(app)
			.get("/companies")
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
		})
	})
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
	test("works for anon", async function () {
		const resp = await request(app).get(`/companies/c1`);
		expect(resp.body).toEqual({
			company: {
				handle: "c1",
				name: "C1",
				description: "Desc1",
				numEmployees: 1,
				logoUrl: "http://c1.img",
				jobs: [
					{
						id: expect.any(Number),
						title: "testJob1",
						salary: 100,
						equity: 0,
						companyHandle: "c1"
					}
				]
			},
		});
	});

	test("not found for no such company", async function () {
		const resp = await request(app).get(`/companies/nope`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				name: "C1-new",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			company: {
				handle: "c1",
				name: "C1-new",
				description: "Desc1",
				numEmployees: 1,
				logoUrl: "http://c1.img",
			},
		});
	});

	test("unauth for regular user", async function () {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				name: "C1-new",
			})
			.set("authorization", `Bearer ${regUserToken}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				name: "C1-new",
			});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found on no such company", async function () {
		const resp = await request(app)
			.patch(`/companies/nope`)
			.send({
				name: "new nope",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request on handle change attempt", async function () {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				handle: "c1-new",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on invalid data", async function () {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				logoUrl: "not-a-url",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.delete(`/companies/c1`)
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: "c1" });
	});

	test("unauth for regular user", async function () {
		const resp = await request(app)
			.delete(`/companies/c1`)
			.set("authorization", `Bearer ${regUserToken}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app)
			.delete(`/companies/c1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found for no such company", async function () {
		const resp = await request(app)
			.delete(`/companies/nope`)
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});
