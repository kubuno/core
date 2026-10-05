/**
 * The web element registry read backwards: which `.kbview` element renders a given React component, and which
 * `.kbview` property / event a React prop corresponds to (`prop_map` / `event_map` of `kbview-registry.web.json`
 * and the project registries). WEB-VIEWS.md §6.2: "`@ui` elements → `.kbview` elements by reverse registry lookup
 * (`propMap`, lower-case enums → PascalCase, `children` → `Text` or content)".
 */
import { readFileSync } from 'node:fs';
export class Registry {
    byExport = new Map();
    byName = new Map();
    /** Loads registries (host first, then project registries, whose `./x` modules are relative to `base`). */
    static load(files) {
        const r = new Registry();
        for (const { file, rewriteModule } of files) {
            const doc = JSON.parse(readFileSync(file, 'utf8'));
            for (const c of doc.components)
                r.add(c, rewriteModule);
        }
        return r;
    }
    add(c, rewrite) {
        const w = c.web;
        const props = new Map();
        const events = new Map();
        for (const [name, t] of Object.entries(w?.prop_map ?? {})) {
            if (!t.prop || props.has(t.prop))
                continue;
            const values = t.values ? new Map(Object.entries(t.values).map(([k, v]) => [String(v), k])) : undefined;
            props.set(t.prop, { name, values, convert: t.convert, change: t.change });
        }
        for (const [name, s] of Object.entries(w?.event_map ?? {})) {
            if (s.prop && !events.has(s.prop))
                events.set(s.prop, { name, args: s.args });
        }
        const defaults = new Map();
        for (const p of c.properties ?? [])
            if (p.default !== undefined && p.default !== null)
                defaults.set(p.name, String(p.default));
        const info = {
            name: c.name,
            module: w?.module ? (rewrite ? rewrite(w.module) : w.module) : '',
            export: w?.export ?? '',
            children: c.children ?? 'None',
            content: w?.content ?? undefined,
            props,
            events,
            propertyNames: new Set([...(c.properties ?? []).map((p) => p.name), ...Object.keys(w?.prop_map ?? {})]),
            eventNames: new Set((c.events ?? []).map((e) => e.name)),
            defaults,
        };
        this.byName.set(c.name, info);
        if (w?.module && w.export) {
            const key = `${info.module}#${w.export}`;
            // The first element rendering a component is its canonical one (TextField over its alternates).
            if (!this.byExport.has(key))
                this.byExport.set(key, info);
        }
    }
    /** The element rendering export `name` of `module` (`@ui#Button` → `Button`). */
    element(module, name) {
        return this.byExport.get(`${module}#${name}`);
    }
    byElementName(name) {
        return this.byName.get(name);
    }
}
