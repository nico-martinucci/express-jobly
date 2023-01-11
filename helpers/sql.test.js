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

        expect(query).toEqual(
            "LOWER ( name ) LIKE '%test%' AND num_employees >= 1 AND num_employees <= 10"
        )
    })
})