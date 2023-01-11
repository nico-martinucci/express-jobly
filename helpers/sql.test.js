"use strict";

const request = require("supertest");
const { sqlForPartialUpdate, sqlForCompanySearchFilter } = require("./sql")

// TODO: add test for sqlForPartialUpdate function

describe("test sqlForCompanySearchFilter helper function", function () {
    test("full query for all options passed", function () {
        const options = {
            nameLike: "test",
            minEmployees: "1",
            maxEmployees: "10"
        }
        const query = sqlForCompanySearchFilter(options)

        expect(query).toEqual({
            text: `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE LOWER( name ) LIKE $1 AND num_employees >= $2 AND num_employees <= $3 ORDER BY name`,
            values: ["%test%", "1", "10"]
        })
    })
})