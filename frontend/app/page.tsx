import Link from 'next/link';

/** Render the public BookMyShow-inspired landing page. */
export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">book<span>my</span>show</Link>
        <Link className="header-link" href="/login">Sign in</Link>
      </header>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">THE BIG SCREEN AWAITS</p>
          <h1 id="hero-title">
            Make plans worth
            <br />
            <em>showing up for.</em>
          </h1>
          <p className="hero-description">
            Discover the latest stories, choose your favourite seat, and turn an ordinary evening into an event.
          </p>
          <Link className="primary-button hero-button" href="/login">Find a show <span aria-hidden="true">→</span></Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="ticket ticket-back">FRI · 7:30 PM</div>
          <div className="ticket ticket-front">
            <span>NOW SHOWING</span>
            <strong>STARLIGHT</strong>
            <small>ONE NIGHT ONLY</small>
          </div>
        </div>
      </section>
      <section className="promise" aria-label="Booking benefits">
        <p>ONE APP, EVERY PLAN</p>
        <div>
          <span>Movies</span>
          <span>Events</span>
          <span>Experiences</span>
        </div>
      </section>
    </main>
  );
}
