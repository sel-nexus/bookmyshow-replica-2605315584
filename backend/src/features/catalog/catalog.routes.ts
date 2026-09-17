import { Router } from 'express';
import type Database from 'better-sqlite3';
import { authenticate } from '../../middleware/authenticate';
import { createCatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

/** Build protected versioned routes for movie and theatre discovery. */
export function createCatalogRouter(database: Database.Database, jwtSecret: string): Router {
  const router = Router();
  const controller = createCatalogController(new CatalogService(database));
  router.use(authenticate(jwtSecret));
  router.get('/movies', controller.listMovies);
  router.get('/theatres', controller.listTheatres);
  return router;
}
