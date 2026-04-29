export const DEFAULT_HOST = 'https://api.seerxo.com';

export function normalizeHost(value) {
  if (!value) return DEFAULT_HOST;
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
