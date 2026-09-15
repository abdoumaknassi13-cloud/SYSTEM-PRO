import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  max: 2,
  connectionTimeoutMillis: 3000,
});

@Controller()
export class ReadyController {
  @Get("ready")
  async ready(): Promise<{ status: string; db: string }> {
    try {
      const client = await pool.connect();
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
