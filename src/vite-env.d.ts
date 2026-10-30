/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Enables the MSW mock backend (REST + Socket.IO). Default: "true". */
  readonly VITE_ENABLE_MOCKS?: string
  /** Initial mock scenario(s), comma separated. Default: "default". */
  readonly VITE_MOCK_SCENARIO?: string
  /** REST base URL. Default: "/api". */
  readonly VITE_API_BASE_URL?: string
  /** Socket.IO origin. Default: same origin (intercepted by MSW). */
  readonly VITE_SOCKET_URL?: string
  /** Lifetime of new sessions in minutes. Default: 30. */
  readonly VITE_SESSION_TTL_MINUTES?: string
  /** Shows the floating scenario panel. Default: "true". */
  readonly VITE_SHOW_SCENARIO_PANEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
