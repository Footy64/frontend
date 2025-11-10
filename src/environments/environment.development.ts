type GlobalWithApiEnv = typeof globalThis & {
  NG_APP_API_BASE_URL?: string;
  process?: { env?: { NG_APP_API_BASE_URL?: string } };
};

const resolvedBaseApi =
  import.meta.env?.NG_APP_API_BASE_URL ??
  (globalThis as GlobalWithApiEnv).NG_APP_API_BASE_URL ??
  (globalThis as GlobalWithApiEnv).process?.env?.NG_APP_API_BASE_URL ??
  'http://localhost:3000/api';

export const environment = {
  baseApi: resolvedBaseApi,
  production: false,
};
