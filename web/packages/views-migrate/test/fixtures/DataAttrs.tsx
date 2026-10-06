/** `data-*` attributes the page's styles and scripts read. */
export function DataAttrs({ moduleId, overlay }: { moduleId: string; overlay: boolean }) {
  return (
    <div data-app-shell data-kind="main">
      <aside data-app-chrome data-module={moduleId} data-overlay={overlay ? '' : undefined}>side</aside>
    </div>
  )
}
