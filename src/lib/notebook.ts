import katex from 'katex';
import { Marked, type Tokens } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { codeToHtml } from 'shiki';
import { shikiThemes } from './shiki.ts';

/** Renders a Jupyter notebook to HTML at build time, with no Python involved. */

type Source = string | string[];
type MimeBundle = Record<string, unknown>;

interface Output {
  output_type: string;
  name?: string;
  text?: Source;
  data?: MimeBundle;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

interface Cell {
  cell_type: string;
  source?: Source;
  execution_count?: number | null;
  outputs?: Output[];
  attachments?: Record<string, MimeBundle>;
  metadata?: Record<string, unknown>;
}

interface Notebook {
  nbformat?: number;
  cells?: Cell[];
  metadata?: { language_info?: { name?: string } };
}

export interface Heading {
  id: string;
  text: string;
  depth: number;
}

export interface RenderedNotebook {
  html: string;
  headings: Heading[];
}

/** Text output longer than this is cut, with the rest behind "Show more". */
const MAX_LINES = 24;
const VISIBLE_LINES = 12;

const join = (source: unknown): string =>
  Array.isArray(source) ? source.join('') : typeof source === 'string' ? source : '';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Removes terminal colors and keeps only the final state of progress bars. */
export function cleanLog(text: string): string {
  const plain = text.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r\n/g, '\n');
  return plain
    .split('\n')
    .map((line) => line.replace(/\r+$/, '').split('\r').at(-1) ?? '')
    .join('\n')
    .replace(/\n+$/, '');
}

const sanitize = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'details',
      'summary',
      'del',
      'input',
      'figure',
      'figcaption',
    ],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      th: ['colspan', 'rowspan', 'scope', 'align'],
      td: ['colspan', 'rowspan', 'align'],
      input: [{ name: 'type', values: ['checkbox'] }, 'checked', 'disabled'],
      code: ['class'],
      span: ['data-math'],
      div: ['data-math'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      h5: ['id'],
      h6: ['id'],
    },
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    transformTags: {
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, alt: attribs.alt ?? '', loading: 'lazy' },
      }),
    },
  });

/** One renderer per notebook, so heading ids stay unique across its cells. */
function createMarkdown() {
  const headings: Heading[] = [];
  const used = new Map<string, number>();
  let math: string[] = [];

  const slug = (text: string) => {
    const base =
      text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'section';
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  const addMath = (tex: string, displayMode: boolean) => {
    math.push(katex.renderToString(tex, { displayMode, throwOnError: false, strict: 'ignore' }));
    const tag = displayMode ? 'div' : 'span';
    return `<${tag} data-math="${math.length - 1}"></${tag}>`;
  };

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        const text = this.parser.parseInline(tokens, this.parser.textRenderer).trim();
        // The page title is the only h1, so every notebook heading moves down one level.
        const level = Math.min(depth + 1, 6);
        const id = slug(text);
        headings.push({ id, text, depth: level });
        return `<h${level} id="nb-${id}">${inner}</h${level}>\n`;
      },
    },
    extensions: [
      {
        name: 'blockMath',
        level: 'block',
        start: (src) => src.search(/\$\$|\\\[|\\begin\{/),
        tokenizer(src) {
          const match =
            /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/.exec(src) ??
            /^\\\[([\s\S]+?)\\\][ \t]*(?:\n|$)/.exec(src) ??
            /^(\\begin\{([a-z]+\*?)\}[\s\S]+?\\end\{\2\})[ \t]*(?:\n|$)/.exec(src);
          return match ? { type: 'blockMath', raw: match[0], text: match[1] } : undefined;
        },
        renderer: (token) => addMath(token.text.trim(), true),
      },
      {
        name: 'inlineMath',
        level: 'inline',
        start: (src) => src.search(/\$|\\\(/),
        tokenizer(src) {
          const display = /^\$\$([^$]+?)\$\$/.exec(src);
          if (display) return { type: 'inlineMath', raw: display[0], text: display[1], big: true };
          // A digit after the closing $ means money ("$5 and $10"), not math.
          const match =
            /^\$(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)\$(?!\d)/.exec(src) ?? /^\\\((.+?)\\\)/.exec(src);
          return match ? { type: 'inlineMath', raw: match[0], text: match[1] } : undefined;
        },
        renderer: (token) => addMath(token.text.trim(), token.big === true),
        childTokens: [],
      },
    ],
  });

  const render = (source: string, attachments?: Cell['attachments']) => {
    math = [];
    const withImages = source.replace(/attachment:([^)\s"']+)/g, (whole, name: string) => {
      const bundle = attachments?.[decodeURIComponent(name)];
      const mime = bundle && Object.keys(bundle).find((key) => key.startsWith('image/'));
      return mime ? `data:${mime};base64,${join(bundle[mime]).replace(/\s/g, '')}` : whole;
    });
    const html = sanitize(marked.parse(withImages, { async: false }));
    // KaTeX output goes in after sanitizing, because it needs inline styles and MathML.
    return html.replace(
      /<(div|span) data-math="(\d+)"><\/\1>/g,
      (_, __, index: string) => math[Number(index)] ?? '',
    );
  };

  return { render, headings };
}

