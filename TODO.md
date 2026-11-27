# TODO(richa)

## Site details (`src/content/site.yaml`)

Filled in from your resume of 22 November 2026. The site never shows a phone number, and `public/resume.pdf` is a copy of your resume with the phone number removed.

- [ ] Read the bio, headline, "looking for" line and description, and change anything that does not sound like you
- [ ] Location line (optional)
- [ ] Photo or avatar (optional)
- [ ] Your resume says error rate 21.5% → 6.7% and p95 26.5 s → 0.99 s for LLM Gateway. The README, and this site, say 21.0% and 25.7 s. Make them match
- [ ] When you update your resume, run the redaction again or replace `public/resume.pdf` with a copy that has no phone number

TODO placeholders show only in `npm run dev`. The live site leaves them out, and hides Roadmap, Notebooks and Blog from the menu until they have real content.

## Now and roadmap

- [ ] Goals in `src/content/now/2026-11-24.md`
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

- [ ] LLM-Gateway README links to `project.md` and `notes.md`, which return 404
- [ ] QueryMind's `/dashboard/*` is public according to its README; protect it before sharing the site
