import React from 'react';

interface SeatGridProps {
  selectedSeats: string[];
  onSelectSeats: (seats: string[]) => void;
}

const SEATS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const AUTOMATIC_SEATS = ['A1', 'A2', 'A3'];

/** Render a 5-by-6 accessible cinema seating grid and deterministic selection action. */
export function SeatGrid({ selectedSeats, onSelectSeats }: SeatGridProps) {
  /** Apply the fixed seat set required by this dummy checkout flow. */
  const handleSelectSeats = (): void => {
    onSelectSeats(AUTOMATIC_SEATS);
  };

  return (
    <section className="seat-panel" aria-labelledby="seat-heading">
      <div className="section-heading">
        <p className="eyebrow">STEP 01</p>
        <h2 id="seat-heading">Choose your seats</h2>
      </div>
      <div className="screen-label" aria-label="Cinema screen">Screen</div>
      <div className="seat-grid" role="grid" aria-label="Cinema seats, five rows of six seats">
        {SEATS.map((seat) => {
          const isSelected = selectedSeats.includes(seat);
          return (
            <div key={seat} className="seat-cell" role="gridcell" aria-selected={isSelected}>
              <span className={isSelected ? 'seat seat-selected' : 'seat'}>{seat}</span>
            </div>
          );
        })}
      </div>
      <button className="primary-button" type="button" onClick={handleSelectSeats}>Select seats</button>
    </section>
  );
}
