import { describe, expect, it } from 'vitest';
import { parseRoute, routes } from './route';

describe('routes', () => {
  it('defaults to the library', () => {
    expect(parseRoute('')).toEqual({ name: 'library' });
    expect(parseRoute('#/')).toEqual({ name: 'library' });
    expect(parseRoute('#/unknown')).toEqual({ name: 'library' });
  });

  it('parses settings and sessions', () => {
    expect(parseRoute('#/settings')).toEqual({ name: 'settings' });
    expect(parseRoute('#/records')).toEqual({ name: 'records' });
    const id = '2026_10_30_14_38_02-65R1.xml';
    expect(parseRoute(routes.session(id))).toEqual({ name: 'session', id });
  });
});
