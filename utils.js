export const DEFAULT_HOST = 'https://api.seerxo.com';

export function normalizeHost(value) {
  return value ? value.replace(/\/$/, '') : DEFAULT_HOST;
}
