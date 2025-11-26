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

-- Find user ID based on username $1
SELECT userid FROM single_user WHERE name = $1;

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

-- Fetch all group IDs and names
SELECT groupid, group_name FROM group_team ORDER BY group_name;

-- Fetch all users in a group with groupid $1
SELECT u.userid, u.name 
FROM in_group ig
JOIN single_user u ON ig.userid = u.userid
WHERE ig.groupid = $1;