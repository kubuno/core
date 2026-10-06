#!/usr/bin/env node
// kbview-migrate: TSX screen -> .kbview + code-behind + report (see dist/cli.js).
import { main } from '../dist/cli.js'

process.exitCode = await main()
