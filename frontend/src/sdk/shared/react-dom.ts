// Facade `react-dom` + `react-dom/client` (mêmes URL dans l'import map).
import ReactDOM from 'react-dom'
import { createRoot, hydrateRoot } from 'react-dom/client'
export default ReactDOM
export { createRoot, hydrateRoot }
export const {
  createPortal, flushSync, preconnect, prefetchDNS, preinit, preinitModule,
  preload, preloadModule, requestFormReset, unstable_batchedUpdates,
  useFormState, useFormStatus, version,
} = ReactDOM
