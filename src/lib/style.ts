import type { CSSProperties } from 'react';

/** Entrance delay for elements inside a [data-enter] block. */
export const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;
