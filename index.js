import express from "express";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();

app.use(express.json());

// Middleware to check auth
function authMiddleware(req, res, next) {
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

/**
 * PUT /accounts
 * Creates or updates a record based on (application + id_device).
 * Only updates the fields provided in the request body.
 */
app.put("/lunarbits/accounts", async (req, res) => {
  const { application, id_device, ...fields } = req.body;

  if (!application || !id_device) {
    return res.status(400).json({ error: "application and id_device are required in request body" });
  }

  try {
    // Build dynamic SQL for columns provided in request
    const columns = Object.keys(fields);
    if (columns.length === 0) {
      return res.status(400).json({ error: "At least one field must be provided" });
    }

    const insertCols = ["application", "id_device", ...columns, "updated_at"];
    const insertVals = [application, id_device, ...columns.map(c => fields[c]), new Date()];

    const insertPlaceholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");

    const updateSet = columns
      .map((c, i) => `${c} = EXCLUDED.${c}`)
      .join(", ") + ", updated_at = NOW()";

    const query = `
      INSERT INTO public.generic_account (${insertCols.join(", ")})
      VALUES (${insertPlaceholders})
      ON CONFLICT (application, id_device)
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
 * Fetches by application + id_device.
 */
app.get("/lunarbits/accounts", async (req, res) => {
  const { application, id_device } = req.query;

  if (!application || !id_device) {
    return res.status(400).json({ error: "application and id_device are required in query params" });
  }

  try {
    const query = `SELECT * FROM public.generic_account WHERE application = $1 AND id_device = $2`;
    const values = [application, id_device];

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
 * Returns top 10 by points (desc) filtered by application.
 */
app.get("/lunarbits/ranking", async (req, res) => {
  const { application, orderBy } = req.query;

  if (!application) {
    return res.status(400).json({ error: "application is required" });
  }

  const validOrderBys = ["points", "level"];
  const orderColumn = validOrderBys.includes(orderBy) ? orderBy : "points";

  try {
    const query = `
      SELECT id, application, username, points, level, current_exp, next_level_exp
      FROM public.generic_account
      WHERE application = $1
      ORDER BY ${orderColumn} DESC
      LIMIT 10;
    `;
    const result = await pool.query(query, [application]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error in GET /lunarbits/ranking", err);
    res.status(500).json({ error: "Error fetching ranking: " + err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`API is running on port ${process.env.PORT || 3000}!`);
});
