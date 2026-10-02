# @kubuno/vectors

Conformance-vector runner for Kubuno shared cores. A shared algorithm (for example the forms conditional logic,
`kubuno-forms-core`) publishes JSON **vector suites**: inputs and the outputs every implementation, in any language,
must produce. This package runs a suite against a TypeScript implementation, with vitest or `node:test`, and
verifies vendored copies of suites. Test-time only, Node 20 or later, no dependencies.

The format (format 1) is defined by `vectors/conformance-vectors.schema.json` in
[kubuno/core](https://github.com/kubuno/core); the Rust runner is the `kubuno-vectors` crate of the same repository
and the Kotlin runner lives in the Android repository (`:core-vectors`).

## Running a suite

```ts
import { describe, it } from 'vitest'
import { defineVectorTests } from '@kubuno/vectors'
import { evalOperator } from './logic'

// One test per case, named by its id.
defineVectorTests('vectors/operators.json', (input) => evalOperator(input.operator, input.answer, input.compare), { describe, it })
```

`assertSuite(path, fn)` runs a whole suite in one test and throws a report listing every failing case.
Outputs are compared as JSON: numbers by value, object keys in any order, arrays in order. A case with
`"skip": { "ts": "reason" }` is reported as skipped.

## Vendoring suites from another repository

```sh
npx kubuno-vectors vendor ../core/vectors/sync test/vectors/sync \
  --source https://github.com/kubuno/core --ref vectors-v0.1.0 --path vectors/sync
npx kubuno-vectors check test/vectors/sync     # in CI
```

`VENDOR.json` records the source, the tag and the SHA-256 of each file (computed with CRLF normalised to LF), and
`verifyVendor(dir)` refuses a folder whose files do not match it.

## Licence

AGPL-3.0-or-later.
