import "reflect-metadata";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@system-pro/config";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  // Local development: load the repository-root .env so `npm run dev:api`
  // works without manually exporting variables. dotenv never overrides
  // variables already present in the environment, so Docker/compose-injected
  // values (Path B) and CI secrets always take precedence.
  // __dirname is apps/api/src (dev) or apps/api/dist (built): root is three levels up.
  dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });
  // SECURITY: fail fast when required config is missing; never boot with defaults.
  const env = loadEnv(process.env);
  process.env["APP_VERSION"] = env.APP_VERSION;
  process.env["GIT_COMMIT"] = env.GIT_COMMIT;

  const app = await NestFactory.create(AppModule, { cors: false });
  await app.listen(env.API_PORT, "0.0.0.0");
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
