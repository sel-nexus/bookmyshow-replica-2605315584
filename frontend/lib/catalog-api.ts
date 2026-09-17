import { ApiError } from './api-client';

/** Describe a movie returned by the catalogue API. */
export interface Movie {
  id: number;
  title: string;
  posterLabel: string;
}

/** Describe a theatre returned by the catalogue API. */
export interface Theatre {
  id: number;
  name: string;
}

/** Fetch the authenticated movie catalogue. */
export async function fetchMovies(token: string): Promise<Movie[]> {
  const payload = await get<{ movies: Movie[] }>('/api/v1/movies', token);
  return payload.movies;
}

/** Fetch theatre choices mapped to one selected movie. */
export async function fetchTheatres(movieId: number, token: string): Promise<Theatre[]> {
  const payload = await get<{ theatres: Theatre[] }>(`/api/v1/theatres?movieId=${movieId}`, token);
  return payload.theatres;
}

/** Send an authenticated GET request and normalize API error responses. */
async function get<TResponse>(path: string, token: string): Promise<TResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = (await response.json()) as TResponse & { error?: string };
  if (!response.ok) {
    throw new ApiError(payload.error ?? 'Unable to load the catalogue. Please try again.', response.status);
  }
  return payload;
}
