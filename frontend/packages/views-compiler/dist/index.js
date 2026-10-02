/**
 * `@kubuno/views-compiler` — the build-time side of `.kbview` web views (vskubuno docs/WEB-VIEWS.md, WV-2):
 * the WebAssembly build of the shared `.kbview` grammar and web compiler, the Vite plugin, and `kbview-tsc`.
 * A devDependency: nothing here ships to the browser except through `./browser` (the design surface).
 */
export { kbview, formatDiagnostic, TSCONFIG_HINT } from './vite.js';
export { emitViewModule, specifierFor, isAllowedImport, ICON_ALIASES } from './emit.js';
export { CompilerWasm, ViewCompiler } from './compiler.js';
export { ViewProject, loadNodeCompiler, scanViews, userControlsOf, codeBehindOf, viewOfCodeBehind, generatedPaths, writeGenerated, findHostRegistry, projectRegistryJson, GENERATED_DIR, VIEW_EXTENSIONS, } from './project.js';
export { runKbviewTsc, remapTscOutput, mapCheckPosition, loadRemapContext } from './tsc.js';
export { encodeMappings, decodeMappings } from './sourcemap.js';
