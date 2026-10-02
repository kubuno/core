// jsdom lacks a few browser APIs the host's @ui components use; deterministic stand-ins (the same in both
// renderings, so they never hide a difference between them).
class NoopResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const g = globalThis as unknown as Record<string, unknown>
g.ResizeObserver ??= NoopResizeObserver
g.matchMedia ??= (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})
if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).matchMedia = g.matchMedia
