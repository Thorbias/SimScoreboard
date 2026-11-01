import { describe, expect, it } from 'vitest';
import { child, childText, parseXml, type XmlElement } from './xml';

/** The single top-level element of a parsed document. */
function top(xml: string): XmlElement {
  const el = parseXml(xml).children[0];
  if (!el) throw new Error('no top-level element');
  return el;
}

describe('parseXml', () => {
  it('skips the declaration and the internal DOCTYPE', () => {
    const a = top(
      '<?xml version="1.0" encoding="utf-8"?>\r\n<!DOCTYPE rF [\r\n<!ENTITY rFEnt "rFactor Entity">\r\n]>\r\n<a><b>x</b></a>',
    );
    expect(a.name).toBe('a');
    expect(childText(a, 'b')).toBe('x');
  });

  it('reads attributes, text and nesting', () => {
    const laps = top(
      '<r><Lap num="3" p="2">105.3</Lap><Lap num="4">--.----</Lap></r>',
    ).children;
    expect(laps.map((l) => l.attrs.num)).toEqual(['3', '4']);
    expect(laps[0]?.attrs.p).toBe('2');
    expect(laps[1]?.text).toBe('--.----');
  });

  it('decodes entities in text and attributes', () => {
    const a = top('<a t="x &amp; y">1 &lt; 2 &#65;&#x42;</a>');
    expect(a.attrs.t).toBe('x & y');
    expect(a.text).toBe('1 < 2 AB');
  });

  it('handles a ">" inside a quoted attribute and multi-line text', () => {
    const p = top('<P r="a>b" x="1">line one\nline two</P>');
    expect(p.attrs.r).toBe('a>b');
    expect(p.text).toBe('line one\nline two');
  });

  it('handles self-closing tags and comments', () => {
    const a = top('<a><!-- note --><b/><c>1</c></a>');
    expect(child(a, 'b')).toBeDefined();
    expect(childText(a, 'c')).toBe('1');
  });

  it('tolerates truncated input', () => {
    const a = top('<a><b>1</b><c><d>2</d>');
    expect(childText(a, 'b')).toBe('1');
    expect(childText(child(a, 'c') as XmlElement, 'd')).toBe('2');
  });

  it('ignores a stray closing tag', () => {
    const a = top('<a><b>1</b></x><c>2</c></a>');
    expect(childText(a, 'c')).toBe('2');
  });
});
