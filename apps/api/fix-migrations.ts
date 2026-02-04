import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:Awalker20997@localhost:5432/kaneo_v2",
});

async function fixMigrations() {
  const db = drizzle(pool);

  console.log("Eliminando registros de migraciones existentes...");
  await pool.query("DELETE FROM drizzle.__drizzle_migrations");
  console.log("Registros eliminados.");

  const hash =
    "c2fd96dadbc144c5d38ad9be13692016dc65f730ee7ef7d60c18ecb336f6a9cb";
  const createdAt = Date.now().toString();

  await pool.query(
    `
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at) 
    VALUES ($1, $2)
  `,
    [hash, createdAt],
  );

  console.log("Migración 0000_goofy_jackal marcada como aplicada exitosamente");

  const finalMigrations = await pool.query(
    "SELECT * FROM drizzle.__drizzle_migrations",
  );
  console.log("Migraciones finales:", finalMigrations.rows);

  await pool.end();
}

fixMigrations().catch(console.error);
