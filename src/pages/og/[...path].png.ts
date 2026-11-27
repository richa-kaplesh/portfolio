import type { APIRoute, GetStaticPaths } from 'astro';
import {
  formatDate,
  getNotebooks,
  getNowEntries,
  getPosts,
  getProjects,
  getSite,
  isTodo,
} from '@/lib/content';
import { renderOg } from '@/lib/og';

interface Card {
  title: string;
  subtitle: string;
}

export const getStaticPaths = (async () => {
  const site = await getSite();
  const card = (path: string, title: string, subtitle = '') => ({
    params: { path },
    props: { title, subtitle: isTodo(subtitle) ? '' : subtitle } satisfies Card,
  });
  return [
    card('index', site.headline, site.currently),
    card('projects', 'Projects', 'LLM infrastructure, data agents, RAG and machine learning.'),
    card('now', 'Now', "What I'm working on and learning right now."),
    card('roadmap', 'Roadmap', "Where I'm headed over the next months and years."),
    card('notebooks', 'Notebooks', "Notebooks from what I'm learning."),
    card('blog', 'Blog', 'Notes on building LLM systems and learning in the open.'),
    card('about', 'About', site.bio ?? site.description),
    ...(await getProjects()).map((p) => card(`projects/${p.id}`, p.data.title, p.data.tagline)),
    ...(await getPosts()).map((p) => card(`blog/${p.id}`, p.data.title, p.data.summary)),
    ...(await getNowEntries())
      .slice(1)
      .map((n) => card(`now/${n.id}`, `Then: ${formatDate(n.data.date)}`)),
    ...(await getNotebooks()).map((n) => card(`notebooks/${n.id}`, n.data.title, n.data.summary)),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute<Card> = async ({ props }) => {
  const site = await getSite();
  const png = await renderOg(props.title, props.subtitle, `${site.name}, ${site.role}`);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
