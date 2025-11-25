\c boardgame

-- use this to clear any existing tables to reinsert fresh data
-- you'll need to add a DROP TABLE for every table you add
DROP TABLE IF EXISTS designer CASCADE;
DROP TABLE IF EXISTS artist CASCADE;
DROP TABLE IF EXISTS publisher CASCADE;
DROP TABLE IF EXISTS single_user CASCADE;
DROP TABLE IF EXISTS group_team CASCADE;
DROP TABLE IF EXISTS in_group CASCADE;
DROP TABLE IF EXISTS boardgame CASCADE;
DROP TABLE IF EXISTS genre CASCADE;
DROP TABLE IF EXISTS mechanic CASCADE;
DROP TABLE IF EXISTS game_genre CASCADE;
DROP TABLE IF EXISTS game_mechanic CASCADE;
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS makes_art CASCADE;
DROP TABLE IF EXISTS publishes CASCADE;
DROP TABLE IF EXISTS searches_for CASCADE;
DROP TABLE IF EXISTS user_favorite_game CASCADE;
DROP TABLE IF EXISTS group_favorite_game CASCADE;
DROP TABLE IF EXISTS user_preferred_genre CASCADE;
DROP TABLE IF EXISTS group_preferred_genre CASCADE;
DROP TABLE IF EXISTS user_preferred_mechanic CASCADE;
DROP TABLE IF EXISTS group_preferred_mechanic CASCADE;


-- Designer
CREATE TABLE Designer (
    designerid	INT,				-- unique ID number for this designer 
    name		VARCHAR(200),		-- full name 
    PRIMARY KEY (designerid)
);

-- Artist
CREATE TABLE Artist (
	artistid    INT,
    name        VARCHAR(200),
    PRIMARY KEY (artistid)
);

-- Publisher
CREATE TABLE Publisher (
	publisherid	INT,
	name		VARCHAR(200),  
	PRIMARY KEY (publisherid)
);

-- User
CREATE TABLE Single_User (
    userid	    INT,				-- unique ID number for this user 
    name	    VARCHAR(200),		-- username 
    age	        INT,
    budget	    DECIMAL(5, 2),
    PRIMARY KEY (userid)
);

-- Group
CREATE TABLE Group_Team (
    groupid     INT,				-- unique ID number for this group 
    group_name  VARCHAR(200),		-- group name 
    age_limit	INT,
    budget      INT,
    PRIMARY KEY (groupid)
);

-- InGroup
CREATE TABLE In_Group (
    userid      INT,				-- foreign key 
    groupid     INT,				-- foreign key 
    PRIMARY KEY (userid, groupid),
    FOREIGN KEY (userid) REFERENCES Single_User (userid),
    FOREIGN KEY (groupid) REFERENCES Group_Team (groupid)
);

-- BoardGame
CREATE TABLE BoardGame (
    gameid          INT,				-- unique ID number for this game 
    title           VARCHAR(100),		-- official title of the board game 
    description     VARCHAR(200),
    release_year    INT,
    min_age         INT,
    complexity	    DECIMAL(3, 1),		-- game complexity/weight rating (1=simple, 5=very complex), range from 1.01 -> 4.82
    min_players	    INT,
    max_players	    INT,
    min_playtime	INT,                -- minimum playing time in minutes 
    max_playtime    INT,                -- maximum playing time in minutes 
    avg_rating  	DECIMAL(4, 3),		-- range from 6.46 -> 9.16
    price		    DECIMAL(5, 2),		-- range from 7.2 -> 979.98
    url		        VARCHAR(200),
    PRIMARY KEY     (gameid)
);

-- Genre
CREATE TABLE Genre (
	genreid     INT,
	name        VARCHAR(200),
	PRIMARY KEY (genreid)
);

-- Mechanic
CREATE TABLE Mechanic (
	mechanicid  INT,
	name        VARCHAR(200),
	PRIMARY KEY (mechanicid)
);

-- GameGenre
CREATE TABLE Game_Genre (
	gameid      INT,
	genreid     INT,
	PRIMARY KEY (gameid, genreid),
	FOREIGN KEY (gameid) REFERENCES BoardGame (gameid),
	FOREIGN KEY (genreid) REFERENCES Genre (genreid)
);

