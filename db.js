"use strict";

/** Database setup for jobly. */

const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

// Fix for parsing of numeric fields
const types = require('pg').types;
types.setTypeParser(1700, 'text', parseFloat);

const db = new Client({
  connectionString: getDatabaseUri(),
});

db.connect();

module.exports = db;
