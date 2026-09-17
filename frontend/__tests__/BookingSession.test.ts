import { describe, expect, it } from 'vitest';
import {
  BOOKING_CONFIRMATION_KEY,
  readBookingConfirmation,
  readBookingSelection,
  saveBookingConfirmation
} from '../lib/booking-session';

/** Provide a small in-memory Storage implementation for session validation tests. */
function createStorage(entries: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(entries));
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => { values.set(key, value); }
  };
}

/** Verify browser session values are accepted only when their complete shape is safe to render. */
describe('booking-session', () => {
  it('reads a valid stored movie and theatre selection', () => {
    const storage = createStorage({
      bookmyshow_selected_movie: JSON.stringify({ id: 1, title: 'Moonrise', posterLabel: 'New release' }),
      bookmyshow_selected_theatre: JSON.stringify({ id: 2, name: 'Galaxy Cinemas' })
    });

    expect(readBookingSelection(storage)).toEqual({
      movie: { id: 1, title: 'Moonrise', posterLabel: 'New release' },
      theatre: { id: 2, name: 'Galaxy Cinemas' }
    });
  });

  it('rejects missing, malformed, and incomplete catalogue selection JSON', () => {
    expect(readBookingSelection(createStorage())).toBeNull();
    expect(readBookingSelection(createStorage({
      bookmyshow_selected_movie: '{bad json',
      bookmyshow_selected_theatre: JSON.stringify({ id: 2, name: 'Galaxy Cinemas' })
    }))).toBeNull();
    expect(readBookingSelection(createStorage({
      bookmyshow_selected_movie: JSON.stringify({ id: 1, title: 'Moonrise' }),
      bookmyshow_selected_theatre: JSON.stringify({ id: 2, name: 'Galaxy Cinemas' })
    }))).toBeNull();
  });

  it('serializes and reads a complete backend confirmation', () => {
    const storage = createStorage();
    const confirmation = {
      confirmationId: 42,
      movie: { id: 1, title: 'Moonrise' },
      theatre: { id: 2, name: 'Galaxy Cinemas' },
      seats: ['A1', 'A2', 'A3'],
      paymentMethod: 'upi' as const,
      totalPrice: 450
    };

    saveBookingConfirmation(storage, confirmation);

    expect(JSON.parse(storage.getItem(BOOKING_CONFIRMATION_KEY) ?? '')).toEqual(confirmation);
    expect(readBookingConfirmation(storage)).toEqual(confirmation);
  });

  it('rejects malformed, missing, and unsafe confirmation shapes', () => {
    expect(readBookingConfirmation(createStorage())).toBeNull();
    expect(readBookingConfirmation(createStorage({ [BOOKING_CONFIRMATION_KEY]: '{not json' }))).toBeNull();
    expect(readBookingConfirmation(createStorage({
      [BOOKING_CONFIRMATION_KEY]: JSON.stringify({
        confirmationId: 42,
        movie: { id: 1, title: 'Moonrise' },
        theatre: { id: 2, name: 'Galaxy Cinemas' },
        seats: ['Z99'],
        paymentMethod: 'cash',
        totalPrice: 450
      })
    }))).toBeNull();
  });
});
