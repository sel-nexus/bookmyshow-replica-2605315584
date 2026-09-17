'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MovieCard } from '../../components/catalog/MovieCard';
import { TheatreList } from '../../components/catalog/TheatreList';
import { ApiError } from '../../lib/api-client';
import { fetchMovies, fetchTheatres, type Movie, type Theatre } from '../../lib/catalog-api';

/** Render the hydrated, protected movie and theatre selection workflow. */
export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState<number | null>(null);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [isLoadingTheatres, setIsLoadingTheatres] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('bookmyshow_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    /** Load movies after client hydration confirms an authenticated session. */
    const loadMovies = async (): Promise<void> => {
      try {
        setError('');
        setMovies(await fetchMovies(token));
      } catch (caughtError: unknown) {
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          window.localStorage.removeItem('bookmyshow_token');
          router.replace('/login');
          return;
        }
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load movies. Please try again.');
      } finally {
        setIsLoadingMovies(false);
      }
    };

    void loadMovies();
  }, [router]);

  /** Load mapped theatres and save the selected movie for the upcoming booking workflow. */
  const handleMovieSelect = async (movie: Movie): Promise<void> => {
    const token = window.localStorage.getItem('bookmyshow_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setSelectedMovie(movie);
    setTheatres([]);
    setSelectedTheatreId(null);
    window.sessionStorage.setItem('bookmyshow_selected_movie', JSON.stringify(movie));
    setIsLoadingTheatres(true);
    setError('');
    try {
      setTheatres(await fetchTheatres(movie.id, token));
    } catch (caughtError: unknown) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        window.localStorage.removeItem('bookmyshow_token');
        router.replace('/login');
        return;
      }
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load theatres. Please try again.');
    } finally {
      setIsLoadingTheatres(false);
    }
  };

  /** Save the selected theatre for the upcoming booking workflow. */
  const handleTheatreSelect = (theatre: Theatre): void => {
    setSelectedTheatreId(theatre.id);
    window.sessionStorage.setItem('bookmyshow_selected_theatre', JSON.stringify(theatre));
  };

  return (
    <main className="catalog-page">
      <header className="site-header">
        <p className="brand">book<span>my</span>show</p>
        <p className="header-link">Select your show</p>
      </header>
      <section className="catalog-hero" aria-labelledby="catalog-title">
        <p className="eyebrow">NOW PLAYING</p>
        <h1 id="catalog-title">Find your next big-screen moment.</h1>
        <p>Pick a film, then choose where you want to watch it.</p>
      </section>
      <section className="catalog-content" aria-live="polite">
        {isLoadingMovies && <p className="catalog-status" role="status">Loading movies…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!isLoadingMovies && !error && (
          <div className="movie-grid" aria-label="Available movies">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isSelected={selectedMovie?.id === movie.id}
                onSelect={(selected) => void handleMovieSelect(selected)}
              />
            ))}
          </div>
        )}
        {selectedMovie && (
          <section className="theatre-section" aria-labelledby="theatre-heading">
            <p className="eyebrow">YOUR VENUE</p>
            <h2 id="theatre-heading">Where would you like to watch {selectedMovie.title}?</h2>
            {isLoadingTheatres ? <p className="catalog-status" role="status">Loading theatres…</p> : (
              <>
                <TheatreList theatres={theatres} selectedTheatreId={selectedTheatreId} onSelect={handleTheatreSelect} />
                {selectedTheatreId && (
                  <button className="primary-button" type="button" onClick={() => router.push('/booking')}>
                    Continue to seat selection
                  </button>
                )}
              </>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
