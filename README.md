# Richa Kaplesh: personal site

My portfolio: projects with measured results, what I'm working on now, and what I'm learning.

**Stack:** Astro, MDX, Tailwind CSS, TypeScript. Static output for Vercel. React loads only for the command palette (Ctrl K or ⌘K), the first time it is opened.

## Run it

Needs Node 22.23.4 or newer.

```bash
npm install
npm run dev      # http://localhost:4321, drafts visible
npm test         # notebook renderer tests
npm run check    # types, content schemas, lint, formatting
npm run build    # static site in dist/, drafts hidden
npm run preview  # serve dist/
```

## Deploy

Import the repository in Vercel. It detects Astro; no settings are needed. With a custom domain, set `SITE_URL` (for example `https://example.com`) so canonical links, RSS and the sitemap use it.

## Add or change content

All content lives in `src/content`. A wrong field fails the build with a message that names it.

| To change                              | Edit                                             |
| -------------------------------------- | ------------------------------------------------ |
| Email, LinkedIn, resume, headline, bio | `site.yaml`                                      |
| Experience timeline                    | `experience.yaml`                                |
| A project                              | `projects/<slug>.mdx`                            |
| The Now page                           | add `now/YYYY-MM-DD.md`; the newest one is shown |
| The roadmap                            | `roadmap.yaml`                                   |
| A notebook                             | see `notebooks/README.md`                        |
| A post                                 | `blog/<slug>.mdx`; set `draft: false` to publish |

To write a post, see [WRITING.md](WRITING.md). Anything still missing shows as `TODO(richa)` on the page and is listed in [TODO.md](TODO.md).
