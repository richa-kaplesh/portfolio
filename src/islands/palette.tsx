import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { search, type PaletteItem } from '@/lib/palette';

interface Props {
  items: PaletteItem[];
  onClose: () => void;
}

function Palette({ items, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, query]);

  const matches = search(items, query);
  const groups = [...new Set(matches.map((item) => item.group))];
  // Keyboard order follows what is on screen: group by group.
  const ordered = groups.flatMap((group) => matches.filter((item) => item.group === group));
  const current = Math.min(active, ordered.length - 1);

  const run = async (item: PaletteItem | undefined) => {
    if (!item) return;
    if (item.href) {
      location.href = item.href;
      dialog.current?.close();
    } else if (item.action === 'theme') {
      document.querySelector<HTMLButtonElement>('#theme-toggle')?.click();
      dialog.current?.close();
    } else if (item.action === 'download' && item.value) {
      const link = document.createElement('a');
      link.href = item.value;
      link.download = '';
      link.click();
      dialog.current?.close();
    } else if (item.action === 'copy' && item.value) {
      try {
        await navigator.clipboard.writeText(item.value);
        setMessage(`Copied ${item.value}`);
      } catch {
        // Copying is blocked: show the address, so it can be selected by hand.
        setMessage(item.value);
      }
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const last = ordered.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: current >= last ? 0 : current + 1,
      ArrowUp: current <= 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next !== undefined && last >= 0) {
      event.preventDefault();
      setActive(next);
    } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void run(ordered[current]);
    }
  };

  return (
    <dialog
      ref={dialog}
      className="palette"
      aria-label="Search this site"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="palette-body">
        <div className="palette-top">
          <input
            type="text"
            role="combobox"
            aria-label="Search pages, projects, posts and actions"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={ordered.length ? `palette-${current}` : undefined}
            placeholder="Search or jump to"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setMessage('');
            }}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="link" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
        <div ref={list} id="palette-list" role="listbox" aria-label="Results">
          {groups.map((group) => (
            <div role="group" aria-label={group} key={group}>
              <p className="meta" aria-hidden="true">
                {group}
              </p>
              {ordered.map((item, index) =>
                item.group === group ? (
                  <div
                    role="option"
                    id={`palette-${index}`}
                    key={`${item.group}-${item.label}`}
                    aria-selected={index === current}
                    onMouseMove={() => setActive(index)}
                    onClick={() => void run(item)}
                  >
                    {item.label}
                  </div>
                ) : null,
              )}
            </div>
          ))}
        </div>
        <p className="meta" role="status">
          {message || (ordered.length ? '' : 'No matches')}
        </p>
      </div>
    </dialog>
  );
}

let root: Root | undefined;
let items: Promise<PaletteItem[]> | undefined;
let isOpen = false;

export async function openPalette() {
  if (isOpen) return;
  isOpen = true;
  try {
    items ??= fetch('/search.json').then((response) => {
      if (!response.ok) throw new Error(`search.json: ${response.status}`);
      return response.json() as Promise<PaletteItem[]>;
    });
    const loaded = await items;
    if (!root) {
      const host = document.createElement('div');
      document.body.append(host);
      root = createRoot(host);
    }
    const close = () => {
      isOpen = false;
      root?.render(null);
    };
    root.render(<Palette items={loaded} onClose={close} />);
  } catch (error) {
    items = undefined;
    isOpen = false;
    throw error;
  }
}
