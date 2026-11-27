import type { APIRoute } from 'astro';
import { getNav, getNotebooks, getNowEntries, getPosts, getProjects, getSite } from '@/lib/content';
import type { PaletteItem } from '@/lib/palette';

/** Everything the command palette can open. Loaded only when the palette is first used. */
export const GET: APIRoute = async () => {
  const site = await getSite();
  const keywords: Record<string, string> = {
    '/projects': 'work',
    '/now': 'current',
    '/roadmap': 'plan',
    '/notebooks': 'learning',
    '/blog': 'writing posts',
    '/about': 'experience skills contact resume',
  };
  const link = (group: string, label: string, href: string, keywords = ''): PaletteItem => ({
    group,
    label,
    href,
    keywords,
  });
  const items: PaletteItem[] = [
    link('Pages', 'Home', '/'),
    ...(await getNav()).map(([label, href]) => link('Pages', label, href, keywords[href])),
    ...(await getProjects()).map((p) =>
      link('Projects', p.data.title, `/projects/${p.id}`, p.data.tags.join(' ')),
    ),
    ...(await getPosts()).map((p) =>
      link('Posts', p.data.title, `/blog/${p.id}`, p.data.tags.join(' ')),
    ),
    ...(await getNotebooks()).map((n) =>
      link('Notebooks', n.data.title, `/notebooks/${n.id}`, `${n.data.topic} ${n.data.tags}`),
    ),
    ...(await getNowEntries())
      .slice(1)
      .map((n) => link('Now archive', `Now, ${n.id}`, `/now/${n.id}`)),
    ...(site.email
      ? [{ group: 'Actions', label: 'Copy email', action: 'copy', value: site.email } as const]
      : []),
    ...(site.resume
      ? [
          {
            group: 'Actions',
            label: 'Download resume',
            action: 'download',
            value: site.resume,
          } as const,
        ]
      : []),
    { group: 'Actions', label: 'Toggle theme', action: 'theme', keywords: 'dark light' },
    link('Actions', 'Open GitHub', site.github, 'code'),
  ];
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
