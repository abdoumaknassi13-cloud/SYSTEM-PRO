import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "./app.module";

describe("GET /health (TASK-01 guardrail)", () => {
  it("returns ok without requiring a database", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer() as unknown as import("http").Server;

    await request(server)
      .get("/health")
      .expect(200)
      .expect(/"status":"ok"/);

    await app.close();
  });
});
