/** Describe a movie returned to catalog clients. */
export interface MovieDto {
  id: number;
  title: string;
  posterLabel: string;
}

/** Describe a theatre returned for a selected movie. */
export interface TheatreDto {
  id: number;
  name: string;
}

/** Describe the movies list API response. */
export interface MoviesResponse {
  movies: MovieDto[];
}

/** Describe the theatres list API response. */
export interface TheatresResponse {
  theatres: TheatreDto[];
}
