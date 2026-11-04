import { describe, expect, it } from 'vitest';
import { isChatSender } from './names';

describe('isChatSender', () => {
  it('matches the short name the chat shows', () => {
    expect(isChatSender('V Deux', 'Vittorio Deux')).toBe(true);
    expect(isChatSender('C McHugh', 'Cameron McHugh')).toBe(true);
    expect(isChatSender('A Luis', 'Andre Luis#14')).toBe(true);
  });

  it('matches the full name, with or without suffix and case', () => {
    expect(isChatSender('Anna Example', 'anna example#4711')).toBe(true);
  });

  it('matches the initial with the last part of a longer name', () => {
    expect(isChatSender('M Berg', 'Max Van Der Berg')).toBe(true);
    expect(isChatSender('M Van Der Berg', 'Max Van Der Berg')).toBe(true);
  });

  it('does not match another driver', () => {
    expect(isChatSender('V Deux', 'Greg Wilson')).toBe(false);
    expect(isChatSender('W Deux', 'Vittorio Deux')).toBe(false);
    expect(isChatSender('Deux', 'Vittorio Deux')).toBe(false);
  });

  it('does not match an empty name', () => {
    expect(isChatSender('', 'Vittorio Deux')).toBe(false);
    expect(isChatSender('V Deux', '')).toBe(false);
  });
});
