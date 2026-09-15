import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  // Lazily created so process.env is read at request time, AFTER main.ts has
  // loaded the root .env (module-level code would capture it too early).
  if (pool === null) {
    pool = new Pool({
      connectionString: process.env["DATABASE_URL"],
      max: 2,
      connectionTimeoutMillis: 3000,
    });
  }
  return pool;
}

@Controller()
export class ReadyController {
  @Get("ready")
  async ready(): Promise<{ status: string; db: string }> {
    try {
      const client = await getPool().connect();
      try {
        await client.query("SELECT 1");
      } finally {
        client.release();
      }
      return { status: "ready", db: "up" };
    } catch {
      // SECURITY: do not leak driver errors / connection strings to clients.
      throw new ServiceUnavailableException({
        status: "not-ready",
        db: "down",
        message: "Database unavailable",
      });
    }
  }
}
