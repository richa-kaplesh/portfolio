import { readdirSync } from 'node:fs';
import type { AstroIntegration } from 'astro';

/** Prints a build warning when the newest Now entry is too old. */
export default function staleNow({ maxAgeDays }: { maxAgeDays: number }): AstroIntegration {
  return {
    name: 'stale-now',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const newest = readdirSync('src/content/now')
          .map((file) => /^(\d{4}-\d{2}-\d{2})\.md$/.exec(file)?.[1])
          .filter((date) => date !== undefined)
          .sort()
          .at(-1);
        if (!newest) {
          logger.warn('There is no Now entry in src/content/now.');
          return;
        }
        const age = Math.floor((Date.now() - Date.parse(newest)) / 86_400_000);
        if (age > maxAgeDays) {
          logger.warn(`The newest Now entry (${newest}) is ${age} days old. Please add a new one.`);
        }
      },
    },
  };
}
