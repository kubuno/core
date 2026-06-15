// @kubuno/drive is provided by the Kubuno host at RUNTIME via its ESM import map.
// Module bundles MUST mark "@kubuno/drive" as `external` (the host resolves it to
// its singleton instances). This stub exists only so the package is installable
// and so accidental bundling fails loudly instead of silently shipping a copy.
throw new Error(
  '@kubuno/drive must be provided by the Kubuno host at runtime; mark it as `external` in your module build.'
)