const highlight = async (code: string, lang: string) => {
  const options = {
    themes: shikiThemes,
    transformers: [
      {
        pre(node: { properties: Record<string, unknown> }) {
          node.properties.class = 'astro-code';
        },
      },
    ],
  };
  try {
    return await codeToHtml(code, { ...options, lang });
  } catch {
    return codeToHtml(code, { ...options, lang: 'text' });
  }
};

function renderText(raw: string): string {
  const text = cleanLog(raw);
  if (!text.trim()) return '';
  const lines = text.split('\n');
  if (lines.length <= MAX_LINES) return `<pre class="nb-text" tabindex="0">${escape(text)}</pre>`;
  const head = lines.slice(0, VISIBLE_LINES).join('\n');
  const rest = lines.slice(VISIBLE_LINES);
  return (
    `<pre class="nb-text" tabindex="0">${escape(head)}</pre>` +
    `<details class="nb-more"><summary>Show more (${rest.length} lines)</summary>` +
    `<pre class="nb-text" tabindex="0">${escape(rest.join('\n'))}</pre></details>`
  );
}

function renderData(data: MimeBundle, markdown: (source: string) => string): string {
  for (const mime of ['image/png', 'image/jpeg', 'image/svg+xml']) {
    if (!(mime in data)) continue;
    const raw = join(data[mime]);
    const base64 =
      mime === 'image/svg+xml' ? Buffer.from(raw).toString('base64') : raw.replace(/\s/g, '');
    const label = cleanLog(join(data['text/plain'])) || 'Plot produced by the code above';
    return `<img src="data:${mime};base64,${base64}" alt="${escape(label)}" loading="lazy">`;
  }
  if ('text/html' in data) {
    // Scripts and styles are removed. A purely interactive output ends up empty and falls through.
    const html = sanitize(join(data['text/html'])).trim();
    if (html.replace(/<[^>]*>/g, '').trim() || /<img/.test(html)) {
      return `<div class="nb-html" tabindex="0" role="region" aria-label="Output">${html}</div>`;
    }
  }
  if ('text/latex' in data || 'text/markdown' in data) {
    return markdown(join(data['text/latex'] ?? data['text/markdown']));
  }
  return renderText(join(data['text/plain']));
}

function renderOutput(output: Output, markdown: (source: string) => string): string {
  switch (output.output_type) {
    case 'stream': {
      const text = renderText(join(output.text));
      if (!text || output.name !== 'stderr') return text;
      return `<details class="nb-more"><summary>Warnings and logs</summary>${text}</details>`;
    }
    case 'display_data':
    case 'execute_result':
      return renderData(output.data ?? {}, markdown);
    case 'error': {
      const title = escape(cleanLog(`${output.ename ?? 'Error'}: ${output.evalue ?? ''}`));
      const trace = renderText((output.traceback ?? []).join('\n'));
      return `<details class="nb-more nb-error"><summary>${title}</summary>` + `${trace}</details>`;
    }
    default:
      return '';
  }
}

const isColabBadge = (cell: Cell) =>
  cell.metadata?.colab_type === 'text' && cell.metadata?.id === 'view-in-github';

export async function renderNotebook(json: string, name: string): Promise<RenderedNotebook> {
  let notebook: Notebook;
  try {
    notebook = JSON.parse(json) as Notebook;
  } catch (error) {
    throw new Error(`${name}.ipynb is not valid JSON.`, { cause: error });
  }
  if (!Array.isArray(notebook.cells) || (notebook.nbformat ?? 4) < 4) {
    throw new Error(`${name}.ipynb must use notebook format 4 (nbformat 4).`);
  }

  const lang = notebook.metadata?.language_info?.name ?? 'python';
  const { render, headings } = createMarkdown();
  const parts: string[] = [];

  for (const cell of notebook.cells) {
    const source = join(cell.source);
    if (cell.cell_type === 'markdown') {
      if (source.trim() && !isColabBadge(cell)) {
        parts.push(`<div class="nb-md">${render(source, cell.attachments)}</div>`);
      }
    } else if (cell.cell_type === 'code') {
      const outputs = (cell.outputs ?? []).map((o) => renderOutput(o, render)).filter(Boolean);
      if (!source.trim() && outputs.length === 0) continue;
      const label = cell.execution_count ? `Code [${cell.execution_count}]` : 'Code';
      const code = source.trim()
        ? `<details class="nb-code" open><summary>${label}</summary>` +
          `${await highlight(source.replace(/\n+$/, ''), lang)}</details>`
        : '';
      const output = outputs.length ? `<div class="nb-out">${outputs.join('')}</div>` : '';
      parts.push(`<div class="nb-cell">${code}${output}</div>`);
    }
  }
  return { html: parts.join('\n'), headings };
}
