export interface XmlElement {
  name: string;
  attrs: Record<string, string>;
  text: string;
  children: XmlElement[];
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decode(value: string): string {
  if (!value.includes('&')) return value;
  return value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, ref: string) => {
    if (ref.startsWith('#x') || ref.startsWith('#X')) {
      return String.fromCodePoint(parseInt(ref.slice(2), 16));
    }
    if (ref.startsWith('#'))
      return String.fromCodePoint(parseInt(ref.slice(1), 10));
    return ENTITIES[ref] ?? match;
  });
}

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of source.matchAll(
    /([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
  )) {
    attrs[m[1] as string] = decode((m[2] ?? m[3]) as string);
  }
  return attrs;
}

/** Index of the `>` that closes the tag starting at `from`, ignoring quoted `>`. */
function findTagEnd(input: string, from: number): number {
  let quote = '';
  for (let i = from; i < input.length; i++) {
    const c = input[i] as string;
    if (quote) {
      if (c === quote) quote = '';
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '>') {
      return i;
    }
  }
  return -1;
}

/**
 * Minimal, forgiving XML reader for the game's result files.
 *
 * It exists because `DOMParser` is not available in Web Workers or in the test
 * environment. It skips the declaration, the DOCTYPE and comments, decodes the
 * standard entities, and tolerates truncated input: elements that are still
 * open at the end are closed implicitly. Returns a synthetic root element whose
 * children are the top-level elements.
 */
export function parseXml(input: string): XmlElement {
  const root: XmlElement = { name: '#root', attrs: {}, text: '', children: [] };
  const stack: XmlElement[] = [root];
  const texts = new Map<XmlElement, string[]>();
  const top = () => stack[stack.length - 1] as XmlElement;
  const addText = (value: string) => {
    if (!value.trim()) return;
    const el = top();
    const list = texts.get(el);
    if (list) list.push(value);
    else texts.set(el, [value]);
  };

  let pos = 0;
  while (pos < input.length) {
    const lt = input.indexOf('<', pos);
    if (lt === -1) {
      addText(decode(input.slice(pos)));
      break;
    }
    if (lt > pos) addText(decode(input.slice(pos, lt)));

    if (input.startsWith('<!--', lt)) {
      const end = input.indexOf('-->', lt + 4);
      pos = end === -1 ? input.length : end + 3;
    } else if (input.startsWith('<![CDATA[', lt)) {
      const end = input.indexOf(']]>', lt + 9);
      addText(input.slice(lt + 9, end === -1 ? input.length : end));
      pos = end === -1 ? input.length : end + 3;
    } else if (input.startsWith('<?', lt)) {
      const end = input.indexOf('?>', lt + 2);
      pos = end === -1 ? input.length : end + 2;
    } else if (input.startsWith('<!', lt)) {
      // DOCTYPE, possibly with an internal subset in square brackets.
      const bracket = input.indexOf('[', lt);
      const gt = input.indexOf('>', lt);
      let end = gt;
      if (bracket !== -1 && (gt === -1 || bracket < gt)) {
        const close = input.indexOf(']', bracket);
        end = close === -1 ? -1 : input.indexOf('>', close);
      }
      pos = end === -1 ? input.length : end + 1;
    } else if (input[lt + 1] === '/') {
      const end = input.indexOf('>', lt);
      const name = input.slice(lt + 2, end === -1 ? input.length : end).trim();
      const at = stack.map((e) => e.name).lastIndexOf(name);
      if (at > 0) stack.length = at;
      pos = end === -1 ? input.length : end + 1;
    } else {
      const end = findTagEnd(input, lt + 1);
      if (end === -1) break;
      const inner = input.slice(lt + 1, end);
      const selfClosing = inner.endsWith('/');
      const body = selfClosing ? inner.slice(0, -1) : inner;
      const space = body.search(/\s/);
      const name = space === -1 ? body : body.slice(0, space);
      const element: XmlElement = {
        name,
        attrs: space === -1 ? {} : parseAttrs(body.slice(space)),
        text: '',
        children: [],
      };
      top().children.push(element);
      if (!selfClosing) stack.push(element);
      pos = end + 1;
    }
  }

  for (const [el, list] of texts) el.text = list.join('').trim();
  return root;
}

export function child(el: XmlElement, name: string): XmlElement | undefined {
  return el.children.find((c) => c.name === name);
}

export function childText(el: XmlElement, name: string): string | undefined {
  return child(el, name)?.text;
}
