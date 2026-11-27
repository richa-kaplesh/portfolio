import { existsSync, readdirSync } from 'node:fs';
import { file, glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const isoDay = (value: unknown) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

const projects = defineCollection({
  loader: glob({ base: 'src/content/projects', pattern: '*.mdx' }),
  schema: z
    .object({
      title: z.string(),
      tagline: z.string(),
      status: z.enum(['live', 'in-progress', 'archived']),
      featured: z.boolean().default(false),
      order: z.number().int(),
      tags: z.array(z.string()).min(1),
      stack: z.array(z.string()).min(1),
      repo: z.url(),
      liveUrl: z.url().optional(),
      liveLabel: z.string().default('Live app'),
      apiUrl: z.url().optional(),
      apiLabel: z.string().default('Backend'),
      healthUrl: z.url().optional(),
      metrics: z
        .array(
          z.object({
            label: z.string(),
            before: z.string().optional(),
            after: z.string(),
            context: z.string().optional(),
          }),
        )
        .default([]),
      metricsNote: z.string().optional(),
      startDate: z.coerce.date().optional(),
      todos: z.array(z.string()).default([]),
    })
    .refine((p) => !p.featured || (p.metrics.length > 0 && p.liveUrl !== undefined), {
      message: 'A featured project needs at least one metric and a liveUrl.',
    })
    .refine((p) => !(p.featured && p.status === 'in-progress'), {
      message: 'An in-progress project cannot be featured on the home page.',
    }),
});

const blog = defineCollection({
  loader: glob({ base: 'src/content/blog', pattern: '*.mdx' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(true),
    kind: z.enum(['technical', 'personal', 'learning-log']),
  }),
});

const notebookDir = 'src/content/notebooks';
const notebookGlob = glob({
  base: notebookDir,
  pattern: '*.meta.yaml',
  generateId: ({ entry }) => entry.replace(/\.meta\.yaml$/, ''),
});

/** Notebooks come in pairs: <name>.ipynb and <name>.meta.yaml. An empty folder is fine. */
const notebookLoader: Loader = {
  name: 'notebook-pairs',
  load: async (context) => {
    const files = existsSync(notebookDir) ? readdirSync(notebookDir) : [];
    const names = (suffix: string) =>
      files.filter((f) => f.endsWith(suffix)).map((f) => f.slice(0, -suffix.length));
    const notebooks = names('.ipynb');
    const metas = names('.meta.yaml');
    for (const name of notebooks) {
      if (!metas.includes(name)) throw new Error(`${name}.ipynb needs a ${name}.meta.yaml file.`);
    }
    for (const name of metas) {
      if (!notebooks.includes(name))
        throw new Error(`${name}.meta.yaml needs a ${name}.ipynb file.`);
    }
    if (metas.length === 0) {
      context.store.clear();
      return;
    }
    await notebookGlob.load(context);
  },
};

const notebooks = defineCollection({
  loader: notebookLoader,
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    topic: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    colabUrl: z.url().optional(),
    repoUrl: z.url().optional(),
  }),
});

const now = defineCollection({
  loader: glob({
    base: 'src/content/now',
    pattern: '*.md',
    generateId: ({ entry, data }) => {
      const id = entry.replace(/\.md$/, '');
      if (isoDay(data.date) !== id) {
        throw new Error(`now/${entry}: the filename must match its date (${isoDay(data.date)}).`);
      }
      return id;
    },
  }),
  schema: z.object({
    date: z.coerce.date(),
    building: z.array(z.string()).min(1),
    learning: z.array(z.string()).min(1),
    reading: z.array(z.string()).optional(),
    goals: z.array(z.string()).default([]),
  }),
});

const roadmap = defineCollection({
  loader: file('src/content/roadmap.yaml'),
  schema: z.object({
    horizon: z.enum(['Now', 'Next 3 months', 'This year', '2–4 years']),
    order: z.number().int(),
    items: z.array(
      z.object({
        title: z.string(),
        status: z.enum(['done', 'doing', 'planned']),
        link: z.string().optional(),
        example: z.boolean().default(false),
      }),
    ),
  }),
});

const experience = defineCollection({
  loader: file('src/content/experience.yaml'),
  schema: z.object({
    kind: z.enum(['work', 'education']),
    role: z.string(),
    org: z.string(),
    order: z.number().int(),
    start: z.string().optional(),
    end: z.string().optional(),
    current: z.boolean().default(false),
    note: z.string().optional(),
    /** One line, used in the short list on the home page. */
    summary: z.string().optional(),
    highlights: z.array(z.string()).default([]),
  }),
});

const site = defineCollection({
  loader: file('src/content/site.yaml'),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    headline: z.string(),
    currently: z.string(),
    description: z.string(),
    github: z.url(),
    email: z.email().optional(),
    // There is deliberately no phone field: a phone number never goes on the site.
    linkedin: z.url().optional(),
    location: z.string().optional(),
    resume: z.string().startsWith('/').optional(),
    photo: z.string().startsWith('/').optional(),
    bio: z.string().optional(),
    lookingFor: z.string().optional(),
    source: z.url().optional(),
    skills: z.array(z.object({ group: z.string(), items: z.array(z.string()).min(1) })).default([]),
  }),
});

export const collections = { projects, blog, notebooks, now, roadmap, experience, site };
