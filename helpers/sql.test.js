"use strict";

const request = require("supertest");
const { sqlForPartialUpdate, sqlForCompanySearchFilter } = require("./sql")

describe("test sqlForPartialUpdate helper function", function () {
    test("works for valid inputs", function () {
        const dataToUpdate = {
            firstName: "Taco",
            color: "blue",
            age: 99
        }
        const jsToSql = {
            firstName: "first_name"
        }
        const output = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(output).toEqual({
            setCols: '"first_name"=$1, "color"=$2, "age"=$3',
            values: ["Taco", "blue", 99]
        })
    })
})

describe("test sqlForCompanySearchFilter helper function", function () {
    test("full query for all options passed", function () {
        const options = {
            nameLike: "test",
            minEmployees: "1",
            maxEmployees: "10"
        }
        const query = sqlForCompanySearchFilter(options)

        expect(query).toEqual({
            text: `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3 ORDER BY name`,
            values: ["%test%", "1", "10"]
        })
    })
    
    // FIXME: this test is failing because of how the optional filters are
    // getting injected into the string - it leaves an extra space if the string
    // is empty, so the queries aren't EXACTLY correct...
    test("full query for no options passed", function () {
        const options = {}
        const query = sqlForCompanySearchFilter(options)

        expect(query).toEqual({
            text: `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies ORDER BY name`,
            values: []
        })
    })
})