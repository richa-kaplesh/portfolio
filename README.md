# Richa Kaplesh: personal site

My portfolio: projects with measured results, what I'm working on now, and what I'm learning.

**Stack:** Astro, MDX, Tailwind CSS, TypeScript. Static output for Vercel. React loads only for the command palette (Ctrl K or ⌘K), the first time it is opened.

## Run it

Needs Node 22.23.4 or newer.

```bash
npm install
npm run dev      # http://localhost:4321, drafts visible
npm test         # notebook renderer tests
npm run resume   # rebuild public/resume.pdf from the content
npm run check    # types, content schemas, lint, formatting
npm run build    # static site in dist/, drafts hidden
npm run preview  # serve dist/
```

## Deploy

Import the repository in Vercel. It detects Astro; no settings are needed.

The site's address is set once, in `astro.config.ts`: `https://richa-kaplesh.vercel.app`. Canonical links, Open Graph tags, RSS, the sitemap and the resume all use it. To give the Vercel project that address:

1. In Vercel, open the project, then **Settings** → **General**.
2. Under **Project Name**, enter `richa-kaplesh` and save.
3. Open **Settings** → **Domains**. If `richa-kaplesh.vercel.app` is not listed, choose **Add Domain**, enter it, and connect it to **Production**. If Vercel says the name is taken, try `richakaplesh.vercel.app` or `richa-kaplesh-portfolio.vercel.app`.
4. If you end up with a different address, add an environment variable `SITE_URL` with it (Settings → Environment Variables, Production) and redeploy. Then regenerate the PDF with the same address: in PowerShell, `$env:SITE_URL='https://<that address>'; npm run resume`.
5. Optional: remove the old `*.vercel.app` domain, or keep it. It still serves the same deployment.

## Resume

`npm run resume` builds the site and prints `/resume` to `public/resume.pdf` with your local Chrome or Edge. It fails if the resume is longer than one page or contains anything that looks like a phone number. Project bullets pull their numbers from each project's metrics, so the resume and the site always agree. Commit the PDF after running it.

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
