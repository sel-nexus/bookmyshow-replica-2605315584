import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/** Clean rendered component trees after each isolated test. */
afterEach(() => cleanup());
