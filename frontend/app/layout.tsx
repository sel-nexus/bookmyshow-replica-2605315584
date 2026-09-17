import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BookMyShow Replica',
  description: 'Find your next big-screen moment.'
};

/** Provide the shared document structure and global visual language. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
