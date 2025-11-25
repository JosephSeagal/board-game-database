const express = require("express");
const { Pool } = require("pg");
const path = require("path");

process.chdir(__dirname);

// small in-memory buffer to hold values submitted via the demo frontend
// (keeps frontend demo working without modifying DB schema)
let extraData = [];
const port = 3000;
const host = "localhost";

// Load environment variables
const { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT } = process.env;

// Map environment variables to pg Pool keys
const databaseConfig = {
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  host: PGHOST || host,       // fallback to localhost
  port: PGPORT ? parseInt(PGPORT) : 5432, // fallback to 5432
};

// For debugging purposes
// console.log("Database config:", JSON.stringify(databaseConfig, null, 2));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool(databaseConfig);

// Test DB connection
pool.connect()
  .then(() => console.log("Connected to db"))
  .catch(err => console.error("DB connection error:", err));

/*
  KEEP EVERYTHING ABOVE HERE
  ADD ENDPOINTS BELOW
*/

// GET /data endpoint
app.get("/data", (req, res) => {
    pool.query("SELECT title AS datum FROM boardgame ORDER BY gameid LIMIT 100").then(result => {
        // merge DB rows with any in-memory submissions
        const rows = result.rows.map(r => ({ datum: r.datum }));
        for (let d of extraData) rows.push({ datum: d });
        return res.send({ data: rows });
    }).catch(error => {
        console.error(error);
        // still include any in-memory submissions on error
        const rows = extraData.map(d => ({ datum: d }));
        return res.status(500).send({ data: rows });
    });
});

/*
  KEEP EVERYTHING BELOW HERE
*/

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
