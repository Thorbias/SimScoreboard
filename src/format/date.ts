const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(
  language: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${language}|${JSON.stringify(options)}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(language, options);
    cache.set(key, f);
  }
  return f;
}

export function formatDate(ms: number | null, language: string): string {
  if (ms === null || ms <= 0) return '';
  return formatter(language, { dateStyle: 'medium' }).format(ms);
}

export function formatDateTime(ms: number | null, language: string): string {
  if (ms === null || ms <= 0) return '';
  return formatter(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(ms);
}
