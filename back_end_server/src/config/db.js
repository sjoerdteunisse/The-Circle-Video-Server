// Get the client
const mysql = require('mysql2');

const config = require('../../../webserver.config.js')

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool(config.dbconfig);

console.log(`Connected to database '${config.dbconfig.database}' on host '${config.dbconfig.host}'`)

module.exports = pool