-- GameMechanic
CREATE TABLE Game_Mechanic (
	gameid      INT,
	mechanicid  INT,
	PRIMARY KEY (gameid, mechanicid),
	FOREIGN KEY (gameid) REFERENCES BoardGame (gameid),
	FOREIGN KEY (mechanicid) REFERENCES Mechanic (mechanicid)
);

-- Designs
CREATE TABLE Designs (
	designerid  INT,
	gameid      INT,
	PRIMARY KEY (designerid, gameid),
	FOREIGN KEY (designerid)
	REFERENCES  Designer (designerid),
	FOREIGN KEY (gameid) REFERENCES BoardGame (gameid)
);

-- MakesArt
CREATE TABLE Makes_Art (
	artistid    INT,
	gameid      INT,
	PRIMARY KEY (artistid, gameid),
	FOREIGN KEY (artistid) REFERENCES Artist (artistid),
	FOREIGN KEY (gameid) REFERENCES BoardGame (gameid)
);

-- Publishes
CREATE TABLE Publishes (
	publisherid INT,
	gameid      INT,
	PRIMARY KEY (publisherid, gameid),
	FOREIGN KEY (publisherid) REFERENCES Publisher (publisherid),
	FOREIGN KEY (gameid) REFERENCES BoardGame (gameid)
);

-- SearchesFor
CREATE TABLE Searches_For (  
	userid      INT,
    gameid      INT,
	PRIMARY KEY (userid, gameid),
	FOREIGN KEY (userid) REFERENCES Single_User (userid),
	FOREIGN KEY (gameid) REFERENCES BoardGame (gameid)
);

-- UserFavoriteGame
CREATE TABLE User_Favorite_Game (
    userid      INT,
    gameid      INT,
    PRIMARY KEY (userid, gameid),
    FOREIGN KEY (userid) REFERENCES Single_User (userid),
    FOREIGN KEY (gameid) REFERENCES BoardGame (gameid)
);

-- GroupFavoriteGame
CREATE TABLE Group_Favorite_Game (
	groupid     INT,
	gameid      INT,
	PRIMARY KEY (groupid, gameid),
	FOREIGN KEY (groupid) REFERENCES Group_Team (groupid),
	FOREIGN KEY (gameid) REFERENCES BoardGame (gameid)
);

-- UserPreferredGenre
CREATE TABLE User_Preferred_Genre (
	userid      INT,
	genreid     INT,
	PRIMARY KEY (userid, genreid),
	FOREIGN KEY (userid) REFERENCES Single_User (userid),
	FOREIGN KEY (genreid) REFERENCES Genre (genreid)
);

-- UserPreferredMechanic
CREATE TABLE User_Preferred_Mechanic (
	userid      INT,
	mechanicid  INT,
	PRIMARY KEY (userid, mechanicid),
	FOREIGN KEY (userid) REFERENCES Single_User (userid),
	FOREIGN KEY (mechanicid) REFERENCES Mechanic (mechanicid)
);

-- GroupPreferredGenre
CREATE TABLE Group_Preferred_Genre (
	groupid     INT,
	genreid     INT,
	PRIMARY KEY (groupid, genreid),
	FOREIGN KEY (groupid) REFERENCES Group_Team (groupid),
	FOREIGN KEY (genreid) REFERENCES Genre (genreid)
);

-- GroupPreferredMechanic
CREATE TABLE Group_Preferred_Mechanic (
	groupid     INT,
	mechanicid  INT,
	PRIMARY KEY (groupid, mechanicid),
	FOREIGN KEY (groupid) REFERENCES Group_Team (groupid),
	FOREIGN KEY (mechanicid) REFERENCES Mechanic (mechanicid)
);

\i artist_data.sql
\i designer_data.sql
\i publisher_data.sql
\i boardgame_data.sql
\i genre_data.sql
\i mechanic_data.sql
\i game_genre_data.sql
\i game_mechanic_data.sql
\i single_user_data.sql
\i group_team_data.sql
\i in_group_data.sql
\i favorite_game_data.sql
\i preferred_genre_data.sql
\i preferred_mechanic_data.sql
\i designs_data.sql
\i makes_art_data.sql
\i publishes_data.sql

\q