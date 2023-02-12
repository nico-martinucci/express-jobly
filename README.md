# Jobly
Backend server for company and job search application built with Express

Full application deployed at: https://jobibly.surge.sh/

Front-end repository: https://github.com/nico-martinucci/react-jobly

## Features
- RESTful API with routes for JWT authentication, companies, jobs, and users
- JSON schema request validation
- Custom object-oriented ORM-lite with custom SQL queries for each model
- Global error handler for all routes with custom errors
- 99.5% test coverage

## Setting it up
1. Install dependencies:
```
$ npm i
```

2. Set up the database and test database (PostgreSQL):
```
$ psql -f jobly.sql
```

3. Add a .env file with:
```
PORT="3001"
SECRET_KEY=(any secret key you want)
DBI_URI="postgresql:///jobly"
DBI_TEST_URI="postgresql:///jobly_test"
PROD_BCRYPT_FACTOR="12"
```
(Note: For WSL/Linux, include your psql username & password along with "@localhost" in the URIs: `postgresql://username:password@localhost/jobly`)


4. Start the server:
```
$ npm start
```

3. View at `localhost:3001`

## Tech
- Express.js, pg, bcrypt, JSON web tokens, JSON schema

## // TODO
- Update application routes to receive more data, allowing for more robust front-end "applying" features