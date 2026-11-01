import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const tokensCss = readFileSync(
  new URL('./tokens.css', import.meta.url),
  'utf8',
);

function parseBlock(block: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    vars[m[1] as string] = (m[2] as string).trim();
  }
  return vars;
}

const darkBlock = /:root\s*\{([^}]*)\}/.exec(tokensCss)?.[1] ?? '';
const lightBlock =
  /:root\[data-theme='light'\]\s*\{([^}]*)\}/.exec(tokensCss)?.[1] ?? '';
const autoLightBlock =
  /:root:not\(\[data-theme\]\)\s*\{([^}]*)\}/.exec(tokensCss)?.[1] ?? '';

const dark = parseBlock(darkBlock);
const light = { ...dark, ...parseBlock(lightBlock) };

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi as number) + 0.05) / ((lo as number) + 0.05);
}

const THEMES = { dark, light };

describe('light theme definitions', () => {
  it('are identical for the explicit choice and the system query', () => {
    expect(Object.keys(parseBlock(lightBlock)).length).toBeGreaterThan(10);
    expect(parseBlock(autoLightBlock)).toEqual(parseBlock(lightBlock));
  });
});
const AA = 4.5;

describe.each(Object.entries(THEMES))('%s theme', (_name, theme) => {
  const color = (token: string) => {
    const value = theme[token];
    if (!value) throw new Error(`token ${token} is missing`);
    return value;
  };

  it('reads every token as a hex colour', () => {
    for (const token of [
      '--bg',
      '--panel',
      '--text',
      '--muted',
      '--accent',
      '--accent-text',
      '--you',
      '--fastest',
      '--pb',
      '--win',
      '--warning',
      '--error',
    ]) {
      expect(color(token), token).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('keeps body and supporting text readable on both surfaces', () => {
    for (const surface of ['--bg', '--panel']) {
      for (const text of ['--text', '--text-body', '--muted']) {
        expect(
          contrast(color(text), color(surface)),
          `${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(AA);
      }
    }
  });

  it('keeps text on the accent button readable', () => {
    expect(
      contrast(color('--accent-text'), color('--accent')),
    ).toBeGreaterThanOrEqual(AA);
  });

  it('keeps every role colour readable as text on both surfaces', () => {
    for (const surface of ['--bg', '--panel']) {
      for (const role of [
        '--accent',
        '--you',
        '--fastest',
        '--pb',
        '--win',
        '--warning',
        '--error',
      ]) {
        expect(
          contrast(color(role), color(surface)),
          `${role} on ${surface}`,
        ).toBeGreaterThanOrEqual(AA);
      }
    }
  });
});
