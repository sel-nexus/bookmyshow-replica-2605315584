import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MovieCard } from '../components/catalog/MovieCard';

/** Test visible backend-shaped movie data and user selection behavior. */
describe('MovieCard', () => {
  /** Render the backend movie title and invoke selection when chosen. */
  it('renders backend-shaped movie data and invokes selection', async () => {
    const user = userEvent.setup();
    const movie = { id: 1, title: 'Paradise', posterLabel: 'Now showing' };
    const onSelect = vi.fn();

    render(<MovieCard movie={movie} isSelected={false} onSelect={onSelect} />);

    expect(screen.getByRole('heading', { name: 'Paradise' })).toBeInTheDocument();
    expect(screen.getByText('Now showing')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose Paradise' }));
    expect(onSelect).toHaveBeenCalledWith(movie);
  });

  it('exposes its selected state through the movie choice button', () => {
    const movie = { id: 2, title: 'Moonrise', posterLabel: 'New release' };

    render(<MovieCard movie={movie} isSelected onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Selected' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
