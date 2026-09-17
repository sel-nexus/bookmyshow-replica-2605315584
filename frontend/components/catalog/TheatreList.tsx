import React from 'react';
import type { Theatre } from '../../lib/catalog-api';

interface TheatreListProps {
  theatres: Theatre[];
  selectedTheatreId: number | null;
  onSelect: (theatre: Theatre) => void;
}

/** Render accessible theatre choices for the selected movie. */
export function TheatreList({ theatres, selectedTheatreId, onSelect }: TheatreListProps) {
  /** Persist the clicked theatre through the parent selection handler. */
  const handleSelect = (theatre: Theatre): void => {
    onSelect(theatre);
  };

  if (theatres.length === 0) {
    return <p className="catalog-empty" role="status">No theatres are available for this movie.</p>;
  }

  return (
    <fieldset className="theatre-list">
      <legend>Choose a theatre</legend>
      <div className="theatre-options">
        {theatres.map((theatre) => (
          <button
            className="theatre-option"
            type="button"
            key={theatre.id}
            aria-pressed={selectedTheatreId === theatre.id}
            onClick={() => handleSelect(theatre)}
          >
            {theatre.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
