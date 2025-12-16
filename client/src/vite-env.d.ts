/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_DEEPSEEK_ANALYZE: string;
  // 可在此添加更多环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

