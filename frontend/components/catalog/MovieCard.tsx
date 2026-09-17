import React from 'react';
import type { Movie } from '../../lib/catalog-api';

interface MovieCardProps {
  movie: Movie;
  isSelected: boolean;
  onSelect: (movie: Movie) => void;
}

/** Render a selectable, backend-driven movie card. */
export function MovieCard({ movie, isSelected, onSelect }: MovieCardProps) {
  /** Notify the catalogue when the user chooses this movie. */
  const handleSelect = (): void => {
    onSelect(movie);
  };

  return (
    <article className="movie-card">
      <p className="movie-card-label">{movie.posterLabel}</p>
      <h2>{movie.title}</h2>
      <button
        className="movie-select-button"
        type="button"
        aria-pressed={isSelected}
        onClick={handleSelect}
      >
        {isSelected ? 'Selected' : `Choose ${movie.title}`}
      </button>
    </article>
  );
}
