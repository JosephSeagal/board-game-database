-- This file contains all SQL queries used in the project

-- Query to fetch all users
SELECT * FROM single_user;

-- Query to fetch all groups
SELECT * FROM group_team;

-- Query to fetch all board games that fit $1 (user inputted key words)
SELECT gameid, title, description, min_players, max_players, avg_rating, price, url
FROM boardgame
WHERE LOWER(title) LIKE LOWER($1)
    OR LOWER(description) LIKE LOWER($1)
ORDER BY title;

-- Get userid by username (case-insensitive, ignore spaces)
SELECT userid
FROM single_user
WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));

-- Get groupid by group name (case-insensitive, ignore spaces)
SELECT groupid
FROM group_team
WHERE LOWER(TRIM(group_name)) = LOWER(TRIM($1));

-- Select existing group by id
SELECT groupid, group_name, age_limit, budget
FROM group_team
WHERE groupid = $1;



-- Find groups that the user with userid $1 is NOT a member of
SELECT g.groupid, g.group_name
FROM group_team g
WHERE g.groupid NOT IN (
    SELECT groupid
    FROM in_group
    WHERE userid = $1
)
ORDER BY g.group_name;

-- Find group ID based on group name $1
SELECT groupid FROM group_team WHERE group_name = $1;

-- Insert a user with userid $1 into a group with groupid $2
INSERT INTO in_group (userid, groupid) VALUES ($1, $2);

-- Find groups that the user with userid is a member of
SELECT DISTINCT g.groupid, g.group_name
FROM in_group ig
JOIN group_team g ON g.groupid = ig.groupid
WHERE ig.userid = $1
ORDER BY g.group_name;

-- Remove a user from a group
DELETE FROM in_group
WHERE userid = $1 AND groupid = $2;

-- Fetch all group IDs and names
SELECT groupid, group_name FROM group_team ORDER BY group_name;

-- Fetch all users in a group with groupid $1
SELECT u.userid, u.name 
FROM in_group ig
JOIN single_user u ON ig.userid = u.userid
WHERE ig.groupid = $1;

-- Create a new user with generated userid
INSERT INTO single_user (userid, name, age, budget)
VALUES (
	(SELECT COALESCE(MAX(userid), 0) + 1 FROM single_user),
	$1, $2, $3
)
RETURNING userid, name, age, budget;

-- Find a single user by userid, including favorite game, preferred genre, and preferred mechanic
SELECT
	u.userid,
	u.name,
	u.age,
	u.budget,
	(SELECT gameid FROM user_favorite_game WHERE userid = u.userid LIMIT 1) AS fav_gameid,
	(SELECT genreid FROM user_preferred_genre WHERE userid = u.userid LIMIT 1) AS pref_genreid,
	(SELECT mechanicid FROM user_preferred_mechanic WHERE userid = u.userid LIMIT 1) AS pref_mechanicid
FROM single_user u
WHERE u.userid = $1;

-- Find a single user by name, including favorite game, preferred genre, and preferred mechanic
SELECT
	u.userid,
	u.name,
	u.age,
	u.budget,
	(SELECT gameid FROM user_favorite_game WHERE userid = u.userid LIMIT 1) AS fav_gameid,
	(SELECT genreid FROM user_preferred_genre WHERE userid = u.userid LIMIT 1) AS pref_genreid,
	(SELECT mechanicid FROM user_preferred_mechanic WHERE userid = u.userid LIMIT 1) AS pref_mechanicid
FROM single_user u
WHERE u.name = $1;

-- Update user name or age
UPDATE single_user
SET name = $1,
    age = $2
WHERE userid = $3
RETURNING userid, name, age, budget;

-- Update budget for a user
UPDATE single_user
SET budget = $1
WHERE userid = $2
RETURNING userid, name, age, budget;

-- Set favorite game for a user
DELETE FROM user_favorite_game
WHERE userid = $1;

INSERT INTO user_favorite_game (userid, gameid)
VALUES ($1, $2);

-- Set preferred genre for a user
DELETE FROM user_preferred_genre
WHERE userid = $1;

INSERT INTO user_preferred_genre (userid, genreid)
VALUES ($1, $2);

-- Set preferred mechanic for a user
DELETE FROM user_preferred_mechanic
WHERE userid = $1;

INSERT INTO user_preferred_mechanic (userid, mechanicid)
VALUES ($1, $2);

-- Delete user and all referencing rows
DELETE FROM in_group 
WHERE userid = $1;

DELETE FROM user_favorite_game 
WHERE userid = $1;

DELETE FROM user_preferred_genre
WHERE userid = $1;

DELETE FROM user_preferred_mechanic
WHERE userid = $1;

DELETE FROM single_user
WHERE userid = $1
RETURNING userid, name, age, budget;




--Search Queries--
--Search Users 
SELECT * FROM single_user
WHERE LOWER(name) LIKE LOWER($1);

--Search Groups 
SELECT * FROM group_team
WHERE LOWER(group_name) LIKE LOWER($1);

--Search Games 
SELECT gameid, title, description, min_players, max_players, avg_rating, price, url
FROM boardgame
WHERE LOWER(title) LIKE LOWER($1)
   OR LOWER(description) LIKE LOWER($1)
ORDER BY title;

--GROUP MEMBERSHIP QUERIES--

--Get Groups User is NOT In 
SELECT userid FROM single_user WHERE name = $1;
SELECT g.groupid, g.group_name
FROM group_team g
WHERE g.groupid NOT IN (
    SELECT groupid
    FROM in_group
    WHERE userid = $1
)
ORDER BY g.group_name;

--Join a Group-- 
SELECT userid FROM single_user WHERE name = $1;
SELECT groupid FROM group_team WHERE group_name = $1;

INSERT INTO in_group (userid, groupid)
VALUES ($1, $2);

--Get All Groups 
SELECT groupid, group_name
FROM group_team
ORDER BY group_name;

--Get Users in a Group--
SELECT u.userid, u.name
FROM in_group ig
JOIN single_user u ON ig.userid = u.userid
WHERE ig.groupid = $1;

--Create a group 
INSERT INTO group_team (groupid, group_name, age_limit, budget)
VALUES (
  (SELECT COALESCE(MAX(groupid), 0) + 1 FROM group_team),
  $1, $2, $3
)
RETURNING groupid, group_name, age_limit, budget;

--Select existing group by name 
SELECT groupid, group_name, age_limit, budget
FROM group_team
WHERE group_name = $1;

--Updating selected group's name 
UPDATE group_team
SET group_name = $1
WHERE groupid = $2
RETURNING groupid, group_name, age_limit, budget;

--Delete the selected group 
--First remove all memberships for that group
DELETE FROM in_group
WHERE groupid = $1;

--Then delete the group itself 
DELETE FROM group_team
WHERE groupid = $1
RETURNING groupid, group_name, age_limit, budget;



--Create a New User--
INSERT INTO single_user (userid, name, age, budget)
VALUES (
    (SELECT COALESCE(MAX(userid), 0) + 1 FROM single_user),
    $1, $2, $3
)
RETURNING userid, name, age, budget;

--Find User by Username--
SELECT
    u.userid,
    u.name,
    u.age,
    u.budget,
    (SELECT gameid FROM user_favorite_game WHERE userid = u.userid LIMIT 1) AS fav_gameid,
    (SELECT genreid FROM user_preferred_genre WHERE userid = u.userid LIMIT 1) AS pref_genreid,
    (SELECT mechanicid FROM user_preferred_mechanic WHERE userid = u.userid LIMIT 1) AS pref_mechanicid
FROM single_user u
WHERE u.name = $1;
