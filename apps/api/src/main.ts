import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@system-pro/config";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
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
