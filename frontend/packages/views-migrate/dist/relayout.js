/**
 * `kbview-migrate --relayout`: puts the views and the user controls of a web project where they belong
 * (VIEWS-SPEC §1.1–1.2): each view classified again (`.kbview` ↔ `.kbcontrol`, the root wrapped in or taken out of
 * `<UserControl>`), moved into its role folder, every relative import of the project rewritten. Files are moved
 * with `git mv` when the project is a Git work tree, so their history follows them.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { Project, ts as morphTs } from 'ts-morph';
import { classify, existsIn, listFiles, nameCollisions, planLayout, readSources, relocate, slash, toControlText, toViewText, unitsOf, } from './layout.js';
/** Computes the relayout of a project (nothing written). */
export function planRelayout(opts) {
    const root = slash(resolve(opts.root));
    const files = listFiles(join(root, 'src'));
    const exclude = (opts.exclude ?? []).map((x) => slash(resolve(root, x)));
    const units = classify(unitsOf(files, { components: opts.components, exclude }), readSources(files), files);
    const chosen = opts.only ? units.filter(opts.only) : units;
    const place = new Map((opts.place ?? []).map((x) => [slash(resolve(root, x.unit)), slash(resolve(root, x.dir))]));
    for (const key of place.keys())
        if (!units.some((u) => (u.view ?? u.module) === key))
            throw new Error(`--place: ${key} is no view or component of the project`);
    const rename = new Map((opts.rename ?? []).map((x) => [slash(resolve(root, x.unit)), x.stem]));
    for (const key of rename.keys())
        if (!units.some((u) => (u.view ?? u.module) === key))
            throw new Error(`--rename: ${key} is no view or component of the project`);
    // A user control is an element named after its file: one name, one control, and never a host element's name.
    const clashes = nameCollisions(units, hostElementNames(root), rename);
    if (clashes.size) {
        throw new Error(`user control names taken (rename them with --rename <view>=<NewName>):\n${[...clashes].map(([n, f]) => `  ${n}: ${f.map((x) => slash(relative(root, x))).join(', ')}`).join('\n')}`);
    }
    const moves = planLayout(chosen, { roots: (opts.appRoots ?? ['src']).map((r) => resolve(root, r)), split: opts.split, exclude, place, rename });
    for (const m of opts.extraMoves ?? [])
        moves.push({ from: slash(resolve(root, m.from)), to: slash(resolve(root, m.to)) });
    const sources = readSources(files);
    for (const u of units) {
        const stem = rename.get(u.view ?? u.module);
        if (stem)
            renameClass(sources, u.files, u.stem, stem);
    }
    const rel = relocate(sources, moves, existsIn(files));
    const writes = new Map([...rel.edited, ...rel.moved]);
    // Views changing kind: their markup.
    const target = new Map(moves.map((m) => [m.from, m.to]));
    for (const u of chosen) {
        if (!u.view)
            continue;
        const to = target.get(u.view) ?? u.view;
        const text = readFileSync(u.view, 'utf8');
        const next = u.role === 'control' ? toControlText(text) : (toViewText(text) ?? text);
        if (next !== text || to !== u.view)
            writes.set(to, next);
    }
    const warnings = [];
    const config = join(root, 'kubuno.views.json');
    const named = [config, ...files.filter((f) => /\.(json|html|css|mjs)$/.test(f) && !/i18n\.data\.json$/.test(f))];
    for (const f of named) {
        if (!existsSync(f))
            continue;
        const text = readFileSync(f, 'utf8');
        for (const m of moves) {
            const r = slash(relative(root, m.from));
            if (text.includes(r) || text.includes(`./${basename(m.from)}`))
                warnings.push(`${slash(relative(root, f))} names ${r}`);
        }
    }
    return { units, moves, writes, warnings };
}
/** The element names of the project's registries (`kubuno.views.json`: the host's, then the project's own). */
function hostElementNames(root) {
    const names = new Set();
    const config = join(root, 'kubuno.views.json');
    const cfg = existsSync(config) ? JSON.parse(readFileSync(config, 'utf8')) : {};
    const files = [resolve(root, cfg.hostRegistry ?? 'node_modules/@kubuno/ui/kbview-registry.web.json'), ...(cfg.registries ?? []).map((r) => resolve(root, r))];
    for (const f of files) {
        if (!existsSync(f))
            continue;
        const doc = JSON.parse(readFileSync(f, 'utf8'));
        for (const c of doc.components ?? []) {
            names.add(c.name);
            for (const a of c.aliases ?? [])
                names.add(a);
        }
    }
    return names;
}
/** Renames the class `from` of a unit's code to `to`, with every reference in the unit's own files. */
function renameClass(sources, files, from, to) {
    const code = files.filter((f) => sources.has(f));
    const project = new Project({ useInMemoryFileSystem: true, compilerOptions: { jsx: morphTs.JsxEmit.Preserve, allowJs: false } });
    for (const f of code)
        project.createSourceFile(f, sources.get(f) ?? '');
    for (const f of code) {
        const cls = project.getSourceFileOrThrow(f).getClass(from);
        if (cls)
            cls.rename(to);
    }
    for (const f of code)
        sources.set(f, project.getSourceFileOrThrow(f).getFullText());
}
/** Writes a plan: `git mv` (or a rename) for every move, then the new texts. */
export function applyRelayout(root, plan) {
    const git = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, encoding: 'utf8' }).stdout?.trim() === 'true';
    for (const m of plan.moves) {
        mkdirSync(dirname(m.to), { recursive: true });
        const tracked = git && spawnSync('git', ['ls-files', '--error-unmatch', m.from], { cwd: root, encoding: 'utf8' }).status === 0;
        if (tracked) {
            const r = spawnSync('git', ['mv', m.from, m.to], { cwd: root, encoding: 'utf8' });
            if (r.status !== 0)
                throw new Error(`git mv ${m.from} ${m.to}: ${r.stderr}`);
        }
        else
            renameSync(m.from, m.to);
    }
    for (const [p, text] of plan.writes) {
        mkdirSync(dirname(p), { recursive: true });
        writeFileSync(p, text);
    }
}
/** The report of a plan: one line per unit (role, kind, why, where to). */
export function relayoutReport(root, plan) {
    const to = new Map(plan.moves.map((m) => [m.from, m.to]));
    const r = (p) => slash(relative(root, p));
    const rows = plan.units.map((u) => {
        const main = u.view ?? u.module;
        return { file: r(main), to: r(to.get(main) ?? main), role: u.role, kind: u.kind, reason: u.reason, hosts: u.hosts.map(r) };
    });
    const lines = rows.map((x) => `${x.role === 'view' ? 'VIEW   ' : 'CONTROL'} ${x.kind.padEnd(7)} ${x.file}${x.to !== x.file ? ` → ${x.to}` : ''}  (${x.reason})`);
    const views = plan.units.filter((u) => u.view);
    lines.push('', `${views.filter((u) => u.role === 'view').length} view(s), ${views.filter((u) => u.role === 'control').length} user control(s) among ${views.length} view files; ${plan.units.length - views.length} React component(s); ${plan.moves.length} file move(s), ${plan.writes.size} file(s) written`);
    for (const w of plan.warnings)
        lines.push(`warning: ${w}`);
    return { lines, json: { units: rows, moves: plan.moves.map((m) => ({ from: r(m.from), to: r(m.to) })), warnings: plan.warnings } };
}
