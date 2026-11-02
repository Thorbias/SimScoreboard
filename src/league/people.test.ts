import { describe, expect, it } from 'vitest';
import { mergedInto, mergeInto } from './people';

describe('people', () => {
  it('merges a name into another', () => {
    const people = mergeInto([], 'Cora Demo', 'Dora');
    expect(people).toEqual([{ name: 'Dora', aliases: ['Cora Demo'] }]);
    expect(mergedInto(people, 'cora demo#12')).toBe('Dora');
    expect(mergedInto(people, 'Dora')).toBeNull();
  });

  it('collects several names under one person', () => {
    let people = mergeInto([], 'Cora Demo', 'Dora');
    people = mergeInto(people, 'Eva Other', 'Dora');
    expect(people).toEqual([
      { name: 'Dora', aliases: ['Cora Demo', 'Eva Other'] },
    ]);
  });

  it('releases a name', () => {
    const people = mergeInto(
      mergeInto([], 'Cora Demo', 'Dora'),
      'Cora Demo',
      null,
    );
    expect(people).toEqual([]);
  });

  it('moves the followers along when a person is merged into another', () => {
    let people = mergeInto([], 'Cora Demo', 'Dora');
    people = mergeInto(people, 'Dora', 'Anna');
    expect(people).toEqual([{ name: 'Anna', aliases: ['Dora', 'Cora Demo'] }]);
  });

  it('merges into the person behind an alias', () => {
    let people = mergeInto([], 'Cora Demo', 'Dora');
    people = mergeInto(people, 'Eva Other', 'Cora Demo');
    expect(people).toEqual([
      { name: 'Dora', aliases: ['Cora Demo', 'Eva Other'] },
    ]);
  });

  it('ignores a merge into itself', () => {
    expect(mergeInto([], 'Cora Demo', 'cora demo')).toEqual([]);
  });
});
