const { BadRequestError } = require("../expressError");

/**
 * sqlForPartialUpdate: generates SQL statement snippets for comma-delineated
 * lists of column names and new values, for direct addition to an SQL update
 * query.
 * 
 * e.g. INPUT --> 
 * {
 *    firstName: "Taco", 
 *    age: 99
 * },
 * {
 *    firstName: "first_name"
 * }
 * 
 *      OUTPUT -->
 * {
 *    setCols: '"first_name"=$1, "age"=$2',
 *    values: ["Taco", 99]
 * }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError("No data");

	const cols = keys.map((colName, idx) =>
		`"${jsToSql[colName] || colName}"=$${idx + 1}`,
	);

	return {
		setCols: cols.join(", "),
		values: Object.values(dataToUpdate),
	};
}

/**
 * sqlForCompanySearchFilter: generates a query object with .text and .values
 * properties. .text includes an SQL query with injected filters for each of 
 * the passed criteria (if passed). .values is an array of the filter values to 
 * inject for each of those placeholders.
 * 
 * e.g. INPUT --> 
 * {
 *    nameLike: "test",
 *    minEmployees: "1",
 *    maxEmployees: "10"
 * }
 * 
 *      OUTPUT --> 
 * {
 *    text: `WHERE name ILIKE $1 AND num_employees = $2 AND num_employees = $3`,
 *    values: ["%test%", 1, 10]
 * }
 * 
 */
function sqlForCompanySearchFilter({ nameLike, minEmployees, maxEmployees }) {
	let query = {
		values: []
	}

	let filterElems = [];
	let placeholderCount = 1;

	if (nameLike) {
		filterElems.push(`name ILIKE $${placeholderCount}`);
		query.values.push(`%${nameLike.toLowerCase()}%`);
		placeholderCount++;
	}
	if (minEmployees || minEmployees === 0) {
		filterElems.push(`num_employees >= $${placeholderCount}`);
		query.values.push(minEmployees);
		placeholderCount++;
	}
	if (maxEmployees || maxEmployees === 0) {
		filterElems.push(`num_employees <= $${placeholderCount}`);
		query.values.push(maxEmployees);
		placeholderCount++;
	}

	query.text = filterElems.length
		? "WHERE " + filterElems.join(" AND ")
		: "";

	return query;
}


/**
 * sqlForJobSearchFilter: generates a query object with .text and .values
 * properties. .text includes an SQL query with injected filters for each of 
 * the passed criteria (if passed). .values is an array of the filter values to 
 * inject for each of those placeholders.
 * 
 * e.g. INPUT --> 
 * {
 *    title: "test",
 *    minSalary: 1000,
 *    hasEquity: true
 * }
 * 
 *      OUTPUT --> 
 * {
 *    text: `WHERE title ILIKE $1 AND salary >= $2 AND equity > $3`,
 *    values: ["%test%", 1000, 0]
 * }
 */
function sqlForJobSearchFilter({ title, minSalary, hasEquity }) {
	let query = {
		values: []
	}

	let filterElems = [];
	let placeholderCount = 1;

	if (title) {
		filterElems.push(`title ILIKE $${placeholderCount}`);
		query.values.push(`%${title.toLowerCase()}%`);
		placeholderCount++;
	}
	if (minSalary || minSalary === 0) {
		filterElems.push(`salary >= $${placeholderCount}`);
		query.values.push(minSalary);
		placeholderCount++;
	}
	if (hasEquity === "true") {
		filterElems.push(`equity > $${placeholderCount}`);
		query.values.push(0);
		placeholderCount++;
	}
	if (hasEquity === "false") {
		filterElems.push(`equity = $${placeholderCount}`);
		query.values.push(0);
		placeholderCount++;
	}

	query.text = filterElems.length
		? "WHERE " + filterElems.join(" AND ")
		: "";

	return query;
}

module.exports = {
	sqlForPartialUpdate,
	sqlForCompanySearchFilter,
	sqlForJobSearchFilter
};
