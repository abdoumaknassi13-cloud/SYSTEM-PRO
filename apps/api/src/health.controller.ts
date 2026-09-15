import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health(): { status: string; version: string; commit: string } {
    return {
      status: "ok",
      version: process.env["APP_VERSION"] ?? "0.1.0",
      commit: process.env["GIT_COMMIT"] ?? "unknown",
    };
  }
}
