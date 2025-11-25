const express = require("express");
const { Pool } = require("pg");

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
app.use(express.static("public"));

const pool = new Pool(databaseConfig);

// Test DB connection
pool.connect()
  .then(() => console.log("Connected to db"))
  .catch(err => console.error("DB connection error:", err));


// GET /data endpoint
app.get("/data", (req, res) => {
    pool.query("SELECT name AS datum FROM single_user ORDER BY userid LIMIT 100").then(result => {
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

app.get("/search", (req, res) => {
    let table = req.query.table;
    let query = '';
    let param = []

    if(table === 'users') {
        query = `SELECT * FROM single_user`;
    }
    if(table === 'clubs') {
        query = `SELECT * FROM group_team`;
    }
  
    pool.query(query, param)
      .then((result) => {
        console.log(result.rows);
        return res.status(200).json({rows: result.rows})
      })
      .catch((error) => {
        console.log(error)
        return res.status(400).json({});
          });
});

app.get("/search/games", async (req, res) => {
  const q = req.query.q || "";

  try {
    const result = await pool.query(
      `SELECT gameid, title, description, min_players, max_players, avg_rating, price, url
       FROM boardgame
       WHERE LOWER(title) LIKE LOWER($1)
          OR LOWER(description) LIKE LOWER($1)
       ORDER BY title`,
      [`%${q}%`]
    );

    res.json({ rows: result.rows });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


/*
  KEEP EVERYTHING BELOW HERE
*/

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
