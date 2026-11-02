/**
 * Calls `onResize` with the width of `el` whenever it really changes. The call is
 * skipped when the width is the same as before, so that resizing a chart cannot
 * set off the next resize observation by itself.
 *
 * Returns a function that stops watching.
 */
export function observeWidth(
  el: HTMLElement,
  onResize: (width: number) => void,
): () => void {
  let last = el.clientWidth;
  const observer = new ResizeObserver(() => {
    const width = el.clientWidth;
    if (width > 0 && width !== last) {
      last = width;
      onResize(width);
    }
  });
  observer.observe(el);
  return () => observer.disconnect();
}
