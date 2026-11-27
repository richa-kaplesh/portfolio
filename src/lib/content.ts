import readingTime from 'reading-time';
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

const notebookFiles = import.meta.glob('/src/content/notebooks/*.meta.yaml', { query: '?url' });

export async function getSite() {
  const entry = await getEntry('site', 'main');
  if (!entry) throw new Error('src/content/site.yaml needs a "main" entry.');
  return entry.data;
}

export async function getProjects() {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.order - b.data.order);
}

/** Drafts show in dev only. */
export async function getPosts() {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
  );
}

export async function getNowEntries(): Promise<CollectionEntry<'now'>[]> {
  const entries = await getCollection('now');
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Skips the query when the folder is empty, because Astro warns about empty collections. */
export async function getNotebooks(): Promise<CollectionEntry<'notebooks'>[]> {
  if (Object.keys(notebookFiles).length === 0) return [];
  const notebooks = await getCollection('notebooks');
  return notebooks.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const isTodo = (text: string) => text.startsWith('TODO(richa)');

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const statusLabel = {
  live: 'Live',
  'in-progress': 'In progress',
  archived: 'Archived',
} as const;

/** Filter options for every tag in use, sorted. */
export const uniqueTags = (entries: { data: { tags: string[] } }[]) =>
  [...new Set(entries.flatMap((entry) => entry.data.tags))]
    .sort()
    .map((tag) => ({ value: tag, label: tag }));

export const kindLabel = {
  technical: 'Technical',
  personal: 'Personal',
  'learning-log': 'Learning log',
} as const;

export const minutes = (body = '') => Math.max(1, Math.round(readingTime(body).minutes));

/** Placeholders show while developing and never on the live site. TODO.md lists them all. */
export const showTodos = import.meta.env.DEV;

/** Drops TODO(richa) items on the live site. */
export const real = (items: string[]) =>
  showTodos ? items : items.filter((item) => !isTodo(item));

/** On the live site, sample items and placeholders are left out, and so are empty horizons. */
export async function getRoadmap() {
  const horizons = (await getCollection('roadmap')).sort((a, b) => a.data.order - b.data.order);
  return horizons
    .map(({ data }) => ({
      ...data,
      items: data.items.filter((item) => showTodos || (!item.example && !isTodo(item.title))),
    }))
    .filter((horizon) => horizon.items.length > 0);
}

/** Pages with nothing real on them stay out of the menu and the command palette. */
export async function getNav() {
  const [roadmap, notebooks, posts] = await Promise.all([getRoadmap(), getNotebooks(), getPosts()]);
  return [
    ['Projects', '/projects'],
    ['Now', '/now'],
    ...(roadmap.length ? [['Roadmap', '/roadmap']] : []),
    ...(notebooks.length ? [['Notebooks', '/notebooks']] : []),
    ...(posts.length ? [['Blog', '/blog']] : []),
    ['About', '/about'],
  ] as [string, string][];
}
