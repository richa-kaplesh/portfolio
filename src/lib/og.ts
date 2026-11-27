import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const font = (path: string) => readFileSync(join(process.cwd(), 'node_modules/@fontsource', path));
const serif = font('young-serif/files/young-serif-latin-400-normal.woff');
const sans = font('source-sans-3/files/source-sans-3-latin-400-normal.woff');

const box = (style: Record<string, string | number>, children: unknown) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

// The Latin font files have no arrow glyph, so spell it out.
const safe = (text: string) => text.replace(/\s*→\s*/g, ' to ');

export async function renderOg(title: string, subtitle: string, footer: string) {
  const tree = box(
    {
      width: 1200,
      height: 630,
      boxSizing: 'border-box',
      fontFamily: 'Source Sans 3',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: '#f7f4f6',
      color: '#2b1a2a',
      padding: 72,
    },
    [
      box({ flexDirection: 'column', gap: 28, width: 1056 }, [
        box(
          { fontFamily: 'Young Serif', fontSize: title.length > 50 ? 60 : 76, lineHeight: 1.12 },
          safe(title),
        ),
        box({ fontSize: 32, lineHeight: 1.4, color: '#6a5468' }, safe(subtitle)),
      ]),
      box({ fontSize: 30, color: '#a3195b' }, footer),
    ],
  );
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Source Sans 3', data: sans, weight: 400 },
      { name: 'Young Serif', data: serif, weight: 400 },
    ],
  });
  return new Uint8Array(new Resvg(svg).render().asPng());
}
