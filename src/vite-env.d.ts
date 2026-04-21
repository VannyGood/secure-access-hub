/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_TELEGRAM_ID?: string;
  /** Full origin of the Express API, e.g. https://your-api.railway.app — no trailing slash */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
