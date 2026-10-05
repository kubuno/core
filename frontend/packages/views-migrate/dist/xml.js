/** The `.kbview` markup the codemod builds, and its writer (two-space indentation, one element per line). */
import { xmlAttr } from './jsxtext.js';
export function attr(node, name, value) {
    const i = node.attrs.findIndex((a) => a.name === name);
    if (i >= 0)
        node.attrs[i] = { name, value };
    else
        node.attrs.push({ name, value });
}
/** Attribute order: x:Name first, then the element's content-ish properties, events last. */
function ordered(attrs) {
    const rank = (a) => (a.name.startsWith('x:') ? 0 : a.name.startsWith('On') && /^On[A-Z]/.test(a.name) ? 3 : a.name === 'Class' ? 2 : 1);
    return [...attrs].sort((a, b) => rank(a) - rank(b));
}
function comment(text) {
    return `<!-- ${text.replace(/--/g, '- -')} -->`;
}
export function writeXml(root, header) {
    const out = [];
    if (header)
        out.push(comment(header));
    const walk = (n, indent) => {
        if (n.comment)
            out.push(indent + comment(n.comment));
        const attrs = ordered(n.attrs).map((a) => `${a.name}="${xmlAttr(a.value)}"`);
        const open = `<${n.el}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
        const line = indent + open;
        // Long tags wrap their attributes, aligned under the first one.
        const tag = line.length > 140 && attrs.length > 1
            ? [indent + `<${n.el} ${attrs[0]}`, ...attrs.slice(1).map((a) => indent + ' '.repeat(n.el.length + 2) + a)].join('\n')
            : line;
        if (!n.children.length) {
            out.push(tag + '/>');
            return;
        }
        out.push(tag + '>');
        for (const c of n.children)
            walk(c, indent + '  ');
        out.push(`${indent}</${n.el}>`);
    };
    walk(root, '');
    return out.join('\n') + '\n';
}
