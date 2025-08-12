# Generic Account API

Simple API to manage game accounts using Node.js + Express + PostgreSQL.

## How to Run

1. Install dependencies

```
npm install
```

2. Create a .env file

```
PORT=3000
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=mydatabase
AUTH_TOKEN=xpto
```

3. Create the table

```
execute the `scripts.sql` file in your PostgreSQL database
```

4. Start the API

```
npm run start
```

## Endpoints

Add an Authorization header to requests based on the AUTH_TOKEN env variable.

### PUT account

Creates or updates a record based on (application + id_device).

Only updates the fields provided in the request body.

```
PUT /lunarbits/account

Request Body:

{
  "application": "my_game",
  "id_device": "device12345",
  "username": "kendao",
  "points": 100,
  "coins": 50,
  "gems": 0,
  "level": 1,
  "current_exp": 0,
  "next_level_exp": 100,
  "base_exp": 100
}
```

### GET account

Fetches by application + id_device.

```
GET /lunarbits/account?application=my_game&id_device=device123
```

### GET ranking

Returns top 10 accounts ordered by points or level (desc) filtered by application.

```
GET /lunarbits/ranking?application=my_game&orderBy=level
```

## Tech Stack
- Node.js 18.18.0
- Express 4.19.2
- PostgreSQL 8.11.3

## Author

Developed by Kenneth Gottschalk de Azevedo.
