"use strict";

const { 
    sqlForPartialUpdate, 
    sqlForCompanySearchFilter, 
    sqlForJobSearchFilter 
} = require("./sql")

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
            text: "WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3",
            values: ["%test%", "1", "10"]
        })
    })
    
    test("empty text/values for no options passed", function () {
        const options = {}
        const query = sqlForCompanySearchFilter(options)

        expect(query).toEqual({
            text: "",
            values: []
        })
    })
})

describe("test sqlForJobSearchFilter helper function", function () {
    test("build full query for all options passed", function () {
        const options = {
            title: "test",
            minSalary: 1000,
            hasEquity: "true"
        }
        const query = sqlForJobSearchFilter(options);

        expect(query).toEqual({
            text: "WHERE title ILIKE $1 AND salary >= $2 AND equity > $3",
            values: ["%test%", 1000, 0]
        })
    })
    
    test("build query for jobs with no equity if hasEquity is false", function () {
        const options = {
            title: "test",
            minSalary: 1000,
            hasEquity: "false"
        }
        const query = sqlForJobSearchFilter(options);

        expect(query).toEqual({
            text: "WHERE title ILIKE $1 AND salary >= $2 AND equity = $3",
            values: ["%test%", 1000, 0]
        })
    })
    
    test("build query for jobs for specific company", function () {
        const options = {
            company_handle: "test"
        }
        const query = sqlForJobSearchFilter(options);

        expect(query).toEqual({
            text: "WHERE company_handle = $1",
            values: ["test"]
        })
    })

    test("build empty text/values for no options passed", function () {
        const options = {}
        const query = sqlForJobSearchFilter(options)

        expect(query).toEqual({
            text: "",
            values: []
        })
    })
})