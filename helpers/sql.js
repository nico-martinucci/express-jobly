const { BadRequestError } = require("../expressError");

/**
 * sqlForPartialUpdate: generates SQL statement snippets for comma-delineated
 * lists of column names and new values, for direct addition to an SQL update
 * query.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/**
 * sqlForCompanySearchFilter: generates a string of filter criteria for searching
 * for companies; builds a string that can be inserted immediately after "WHERE"
 * 
 * e.g. INPUT:
*         const filters = {
            nameLike: "test",
            minEmployees: "1",
            maxEmployees: "10"
          }
        
        OUTPUT:
          "name LIKE '%test%' AND num_employees >= 1 AND num_employees <= 10"
 */
function sqlForCompanySearchFilter({nameLike, minEmployees, maxEmployees}) {
  let query = {
    values: []
  }

  let filterElems = [];

  let placeholderCount = 1;

  if (nameLike) {
    filterElems.push(`LOWER( name ) LIKE $${placeholderCount}`);
    query.values.push(`%${nameLike.toLowerCase()}%`);
    placeholderCount++;
  }
  if (minEmployees) {
    filterElems.push(`num_employees >= $${placeholderCount}`);
    query.values.push(minEmployees);
    placeholderCount++;
  }
  if (maxEmployees) {
    filterElems.push(`num_employees <= $${placeholderCount}`);
    query.values.push(maxEmployees);
    placeholderCount++;
  }

  const filter = filterElems.join(" AND ");
  query.text = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE ${filter} ORDER BY name`
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
