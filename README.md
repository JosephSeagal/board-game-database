A README explaining to the grader how to open and run your project. Include all filenames descriptions to help TA find the required files listed above.

# Required Files

- `env.sample`: used as a sample for .env
- `.env`: stores the credentials for the database login and password
- `.gitignore`: tells GitHub to ignore the .env file and node_modules folder when committing
- `package.json`: stores shorthand scripts for running the app locally
- `tables.sql`: CREATE TABLE definitions and INSERT INTO statements
  - `artist_data.sql`: contains mock data for the INSERT INTO statements
  - `designer_data.sql`: contains mock data for the INSERT INTO statements
  - `publisher_data.sql`: contains mock data for the INSERT INTO statements
  - `boardgame_data.sql`: contains mock data for the INSERT INTO statements
  - `genre_data.sql`: contains mock data for the INSERT INTO statements
  - `mechanic_data.sql`: contains mock data for the INSERT INTO statements
  - `game_genre_data.sql`: contains mock data for the INSERT INTO statements
  - `game_mechanic_data.sql`: contains mock data for the INSERT INTO statements
  - `single_user_data.sql`: contains mock data for the INSERT INTO statements
  - `group_team_data.sql`: contains mock data for the INSERT INTO statements
  - `in_group_data.sql`: contains mock data for the INSERT INTO statements
  - `favorite_game_data.sql`: contains mock data for the INSERT INTO statements
  - `preferred_genre_data.sql`: contains mock data for the INSERT INTO statements
  - `preferred_mechanic_data.sql`: contains mock data for the INSERT INTO statements
  - `designs_data.sql`: contains mock data for the INSERT INTO statements
  - `makes_art_data.sql`: contains mock data for the INSERT INTO statements
  - `publishes_data.sql`: contains mock data for the INSERT INTO statements
- `all_queries.sql`: contains all queries used in the application
- All files under the `app/` folder: contains web-app frontend

# Local Changes

You'll need to make these changes so you can run this code locally and set up both your local databases:

- Copy `env.sample` into a file named `.env`.
  - Keep the original `env.sample` so people who clone your repo know what credentials they need to put inside `.env`.
- In `.env`, replace YOURPOSTGRESUSER and YOURPOSTGRESPASSWORD with your local Postgres username and password.

There's already a `.gitignore` file which ignores .env in this folder, so you don't need to create that.

# Setting up your local Postgres databases

First, run `npm i` to install local packages. Then, run `npm run setup:local` to create the database and run `tables.sql` on it. If you run this again to clear your database and re-insert the dummy data, you'll see a "database already exists" error. Ignore this.

You only need to run these setup scripts a) once at the beginning to create your database and tables and b) whenever you make a schema change or want to delete all existing data and start fresh.

# Running your app locally

To run your app locally, run `npm run start:local`. Visit http://localhost:3000 to view the site.
