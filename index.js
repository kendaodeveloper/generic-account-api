import express from "express";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();

app.use(express.json());

// Middleware to check auth
function authMiddleware(req, res, next) {
  if (!process.env.AUTH_TOKEN) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || parts[1] !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  next();
}

app.use(authMiddleware);

// check application health
app.get("/lunarbits/healthcheck", async (req, res) => {
  const health = {
    status: "up",
    database: "unknown",
    timestamp: new Date().toISOString()
  };

  try {
    await pool.query("SELECT 1");
    health.database = "up";
  } catch (err) {
    health.database = "down";
    console.error("Database healthcheck failed:", err.message);
  }

  res.status(health.database === "up" ? 200 : 500).json(health);
});

/**
 * PUT /accounts
 * Creates or updates a record based on (game + id_device).
 * Only updates the fields provided in the request body.
 */
app.put("/lunarbits/accounts", async (req, res) => {
  const { game, id_device, ...fields } = req.body;

  if (!game || !id_device) {
    return res.status(400).json({ error: "game and id_device are required in request body" });
  }

  try {
    // Build dynamic SQL for columns provided in request
    const columns = Object.keys(fields);
    if (columns.length === 0) {
      return res.status(400).json({ error: "At least one field must be provided" });
    }

    const insertCols = ["game", "id_device", ...columns, "updated_at"];
    const insertVals = [game, id_device, ...columns.map(c => fields[c]), new Date()];

    const insertPlaceholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");

    const updateSet = columns
      .map((c, i) => `${c} = EXCLUDED.${c}`)
      .join(", ") + ", updated_at = NOW()";

    const query = `
      INSERT INTO public.generic_account (${insertCols.join(", ")})
      VALUES (${insertPlaceholders})
      ON CONFLICT (game, id_device)
      DO UPDATE SET ${updateSet}
      RETURNING *;
    `;

    const result = await pool.query(query, insertVals);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in PUT /lunarbits/accounts", err);
    res.status(500).json({ error: "Error inserting/updating record: " + err.message });
  }
});

/**
 * GET /accounts
 * Fetches by game + id_device.
 */
app.get("/lunarbits/accounts", async (req, res) => {
  const { game, id_device } = req.query;

  if (!game || !id_device) {
    return res.status(400).json({ error: "game and id_device are required in query params" });
  }

  try {
    const query = `SELECT * FROM public.generic_account WHERE game = $1 AND id_device = $2`;
    const values = [game, id_device];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in GET /lunarbits/accounts", err);
    res.status(500).json({ error: "Error fetching record: " + err.message });
  }
});

/**
 * GET /ranking
 * Returns top 10 by column (desc) filtered by game.
 */
app.get("/lunarbits/ranking", async (req, res) => {
  const { game, orderBy } = req.query;

  if (!game) {
    return res.status(400).json({ error: "game is required" });
  }

  const validOrderBys = ["wins", "points", "level"];
  const orderColumn = validOrderBys.includes(orderBy) ? orderBy : "points";

  try {
    const query = `
      SELECT id, game, username, wins, losses, draws, points, level
      FROM public.generic_account
      WHERE game = $1
      ORDER BY ${orderColumn} DESC
      LIMIT 10;
    `;
    const result = await pool.query(query, [game]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error in GET /lunarbits/ranking", err);
    res.status(500).json({ error: "Error fetching ranking: " + err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`API is running on port ${process.env.PORT || 3000}!`);
});
