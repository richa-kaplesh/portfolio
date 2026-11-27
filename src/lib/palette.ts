export interface PaletteItem {
  group: string;
  label: string;
  keywords?: string;
  href?: string;
  action?: 'copy' | 'download' | 'theme';
  value?: string;
}

/** Every word must match. Labels that start with the query come first within the result. */
export function search(items: PaletteItem[], query: string): PaletteItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return items;
  const start = words.join(' ');
  return items
    .filter((item) => {
      const text = `${item.label} ${item.group} ${item.keywords ?? ''}`.toLowerCase();
      return words.every((word) => text.includes(word));
    })
    .sort(
      (a, b) =>
        Number(b.label.toLowerCase().startsWith(start)) -
        Number(a.label.toLowerCase().startsWith(start)),
    );
}
