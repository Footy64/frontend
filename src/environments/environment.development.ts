const resolvedBaseApi =
  import.meta.env?.NG_APP_API_BASE_URL ??
  (globalThis as { NG_APP_API_BASE_URL?: string }).NG_APP_API_BASE_URL ??
  'http://localhost:3000/api';

export const environment = {
  baseApi: resolvedBaseApi,
  production: false,
};
