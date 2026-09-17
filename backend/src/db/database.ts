import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/** Create and prepare a file-backed SQLite database with the initial BookMyShow schema. */
export function createDatabase(databasePath: string): Database.Database {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile_number TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS theatres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS movie_theatres (
      movie_id INTEGER NOT NULL,
      theatre_id INTEGER NOT NULL,
      PRIMARY KEY (movie_id, theatre_id),
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (theatre_id) REFERENCES theatres(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      theatre_id INTEGER NOT NULL,
      seats TEXT NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'upi')),
      total_price INTEGER NOT NULL CHECK (total_price > 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (theatre_id) REFERENCES theatres(id)
    );
  `);
  seedCatalog(database);
  return database;
}

/** Insert the starter catalog and theatre mapping without duplicating records on later boots. */
function seedCatalog(database: Database.Database): void {
  const insertMovie = database.prepare('INSERT OR IGNORE INTO movies (id, title) VALUES (?, ?)');
  const insertTheatre = database.prepare('INSERT OR IGNORE INTO theatres (id, name) VALUES (?, ?)');
  const insertMapping = database.prepare('INSERT OR IGNORE INTO movie_theatres (movie_id, theatre_id) VALUES (?, ?)');

  insertMovie.run(1, 'Paradise');
  insertMovie.run(2, 'Bloody Romeo');
  insertMovie.run(3, 'OG2');
  insertTheatre.run(1, 'Sandhya 70mm');
  insertTheatre.run(2, 'Sudharsham 70mm');
  insertTheatre.run(3, 'Allu Cinemas');
  [[1, 1], [1, 2], [2, 2], [2, 3], [3, 1], [3, 3]].forEach(([movieId, theatreId]) => {
    insertMapping.run(movieId, theatreId);
  });
}
