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
 *    text: `SELECT handle, 
 *                  name, 
 *                  description, 
 *                  num_employees AS "numEmployees", 
 *                  logo_url AS "logoUrl" 
 *              FROM companies 
 *                WHERE name = $1 AND minEmployees = $2 AND maxEmployees = $3 
 *                  ORDER BY name`,
 *    values: ["%test%", 1, 10]
 * }
 * 
 */
function sqlForCompanySearchFilter({nameLike, minEmployees, maxEmployees}) {
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

  const filter = filterElems.length 
    ? "WHERE " + filterElems.join(" AND ")
    : "";
  query.text = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies ${filter} ORDER BY name`
  // query.text = `
  //   SELECT handle,
  //          name,
  //          description,
  //          num_employees AS "numEmployees",
  //          logo_url AS "logoUrl"
  //   FROM companies
  //     WHERE ${filter} 
  //   ORDER BY name
  // `
  return query;
}


module.exports = { 
  sqlForPartialUpdate,
  sqlForCompanySearchFilter
};
