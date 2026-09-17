import Link from 'next/link';
import { LoginForm } from '../../components/auth/LoginForm';

/** Render the focused authentication page for moviegoers. */
export default function LoginPage() {
  return (
    <main className="login-page">
      <header className="site-header">
        <Link className="brand" href="/">book<span>my</span>show</Link>
        <Link className="header-link" href="/">Back to home</Link>
      </header>
      <section className="login-layout" aria-label="Sign in">
        <aside className="login-art" aria-hidden="true">
          <p>
            YOUR NEXT
            <br />
            FAVOURITE
            <br />
            <span>SCENE.</span>
          </p>
          <small>NEW STORIES · REAL MOMENTS · GOOD COMPANY</small>
        </aside>
        <div className="login-panel">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
