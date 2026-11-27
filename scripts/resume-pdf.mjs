/**
 * Prints the built /resume page to public/resume.pdf (and dist/resume.pdf).
 * Run it with `npm run resume`, which builds the site first. It needs a local Chrome or Edge;
 * set CHROME_PATH if yours is somewhere unusual. It fails if the resume is longer than one
 * page or contains anything that looks like a phone number.
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const DIST = 'dist';
const OUT = 'public/resume.pdf';
const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
};

const browsers = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = browsers.find((path) => existsSync(path));
if (!executablePath) throw new Error('No Chrome or Edge found. Set CHROME_PATH to one.');
if (!existsSync(join(DIST, 'resume', 'index.html'))) throw new Error('Run `npm run build` first.');

const html = readFileSync(join(DIST, 'resume', 'index.html'), 'utf8');
const phone = /(?:\+?\d[\s-]?){10,}/.exec(html.replace(/<[^>]+>/g, ' '));
if (phone) throw new Error(`The resume contains something like a phone number: "${phone[0]}"`);

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(
    /^(\.\.[/\\])+/,
    '',
  );
  let file = join(DIST, path);
  if (!extname(file)) file = join(file, 'index.html');
  if (!file.startsWith(DIST) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/resume/`, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  const pages = (
    Buffer.from(pdf)
      .toString('latin1')
      .match(/\/Type\s*\/Page[^s]/g) ?? []
  ).length;
  if (pages !== 1) throw new Error(`The resume is ${pages} pages. Shorten it to one.`);
  writeFileSync(OUT, pdf);
  copyFileSync(OUT, join(DIST, 'resume.pdf'));
  console.log(`Wrote ${OUT} (1 page, ${Math.round(pdf.length / 1024)} KB).`);
} finally {
  await browser.close();
  server.close();
}
