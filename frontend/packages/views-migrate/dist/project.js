/**
 * The project the codemod works in: a ts-morph `Project` over the web project's own `tsconfig` (so `@ui`, `@kubuno/*`
 * resolve as in the build and the checker knows every type), the element registries of `kubuno.views.json`, and the
 * i18next bundles of the fallback language (to know which `{Res}` keys need their `defaultValue`).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Project } from 'ts-morph';
import { Registry } from './registry.js';
/** Dotted keys of a nested i18next bundle. */
function keysOf(o, prefix = '', out = new Set()) {
    if (o && typeof o === 'object')
        for (const [k, v] of Object.entries(o)) {
            if (typeof v === 'string')
                out.add(prefix + k);
            else
                keysOf(v, `${prefix}${k}.`, out);
        }
    return out;
}
/** `<root>/src/**\/locales/<lang>/<ns>.json` bundles of `lang`, by namespace. */
function jsonBundles(root, lang) {
    const out = new Map();
    const walk = (dir) => {
        for (const name of readdirSync(dir)) {
            if (['node_modules', '.kubuno', 'dist', '.git'].includes(name))
                continue;
            const full = join(dir, name);
            if (!statSync(full).isDirectory())
                continue;
            if (name === 'locales' && existsSync(join(full, lang))) {
                for (const f of readdirSync(join(full, lang))) {
                    if (!f.endsWith('.json'))
                        continue;
                    const ns = f.replace(/\.json$/, '');
                    const keys = out.get(ns) ?? new Set();
                    keysOf(JSON.parse(readFileSync(join(full, lang, f), 'utf8')), '', keys);
                    out.set(ns, keys);
                }
            }
            else
                walk(full);
        }
    };
    if (existsSync(join(root, 'src')))
        walk(join(root, 'src'));
    return out;
}
export function openProject(root, files, opts = {}) {
    const tsconfig = opts.tsconfig ?? ['tsconfig.app.json', 'tsconfig.json'].map((f) => join(root, f)).find((f) => existsSync(f));
    const project = new Project({ tsConfigFilePath: tsconfig, skipAddingFilesFromTsConfig: true });
    // The whole source tree: the codemod rewrites the importers of a converted component.
    project.addSourceFilesAtPaths([join(root, 'src/**/*.{ts,tsx}').split('\\').join('/'), `!${join(root, 'src/**/*.d.ts').split('\\').join('/')}`]);
    for (const f of files)
        if (!project.getSourceFile(f))
            project.addSourceFileAtPath(f);
    const views = existsSync(join(root, 'kubuno.views.json')) ? JSON.parse(readFileSync(join(root, 'kubuno.views.json'), 'utf8')) : {};
    const host = resolve(root, views.hostRegistry ?? 'node_modules/@kubuno/ui/kbview-registry.web.json');
    const registries = [{ file: host }];
    for (const r of views.registries ?? []) {
        const file = resolve(root, r);
        const base = dirname(file);
        // A project registry's `./x` modules are relative to it; seen from the codemod they are files.
        registries.push({ file, rewriteModule: (m) => (m.startsWith('.') ? resolve(base, m) : m) });
    }
    const registry = Registry.load(registries);
    const bundles = jsonBundles(root, opts.fallbackLng ?? 'en');
    const config = {
        project,
        registry,
        root,
        defaultNs: opts.defaultNs ?? 'core',
        hasKey: (ns, key) => bundles.get(ns)?.has(key) ?? false,
    };
    return { project, config };
}
