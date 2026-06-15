import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright-core')
const b = await chromium.connect
