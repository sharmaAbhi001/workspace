import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database/client.js";

const start = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();
  const PORT = process.env.PORT ?? 3000;

  const server = app.listen(PORT, () => {
    console.log(`connected to localhost ${PORT}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start();
