// @kubuno/views is provided by the Kubuno host at RUNTIME via its ESM import map.
// Module bundles MUST mark "@kubuno/views" as `external` (the host resolves it to
// its single instance: one binding engine, one live-view registry). This stub exists
// only so the package is installable and so accidental bundling fails loudly instead
// of silently shipping a second runtime.
throw new Error(
  '@kubuno/views must be provided by the Kubuno host at runtime; mark it as `external` in your module build.'
)
