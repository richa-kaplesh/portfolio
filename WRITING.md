# Writing a post

## 1. Create it

Add a file in `src/content/blog`. Its name becomes the address: `my-post.mdx` is served at `/blog/my-post`.

```mdx
---
title: My post
date: 2026-11-24
summary: One sentence for the blog list, RSS and link previews.
tags: [rag, evaluation]
kind: technical # technical | personal | learning-log
draft: true
---

## First heading

Text goes here.
```

Start headings at `##`, because the title is already the top heading. A missing or wrong field fails the build and names the field.

## 2. Preview it

```bash
npm run dev
```

Open http://localhost:4321/blog. Drafts show here and nowhere else.

## 3. Publish it

Set `draft: false`, check it, then commit and push.

```bash
npm run check
npm run build
```

## Components

These work in any post or project without an import.

```mdx
<Callout title="Watch out">Short aside.</Callout>

<Figure src="/images/plot.png" alt="Loss falls from 2.1 to 0.4" caption="Training loss" />

<Metric label="Latency p95" before="25.7 s" after="0.99 s" context="live deployment" />

<Mermaid
  caption="A request tries key 1, then fails over to key 2"
  code={`flowchart LR
    A[Request] --> B[Key 1]
    B -- 429 --> C[Key 2]`}
/>

<Flow
  label="Pipeline"
  steps={[{ title: 'Extract', detail: 'Page by page.', aside: 'Optional.' }]}
/>
```

- Images for `<Figure>` go in `public/images`. `alt` is required.
- `<Mermaid>` needs a `caption`. The diagram library loads only on posts that use it.

To show a filename above a code block, add a title after the language:

````md
```python title="router.py"
print("hello")
```
````

## Now entries

Add `src/content/now/YYYY-MM-DD.md`, with the same date inside. The newest entry is the Now page and older ones move to its archive. The build prints a warning when the newest is more than 45 days old.

## Notebooks

See [src/content/notebooks/README.md](src/content/notebooks/README.md).
