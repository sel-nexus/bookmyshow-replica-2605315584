import type Database from 'better-sqlite3';
import type { MovieDto, TheatreDto } from './catalog.types';

/** Query the persisted movie catalogue and its theatre mappings. */
export class CatalogService {
  /** Create a catalogue service using the shared SQLite connection. */
  public constructor(private readonly database: Database.Database) {}

  /** Return all seeded movies in their stable catalogue order. */
  public listMovies(): MovieDto[] {
    return this.database.prepare(
      "SELECT id, title, 'Now showing' AS posterLabel FROM movies ORDER BY id"
    ).all() as MovieDto[];
  }

  /** Return whether the requested movie exists in the persisted catalogue. */
  public movieExists(movieId: number): boolean {
    return this.database.prepare('SELECT 1 FROM movies WHERE id = ?').get(movieId) !== undefined;
  }

  /** Return theatres mapped to the requested persisted movie. */
  public listTheatresForMovie(movieId: number): TheatreDto[] {
    return this.database.prepare(`
      SELECT theatres.id, theatres.name
      FROM theatres
      INNER JOIN movie_theatres ON movie_theatres.theatre_id = theatres.id
      WHERE movie_theatres.movie_id = ?
      ORDER BY theatres.id
    `).all(movieId) as TheatreDto[];
  }
}
