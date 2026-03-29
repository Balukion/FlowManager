import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { startJobs } from "./jobs/index.js";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
    app.log.info(`Server running at http://0.0.0.0:${env.API_PORT}`);
    startJobs(app.log);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
