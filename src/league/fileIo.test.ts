import { describe, expect, it } from 'vitest';
import { leagueFileName } from './fileIo';

describe('leagueFileName', () => {
  it('makes a safe file name from the league name', () => {
    expect(leagueFileName('Spa Cup 2026')).toBe(
      'spa-cup-2026.simscoreboard-league.json',
    );
    expect(leagueFileName('  ../Üb?er  ')).toBe(
      'b-er.simscoreboard-league.json',
    );
    expect(leagueFileName('***')).toBe('league.simscoreboard-league.json');
  });
});
