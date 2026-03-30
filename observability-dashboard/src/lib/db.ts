import { Pool } from "pg";

// Single shared pool — reused across all API calls
const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "5432"),
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "Huxtler41268690",
  database: process.env.DB_NAME     || "kenya_food_prices",
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

export default pool;