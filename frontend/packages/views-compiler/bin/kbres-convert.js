#!/usr/bin/env node
// kbres-convert: i18next dictionaries -> .kbres sets (see dist/convert-cli.js).
import { main } from '../dist/convert-cli.js'

process.exitCode = await main()
