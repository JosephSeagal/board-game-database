const express = require("express");
const { Pool } = require("pg");

process.chdir(__dirname);

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

app.get("/groups/not-in", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  try {
    // Step 1: Find user ID
    const userResult = await pool.query(
      "SELECT userid FROM single_user WHERE name = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.json([]); // Username doesn't exist
    }

    const userid = userResult.rows[0].userid;

    // Step 2: Find groups the user is NOT in
    const groupsResult = await pool.query(`
      SELECT g.groupid, g.group_name
      FROM group_team g
      WHERE g.groupid NOT IN (
          SELECT groupid
          FROM in_group
          WHERE userid = $1
      )
      ORDER BY g.group_name;
    `, [userid]);

    res.json(groupsResult.rows);
  }
  catch (err) {
    console.error("Error fetching groups not in:", err);
    res.status(500).json({ error: "server error" });
  }
});

app.post("/groups/join", async (req, res) => {
  const { username, groupname } = req.body;

  if (!username || !groupname) {
    return res.status(400).json({ error: "username and groupname required" });
  }

  try {
    const userResult = await pool.query(
      "SELECT userid FROM single_user WHERE name = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const userid = userResult.rows[0].userid;

    const groupResult = await pool.query(
      "SELECT groupid FROM group_team WHERE group_name = $1",
      [groupname]
    );

    if (groupResult.rows.length === 0) {
      return res.status(400).json({ error: "Group not found" });
    }

    const groupid = groupResult.rows[0].groupid;

    // Insert into in_group
    await pool.query(
      "INSERT INTO in_group (userid, groupid) VALUES ($1, $2)",
      [userid, groupid]
    );

    res.status(200).json({ message: "Joined group successfully" });
  }
  catch (err) {
    console.error("Join group error:", err);

    res.status(500).json({ error: "server error" });
  }
});

app.get("/groups", async (req, res) => {
  try {
    const result = await pool.query("SELECT groupid, group_name FROM group_team ORDER BY group_name;");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch groups" });
  }
});

// Get all users in a group
app.get("/group-members", async (req, res) => {
  const { groupid } = req.query;

  if (!groupid) {
    return res.status(400).json({ error: "Missing groupid" });
  }

  try {
    const result = await pool.query(
      `SELECT u.userid, u.name 
        FROM in_group ig
        JOIN single_user u ON ig.userid = u.userid
        WHERE ig.groupid = $1`,
      [groupid]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
