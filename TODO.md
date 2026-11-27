# TODO(richa)

TODO placeholders show only in `npm run dev`. The live site leaves them out, and hides Roadmap, Notebooks and Blog from the menu until they have real content.

## Numbers waiting on a new measurement

- [ ] **LLM Gateway, controlled comparison.** Run the replay benchmark in the LLM-Gateway repo (Docker Desktop running, venv active):
      `cd backend` then `python tools/replay_benchmark.py`
      Send me the table it prints, or `backend/loadtest_results/replay-<time>.json`. Those numbers then replace the four rows marked "Production traffic vs one eval run, not controlled" in `src/content/projects/llm-gateway.mdx`, and the resume follows automatically
- [ ] **QueryMind, full eval with the model pinned (optional).** The site leads with the same-model result (14/35 → 28/35). To replace 21/50 → 41/50 with a pinned-model number, re-run the behavior eval with fallback models disabled in the gateway for both the baseline and the current code, on a day with enough Groq quota, then send me both scores

## Resume (`npm run resume`)

The resume is now built from the site's content files: `src/pages/resume.astro` reads `site.yaml`, `experience.yaml` and each project's `resume:` block. `npm run resume` builds the site and prints `public/resume.pdf` (one page, no phone number; the script refuses otherwise). Run it after any content change, then commit the PDF.

- [ ] Your old resume said LLM Gateway error rate 21.5% → 6.7% and p95 26.5 s → 0.99 s. The README says 21.0% and 25.7 s, so the site and the new resume use the README values. Stop using the old PDF
- [ ] Your old resume said a source-domain feature raised Fake News Detector fake-class recall from 65% to 79%. The README shows 46% → 74% for adding the source domain, and 79% after the source-credibility feature, so the new resume leaves that claim out and uses test accuracy instead. Tell me if you want a recall line, and from which experiments
- [ ] Read the new LearnLine bullets in `src/content/experience.yaml` and check they describe your work accurately

## Site details (`src/content/site.yaml`)

- [ ] Read the bio, headline, "looking for" line, resume summary and description, and change anything that does not sound like you
- [ ] Location line (optional)
- [ ] Photo or avatar (optional)

## Site address

- [ ] Rename the Vercel project so the site lives at `richa-kaplesh.vercel.app` (steps in the README, under Deploy). The site, RSS, sitemap and resume already use that address. If the name is taken, set `SITE_URL` in Vercel and run `npm run resume` with the same value

## Now and roadmap

- [ ] Goals in `src/content/now/2026-11-24.md`
- [ ] Confirm the PolyMath item: it links to its project page, which links to github.com/richa-kaplesh/PolyMath. If you would rather not show PolyMath yet, delete that line
- [ ] Your own plan in `src/content/roadmap.yaml`, and remove the two items marked `example: true`

## Projects (`src/content/projects`)

- [ ] Fake News Detector: live URL
- [ ] Fake News Detector, RAG From Scratch, Document Q&A, Autograd: confirm `status` (set to archived because no live URL is known)
- [ ] Document Q&A: the golden dataset is not in the repo, so the site does not claim it
- [ ] Autograd: write a README, and add assertions to the test file
- [ ] PolyMath: write a README (it is blank)

## Blog drafts (`src/content/blog`)

- [ ] Summaries and text for the four drafts (see `WRITING.md`)

## Activity heatmap (`/now`)

- [ ] It appears on the live site once there are 5 days with a published post, notebook or Now entry in the last 26 weeks. It always shows in dev

## Notebooks (`src/content/notebooks`)

- [ ] Add a notebook with its `.meta.yaml`. `RNN.ipynb` is left out: it has one import cell that fails

## Outside this repository

- [ ] LLM-Gateway: `project.md` and `notes.md` exist on your computer, but `.gitignore` (lines 218 and 219) excludes them, so the README links to them return 404 on GitHub. Remove those two lines and commit the files, or remove the links
- [ ] LLM-Gateway: commit `backend/tools/replay_benchmark.py` once you are happy with it
- [ ] QueryMind's `/dashboard/*` is public according to its README; protect it before sharing the site
