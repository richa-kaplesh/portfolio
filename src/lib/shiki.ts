import type { ShikiTransformer } from 'shiki';

export const shikiThemes = {
  light: 'github-light-high-contrast',
  dark: 'github-dark-high-contrast',
} as const;

/** Reads title="file.ts" after the language of a code fence and shows it above the block. */
export const titleTransformer: ShikiTransformer = {
  name: 'code-title',
  pre(node) {
    const title = /\btitle="([^"]+)"/.exec(this.options.meta?.__raw ?? '')?.[1];
    if (title) node.properties['data-title'] = title;
  },
};
