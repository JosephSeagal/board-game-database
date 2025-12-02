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
  const table = req.query.table;
  const name  = req.query.name;   // optional username filter

  let query = "";
  let param = [];

  if (table === "users") {
    // base query: same view you originally used
    if (name && name.trim() !== "") {
      // search by username (case-insensitive, partial)
      query = "SELECT * FROM single_user WHERE LOWER(name) LIKE LOWER($1)";
      param = [`%${name.trim()}%`];
    } else {
      // no name => all users
      query = "SELECT * FROM single_user";
    }
  } else if (table === "clubs") {
    // groups unchanged
    query = "SELECT * FROM group_team";
  } else {
    return res.status(400).json({ rows: [] });
  }

  pool
    .query(query, param)
    .then((result) => {
      res.json({ rows: result.rows });
    })
    .catch((error) => {
      console.error("Error in /search route:", error);
      res.status(500).json({ rows: [] });
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
    const userResult = await pool.query(
      "SELECT userid FROM single_user WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))",
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
      "SELECT userid FROM single_user WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const userid = userResult.rows[0].userid;

    const groupResult = await pool.query(
      "SELECT groupid FROM group_team WHERE LOWER(TRIM(group_name)) = LOWER(TRIM($1))",
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

app.post("/groups/leave", async (req, res) => {
  const { username, groupid } = req.body;

  if (!username || !groupid) {
    return res
      .status(400)
      .json({ error: "username and groupid are required." });
  }

  try {
    const userResult = await pool.query(
      "SELECT userid FROM single_user WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "User not found." });
    }

    const userid = userResult.rows[0].userid;

    const deleteResult = await pool.query(
      "DELETE FROM in_group WHERE userid = $1 AND groupid = $2",
      [userid, groupid]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "Membership not found." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error leaving group:", err);
    res.status(500).json({ error: "Database error leaving group." });
  }
});

app.get("/groups/of-user", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  try {
    const userResult = await pool.query(
      "SELECT userid FROM single_user WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.json([]);
    }

    const userid = userResult.rows[0].userid;

    const groupsResult = await pool.query(
      `SELECT DISTINCT g.groupid, g.group_name
      FROM in_group ig
      JOIN group_team g ON g.groupid = ig.groupid
      WHERE ig.userid = $1
      ORDER BY g.group_name`,
      [userid]
    );

    res.json(groupsResult.rows);
  } catch (err) {
    console.error("Error fetching user's groups:", err);
    res.status(500).json({ error: "Database error fetching user's groups" });
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

// Create a new user
app.post("/users/create", async (req, res) => {
  const { name, age, budget } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO single_user (userid, name, age, budget)
      VALUES (
        (SELECT COALESCE(MAX(userid), 0) + 1 FROM single_user),
        $1, $2, $3
      )
      RETURNING userid, name, age, budget`,
      [name, age, budget]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Database error creating user." });
  }
});

// Find a single user by id or name
app.get("/users/find", async (req, res) => {
	const { userid, username } = req.query;

	if (!userid && !username) {
		return res.status(400).json({ error: "userid or username is required." });
	}

	let params = [];
	let whereClause = "";

	if (userid) {
		whereClause = "u.userid = $1";
		params = [userid];
	} else {
		whereClause = "u.name = $1";
		params = [username];
	}

	const query = `
		SELECT
			u.userid,
			u.name,
			u.age,
			u.budget,
			(SELECT gameid FROM user_favorite_game WHERE userid = u.userid LIMIT 1) AS fav_gameid,
			(SELECT genreid FROM user_preferred_genre WHERE userid = u.userid LIMIT 1) AS pref_genreid,
			(SELECT mechanicid FROM user_preferred_mechanic WHERE userid = u.userid LIMIT 1) AS pref_mechanicid
		FROM single_user u
		WHERE ${whereClause}
	`;

	try {
		const result = await pool.query(query, params);
		if (result.rows.length === 0) {
			return res.json(null);
		}
		res.json(result.rows[0]);
	} catch (err) {
		console.error("Find user error:", err);
		res.status(500).json({ error: "Database error finding user." });
	}
});

// Update user info
app.post("/users/update-info", async (req, res) => {
	const { userid, name, age } = req.body;

	if (!userid) {
		return res.status(400).json({ error: "userid is required." });
	}
	if (!name && (age === undefined || age === null)) {
		return res.status(400).json({ error: "Nothing to update (name or age required)." });
	}

	let sets = [];
	let params = [];
	let idx = 1;

	if (name) {
		sets.push(`name = $${idx++}`);
		params.push(name);
	}
	if (age !== undefined && age !== null && age !== "") {
		sets.push(`age = $${idx++}`);
		params.push(age);
	}

	params.push(userid);

	const query = `
		UPDATE single_user
		SET ${sets.join(", ")}
		WHERE userid = $${idx}
		RETURNING userid, name, age, budget
	`;

	try {
		const result = await pool.query(query, params);
		if (result.rowCount === 0) {
			return res.status(404).json({ error: "User not found." });
		}
		res.json(result.rows[0]);
	} catch (err) {
		console.error("Update user info error:", err);
		res.status(500).json({ error: "Database error updating user info." });
	}
});

// Update user budget
app.post("/users/update-budget", async (req, res) => {
	const { userid, budget } = req.body;

	if (!userid) {
		return res.status(400).json({ error: "userid is required." });
	}
	if (budget === undefined || budget === null) {
		return res.status(400).json({ error: "New budget is required." });
	}

	try {
		const result = await pool.query(
			`UPDATE single_user
			SET budget = $1
			WHERE userid = $2
			RETURNING userid, name, age, budget`,
			[budget, userid]
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "User not found." });
		}

		res.json(result.rows[0]);
	} catch (err) {
		console.error("Update budget error:", err);
		res.status(500).json({ error: "Database error updating budget." });
	}
});

// Update user favorite game
app.post("/users/set-favorite-game", async (req, res) => {
	const { userid, gameid } = req.body;

	if (!userid || !gameid) {
		return res.status(400).json({ error: "userid and gameid are required." });
	}

	try {
		await pool.query(
			`DELETE FROM user_favorite_game
			WHERE userid = $1`,
			[userid]
		);

		await pool.query(
			`INSERT INTO user_favorite_game (userid, gameid)
			VALUES ($1, $2)`,
			[userid, gameid]
		);

		res.json({ userid, gameid });
	} catch (err) {
		console.error("Set favorite game error:", err);
		res.status(500).json({ error: "Database error setting favorite game." });
	}
});

// Update user preferred genre
app.post("/users/set-preferred-genre", async (req, res) => {
	const { userid, genreid } = req.body;

	if (!userid || !genreid) {
		return res.status(400).json({ error: "userid and genreid are required." });
	}

	try {
		await pool.query(
			`DELETE FROM user_preferred_genre
			WHERE userid = $1`,
			[userid]
		);

		await pool.query(
			`INSERT INTO user_preferred_genre (userid, genreid)
			VALUES ($1, $2)`,
			[userid, genreid]
		);

		res.json({ userid, genreid });
	} catch (err) {
		console.error("Set preferred genre error:", err);
		res.status(500).json({ error: "Database error setting preferred genre." });
	}
});

// Update user preferred mechanic
app.post("/users/set-preferred-mechanic", async (req, res) => {
	const { userid, mechanicid } = req.body;

	if (!userid || !mechanicid) {
		return res.status(400).json({ error: "userid and mechanicid are required." });
	}

	try {
		await pool.query(
			`DELETE FROM user_preferred_mechanic
			WHERE userid = $1`,
			[userid]
		);

		await pool.query(
			`INSERT INTO user_preferred_mechanic (userid, mechanicid)
			VALUES ($1, $2)`,
			[userid, mechanicid]
		);

		res.json({ userid, mechanicid });
	} catch (err) {
		console.error("Set preferred mechanic error:", err);
		res.status(500).json({ error: "Database error setting preferred mechanic." });
	}
});

// Delete user
app.post("/users/delete", async (req, res) => {
	const { userid } = req.body;

	if (!userid) {
		return res.status(400).json({ error: "userid is required." });
	}

	try {
		await pool.query(`DELETE FROM in_group WHERE userid = $1`, [userid]);
		await pool.query(`DELETE FROM user_favorite_game WHERE userid = $1`, [userid]);
		await pool.query(`DELETE FROM user_preferred_genre WHERE userid = $1`, [userid]);
		await pool.query(`DELETE FROM user_preferred_mechanic WHERE userid = $1`, [userid]);

		const result = await pool.query(
			`DELETE FROM single_user
			WHERE userid = $1
			RETURNING userid, name, age, budget`,
			[userid]
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "User not found." });
		}

		res.json(result.rows[0]);

	} catch (err) {
		console.error("Delete user error:", err);
		res.status(500).json({ error: "Database error deleting user." });
	}
});

// ===================== GROUP CRUD =====================

// Create a new group
app.post("/groups/create", async (req, res) => {
  const { groupName, ageLimit, budget } = req.body;

  if (!groupName) {
    return res.status(400).json({ error: "groupName is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO group_team (groupid, group_name, age_limit, budget)
       VALUES (
         (SELECT COALESCE(MAX(groupid), 0) + 1 FROM group_team),
         $1, $2, $3
       )
       RETURNING groupid, group_name, age_limit, budget`,
      [groupName, ageLimit, budget]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Database error creating group." });
  }
});

// Find a single group by id or name
app.get("/groups/find", async (req, res) => {
  const { groupid, groupname } = req.query;

  if (!groupid && !groupname) {
    return res.status(400).json({ error: "groupid or groupname is required." });
  }

  let query = "";
  let params = [];

  if (groupid) {
    query = `
      SELECT groupid, group_name, age_limit, budget
      FROM group_team
      WHERE groupid = $1
    `;
    params = [groupid];
  } else {
    query = `
      SELECT groupid, group_name, age_limit, budget
      FROM group_team
      WHERE group_name = $1
    `;
    params = [groupname];
  }

  try {
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Find group error:", err);
    res.status(500).json({ error: "Database error finding group." });
  }
});

// Update group name
app.post("/groups/update-name", async (req, res) => {
  const { groupid, groupName } = req.body;

  if (!groupid) {
    return res.status(400).json({ error: "groupid is required." });
  }
  if (!groupName) {
    return res.status(400).json({ error: "groupName is required." });
  }

  try {
    const result = await pool.query(
      `UPDATE group_team
       SET group_name = $1
       WHERE groupid = $2
       RETURNING groupid, group_name, age_limit, budget`,
      [groupName, groupid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update group name error:", err);
    res.status(500).json({ error: "Database error updating group name." });
  }
});

// Delete group
app.post("/groups/delete", async (req, res) => {
  const { groupid } = req.body;

  if (!groupid) {
    return res.status(400).json({ error: "groupid is required." });
  }

  try {
    // clean up membership first
    await pool.query("DELETE FROM in_group WHERE groupid = $1", [groupid]);

    const result = await pool.query(
      `DELETE FROM group_team
       WHERE groupid = $1
       RETURNING groupid, group_name, age_limit, budget`,
      [groupid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ error: "Database error deleting group." });
  }
});


app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});