import { createApp } from './app';
import { config } from './config';
import { createDatabase } from './db/database';

/** Start the HTTP server with the configured persistent SQLite database. */
function startServer(): void {
  const database = createDatabase(config.databasePath);
  const app = createApp(database, config.jwtSecret, config.corsOrigins);
  app.listen(config.port, () => {
    console.log(`BookMyShow API listening on port ${config.port}`);
  });
}

startServer();
