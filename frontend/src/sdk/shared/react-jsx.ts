// Facade `react/jsx-runtime` + `react/jsx-dev-runtime` (CJS).
import JSX from 'react/jsx-runtime'
export const { Fragment, jsx, jsxs } = JSX
// jsx-dev-runtime expose jsxDEV ; en prod le runtime classique suffit.
export const jsxDEV = (JSX as { jsxDEV?: unknown }).jsxDEV ?? JSX.jsx
