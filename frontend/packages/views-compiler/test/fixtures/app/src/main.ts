import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import Counter from './Counter'

const root = document.getElementById('root')
if (!root) throw new Error('no #root')
createRoot(root).render(createElement(StrictMode, null, createElement(Counter)))
