import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { startJobs } from "./jobs/index.js";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
    app.log.info(`Server running at http://0.0.0.0:${env.API_PORT}`);
    const jobs = startJobs(app.log);

    const shutdown = async () => {
      app.log.info("Shutting down gracefully...");
      jobs.stop();
      await app.close();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
