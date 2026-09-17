import { defineConfig } from 'vitest/config';

/** Configure browser-like component tests for the Next.js client components. */
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.tsx']
  }
});
