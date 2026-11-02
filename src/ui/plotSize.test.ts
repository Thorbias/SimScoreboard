import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { observeWidth } from './plotSize';

let notify: () => void = () => {};
let disconnected = false;

class FakeResizeObserver {
  constructor(callback: () => void) {
    notify = callback;
  }
  observe() {}
  disconnect() {
    disconnected = true;
  }
}

beforeEach(() => {
  disconnected = false;
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
    FakeResizeObserver;
});

afterEach(() => {
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
});

describe('observeWidth', () => {
  it('reports only real changes of the width', () => {
    const el = { clientWidth: 400 } as HTMLElement;
    const widths: number[] = [];
    observeWidth(el, (w) => widths.push(w));

    notify(); // nothing changed yet
    expect(widths).toEqual([]);

    (el as { clientWidth: number }).clientWidth = 520;
    notify();
    notify(); // same width again, e.g. after the chart itself was resized
    expect(widths).toEqual([520]);
  });

  it('ignores an element without a width', () => {
    const el = { clientWidth: 400 } as HTMLElement;
    const widths: number[] = [];
    observeWidth(el, (w) => widths.push(w));
    (el as { clientWidth: number }).clientWidth = 0;
    notify();
    expect(widths).toEqual([]);
  });

  it('stops watching', () => {
    const stop = observeWidth({ clientWidth: 1 } as HTMLElement, () => {});
    stop();
    expect(disconnected).toBe(true);
  });
});
