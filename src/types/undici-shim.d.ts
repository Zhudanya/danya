// Stub declaration for undici — removed from dependencies, dynamic imports will fail gracefully
declare module 'undici' {
  export class ProxyAgent {
    constructor(url: string)
  }
  export const fetch: typeof globalThis.fetch
  export type Response = globalThis.Response
  export class WebSocket extends globalThis.EventTarget {
    constructor(url: string, protocols?: string | string[])
  }
}
