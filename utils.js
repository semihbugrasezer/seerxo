export const DEFAULT_HOST = 'https://api.seerxo.com';

export function normalizeHost(value) {
  if (!value) return DEFAULT_HOST;
  const rawValue = String(value).trim();

  try {
    const url = new URL(rawValue);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return DEFAULT_HOST;
    }
    if (url.username || url.password) {
      return DEFAULT_HOST;
    }
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_HOST;
  }
}
