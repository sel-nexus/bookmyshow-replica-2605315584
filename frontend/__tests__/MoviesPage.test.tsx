import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MoviesPage from '../app/movies/page';

const push = vi.fn();
const replace = vi.fn();
const router = { push, replace };

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

function jsonResponse(payload: object, status = 200): Response {
  return new Response(JSON.stringify(payload), { status });
}

/** Verify the authenticated catalogue workflow through its API boundary. */
describe('MoviesPage', () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('bookmyshow_token', 'test-token');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders backend-shaped movies, then theatre loading, selection, and booking continuation', async () => {
    const user = userEvent.setup();
    let resolveTheatres: ((response: Response) => void) | undefined;
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          movies: [{ id: 7, title: 'Moonrise', posterLabel: 'New release' }],
        }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveTheatres = resolve;
          }),
      );

    render(<MoviesPage />);

    expect(await screen.findByRole('heading', { name: 'Moonrise' })).toBeInTheDocument();
    expect(screen.getByText('New release')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose Moonrise' }));

    expect(screen.getByRole('status')).toHaveTextContent('Loading theatres…');
    expect(window.sessionStorage.getItem('bookmyshow_selected_movie')).toBe(
      JSON.stringify({ id: 7, title: 'Moonrise', posterLabel: 'New release' }),
    );

    resolveTheatres?.(jsonResponse({ theatres: [{ id: 12, name: 'Galaxy Cinemas' }] }));

    const theatre = await screen.findByRole('button', { name: 'Galaxy Cinemas' });
    expect(theatre).toHaveAttribute('aria-pressed', 'false');
    await user.click(theatre);
    expect(theatre).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Continue to seat selection' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue to seat selection' }));

    expect(window.sessionStorage.getItem('bookmyshow_selected_theatre')).toBe(
      JSON.stringify({ id: 12, name: 'Galaxy Cinemas' }),
    );
    expect(push).toHaveBeenCalledWith('/booking');
  });

  it('redirects unauthenticated visitors to login without loading the catalogue', async () => {
    window.localStorage.removeItem('bookmyshow_token');

    render(<MoviesPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.getByRole('status')).toHaveTextContent('Loading movies…');
    expect(screen.queryByLabelText('Available movies')).not.toBeInTheDocument();
  });

  it('redirects to login after a 401 catalogue response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401));

    render(<MoviesPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.getByRole('heading', { name: 'Find your next big-screen moment.' })).toBeInTheDocument();
    expect(screen.getByLabelText('Available movies')).toBeEmptyDOMElement();
    expect(window.localStorage.getItem('bookmyshow_token')).toBeNull();
  });

  it('renders a movie API failure instead of a catalogue', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error: 'Catalogue is unavailable.' }, 503),
    );

    render(<MoviesPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Catalogue is unavailable.');
    expect(screen.queryByLabelText('Available movies')).not.toBeInTheDocument();
  });

  it('renders the TheatreList empty state when the selected movie has no available theatres', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          movies: [{ id: 9, title: 'Stillwater', posterLabel: 'Weekend' }],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ theatres: [] }));

    render(<MoviesPage />);

    await user.click(await screen.findByRole('button', { name: 'Choose Stillwater' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'No theatres are available for this movie.',
    );
    expect(
      screen.queryByRole('button', { name: 'Continue to seat selection' }),
    ).not.toBeInTheDocument();
  });

  it('renders a theatre API failure after a movie is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          movies: [{ id: 3, title: 'Afterlight', posterLabel: 'Tonight' }],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ error: 'Theatres are unavailable.' }, 500));

    render(<MoviesPage />);

    await user.click(await screen.findByRole('button', { name: 'Choose Afterlight' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Theatres are unavailable.');
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: /loading theatres/i })).not.toBeInTheDocument(),
    );
  });
});
