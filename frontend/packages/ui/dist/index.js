import * as e from "react";
import t, { cloneElement as n, createContext as r, createElement as i, forwardRef as a, useCallback as o, useContext as s, useEffect as c, useId as l, useImperativeHandle as u, useLayoutEffect as d, useMemo as f, useRef as p, useState as m, useSyncExternalStore as h } from "react";
import { Fragment as g, jsx as _, jsxs as v } from "react/jsx-runtime";
import { clsx as y } from "clsx";
import { twMerge as b } from "tailwind-merge";
import { AlertCircle as x, AlertTriangle as S, ArrowDown as C, ArrowUp as w, Bold as T, Calendar as E, Check as D, CheckCircle2 as O, ChevronDown as k, ChevronLeft as A, ChevronRight as j, ChevronUp as M, ChevronsLeft as N, ChevronsRight as P, ChevronsUpDown as F, Circle as I, Clock as ee, Columns3 as L, Copy as R, Eraser as z, GripVertical as B, Inbox as V, Info as H, Italic as U, Layers as W, Link2 as G, List as K, ListOrdered as te, MoreHorizontal as q, MoreVertical as ne, Pipette as re, Plus as ie, Rows3 as ae, Search as oe, SearchX as se, Settings2 as J, Square as ce, SquareArrowOutUpRight as Y, TextCursorInput as le, Trash2 as ue, Triangle as de, Underline as fe, X as pe } from "lucide-react";
import { createPortal as X } from "react-dom";
import { addMonths as me, eachDayOfInterval as he, endOfMonth as ge, endOfWeek as _e, format as Z, getMonth as ve, getYear as Q, isAfter as ye, isBefore as be, isSameDay as xe, isSameMonth as Se, isToday as Ce, isValid as we, parseISO as Te, startOfMonth as Ee, startOfWeek as De, subMonths as Oe } from "date-fns";
import { fr as ke } from "date-fns/locale";
import { create as Ae } from "zustand";
import je from "axios";
import { SDK_VERSION as Me } from "@kubuno/sdk";
import * as Ne from "@ui";
import { ComponentRegistry as Pe } from "@ui";
//#region ../../src/ui/themeRegistry.tsx
var Fe = /* @__PURE__ */ new Map(), Ie = /* @__PURE__ */ new Map(), Le = /* @__PURE__ */ new Map(), Re = 0, ze = /* @__PURE__ */ new Set();
function Be() {
	Re += 1;
	for (let e of ze) e();
}
var Ve = {
	register(e, t, n) {
		if (n?.moduleId) {
			let r = Ie.get(n.moduleId);
			r || (r = /* @__PURE__ */ new Map(), Ie.set(n.moduleId, r)), r.set(e, t);
		} else Fe.set(e, t);
		Be();
	},
	unregister(e, t) {
		t?.moduleId ? Ie.get(t.moduleId)?.delete(e) : Fe.delete(e), Be();
	},
	resolve(e, t) {
		if (t) {
			let n = Ie.get(t)?.get(e);
			if (n) return n;
		}
		return Fe.get(e);
	},
	clearModule(e) {
		Ie.delete(e) && Be();
	},
	clearAll() {
		Fe.clear(), Ie.clear(), Be();
	},
	registerPreview(e, t) {
		Le.set(e, t), Be();
	},
	resolvePreview(e) {
		return Le.get(e);
	},
	clearPreview() {
		Le.size && (Le.clear(), Be());
	},
	subscribe(e) {
		return ze.add(e), () => {
			ze.delete(e);
		};
	},
	getVersion() {
		return Re;
	}
}, He = r(void 0), Ue = r(!1);
function We() {
	return h(Ve.subscribe, Ve.getVersion, Ve.getVersion);
}
var Ge = Symbol.for("react.forward_ref"), Ke = Symbol.for("react.memo");
function qe(e) {
	if (typeof e == "string") return !0;
	let t = e?.$$typeof;
	return t === Ge || t === Ke;
}
function $(e, t) {
	let n = a(function(n, r) {
		We();
		let a = s(Ue), o = s(He), c = (a ? Ve.resolvePreview(e) : Ve.resolve(e, o)) ?? t;
		return i(c, r != null && qe(c) ? {
			...n,
			ref: r
		} : n);
	});
	return n.displayName = `Themed(${e})`, n;
}
//#endregion
//#region ../../src/ui/portalHost.tsx
var Je = r(null);
function Ye() {
	let e = s(Je);
	return e ? {
		host: e,
		scoped: !0
	} : {
		host: typeof document < "u" ? document.body : null,
		scoped: !1
	};
}
//#endregion
//#region ../../src/ui/Button.tsx
var Xe = [
	"inline-flex items-center justify-center select-none",
	"transition-colors rounded-md",
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
	"disabled:opacity-50 disabled:cursor-not-allowed"
].join(" "), Ze = {
	primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
	secondary: "bg-white border border-border text-text-primary hover:bg-surface-1 active:bg-surface-2",
	ghost: "bg-transparent text-text-secondary hover:bg-surface-2 active:bg-surface-3",
	text: "bg-transparent text-primary hover:bg-primary-light active:bg-primary-light",
	textDanger: "bg-transparent text-danger hover:bg-danger-light active:bg-danger-light",
	danger: "bg-danger text-white hover:opacity-90 active:opacity-80"
}, Qe = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-9 px-4 text-sm gap-2",
	lg: "h-11 px-5 text-sm gap-2"
};
function $e({ variant: e = "primary", size: t = "md", icon: n, loading: r = !1, className: i, disabled: a, children: o, type: s = "button", ...c }) {
	return /* @__PURE__ */ _("button", {
		type: s,
		className: [
			Xe,
			Ze[e],
			Qe[t],
			i
		].filter(Boolean).join(" "),
		disabled: a || r,
		...c,
		children: r ? /* @__PURE__ */ _("span", { className: "h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" }) : /* @__PURE__ */ v(g, { children: [n, o] })
	});
}
//#endregion
//#region ../../src/ui/Badge.tsx
var et = {
	default: "bg-surface-2 text-text-secondary",
	primary: "bg-primary-light text-primary",
	success: "bg-success-light text-success",
	warning: "bg-warning-light text-warning",
	danger: "bg-danger-light text-danger",
	neutral: "bg-surface-3 text-text-primary"
}, tt = {
	default: "bg-text-tertiary",
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
	danger: "bg-danger",
	neutral: "bg-text-secondary"
}, nt = {
	sm: "text-[10px] px-1.5 py-0.5",
	md: "text-xs px-2 py-0.5"
};
function rt({ children: e, variant: t = "default", size: n = "md", className: r, dot: i = !1 }) {
	return /* @__PURE__ */ v("span", {
		className: y("inline-flex items-center gap-1 rounded-full font-medium", et[t], nt[n], r),
		children: [i && /* @__PURE__ */ _("span", { className: y("h-1.5 w-1.5 rounded-full flex-shrink-0", tt[t]) }), e]
	});
}
//#endregion
//#region ../../src/ui/mention/foldHighlight.ts
function it(e) {
	return e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
function at(e) {
	return e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
function ot(e) {
	let t = "", n = [];
	for (let r = 0; r < e.length; r++) {
		let i = it(e[r]);
		for (let e of i) t += e, n.push(r);
	}
	return {
		folded: t,
		map: n
	};
}
function st(e, t) {
	let n = at(t.trim());
	if (!n) return [{
		text: e,
		hit: !1
	}];
	let { folded: r, map: i } = ot(e), a = r.indexOf(n);
	if (a < 0) return [{
		text: e,
		hit: !1
	}];
	let o = i[a], s = i[a + n.length - 1] + 1, c = [];
	return o > 0 && c.push({
		text: e.slice(0, o),
		hit: !1
	}), c.push({
		text: e.slice(o, s),
		hit: !0
	}), s < e.length && c.push({
		text: e.slice(s),
		hit: !1
	}), c;
}
function ct(e, t = "@") {
	let n = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), r = RegExp(`(?:^|\\s)(${n})(\\S*)$`).exec(e);
	if (!r) return null;
	let i = r[2], a = e.length;
	return {
		query: i,
		trigger: t,
		start: a - i.length - t.length,
		end: a
	};
}
//#endregion
//#region ../../src/ui/mention/providerSource.ts
var lt = null;
function ut(e) {
	lt = e;
}
function dt() {
	return lt ? lt() : [];
}
//#endregion
//#region ../../src/ui/mention/useMentionAutocomplete.ts
function ft(e) {
	let t = e.trigger ?? "@", n = e.limit ?? 6, r = e.debounceMs ?? 150, [i, a] = m(!1), [s, c] = m([]), [l, u] = m(0), [d, f] = m(""), [h, g] = m(null), [_, v] = m(!1), y = p(null), b = p(null), x = p(null), S = p(0), C = p(null), w = p(void 0), T = o(() => {
		y.current = null, b.current = null, C.current?.abort(), w.current && clearTimeout(w.current), a(!1), c([]), u(0), f(""), v(!1);
	}, []), E = o((t) => {
		let r = e.providers ?? dt();
		if (!r.length) {
			c([]), v(!1);
			return;
		}
		C.current?.abort();
		let i = new AbortController();
		C.current = i;
		let a = ++S.current;
		v(!0), Promise.all(r.map((e) => e.search(t, {
			limit: n,
			signal: i.signal
		}).catch(() => []))).then((e) => {
			if (S.current !== a) return;
			let t = /* @__PURE__ */ new Set(), r = [];
			for (let i of e) {
				for (let e of i) {
					let i = e.email ? e.email.toLowerCase() : e.id;
					if (!t.has(i) && (t.add(i), r.push(e), r.length >= n)) break;
				}
				if (r.length >= n) break;
			}
			c(r), u(0), v(!1);
		});
	}, [e.providers, n]), D = o((e) => {
		let n = ct(e.textBeforeCaret, t);
		if (!n) {
			x.current = null, y.current && T();
			return;
		}
		y.current = n, g(e.anchorRect), x.current !== n.query && (x.current = null, b.current !== n.query && (b.current = n.query, f(n.query), a(!0), w.current && clearTimeout(w.current), w.current = setTimeout(() => E(n.query), r)));
	}, [
		t,
		r,
		E,
		T
	]), O = o((t) => {
		let n = y.current;
		T(), n && e.onSelect(t, n);
	}, [T, e]), k = o(() => {
		let e = s[l];
		e && O(e);
	}, [
		s,
		l,
		O
	]);
	return {
		open: i,
		items: s,
		activeIndex: l,
		query: d,
		anchorRect: h,
		loading: _,
		handleCaret: D,
		handleKeyDown: o((e) => {
			if (!i) return !1;
			switch (e.key) {
				case "ArrowDown": return u((e) => s.length ? (e + 1) % s.length : 0), !0;
				case "ArrowUp": return u((e) => s.length ? (e - 1 + s.length) % s.length : 0), !0;
				case "Enter":
				case "Tab": return s.length ? (k(), !0) : !1;
				case "Escape": return x.current = b.current, T(), !0;
				default: return !1;
			}
		}, [
			i,
			s,
			k,
			T
		]),
		close: T,
		setActiveIndex: u,
		selectItem: O,
		selectActive: k
	};
}
//#endregion
//#region ../../src/ui/mention/MentionList.tsx
var pt = 320, mt = 4;
function ht({ item: e }) {
	return e.avatarUrl ? /* @__PURE__ */ _("img", {
		src: e.avatarUrl,
		alt: "",
		className: "w-7 h-7 rounded-full object-cover shrink-0"
	}) : /* @__PURE__ */ _("span", {
		className: "w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-medium flex items-center justify-center shrink-0",
		children: (e.label || e.email || "?").trim()[0]?.toUpperCase() ?? "?"
	});
}
function gt({ items: e, activeIndex: t, query: n, anchorRect: r, onPick: i, onHover: a, loading: o }) {
	if (typeof document > "u" || !r || !e.length && !o) return null;
	let s = Math.min(r.left, window.innerWidth - pt - 8), c = r.bottom + mt;
	return X(/* @__PURE__ */ v("div", {
		role: "listbox",
		className: "fixed z-[9999] min-w-56 max-w-80 py-1 rounded-lg border border-border\n                 bg-white/95 backdrop-blur-md shadow-lg max-h-64 overflow-y-auto",
		style: {
			left: Math.max(8, s),
			top: c
		},
		children: [e.map((e, r) => /* @__PURE__ */ v("button", {
			type: "button",
			role: "option",
			"aria-selected": r === t,
			onPointerDown: (t) => {
				t.preventDefault(), i(e);
			},
			onMouseEnter: () => a?.(r),
			className: `w-full flex items-center gap-2.5 px-3 py-1.5 text-left
                     ${r === t ? "bg-surface-2" : "hover:bg-surface-1"}`,
			children: [/* @__PURE__ */ _(ht, { item: e }), /* @__PURE__ */ v("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ _("span", {
					className: "block text-sm text-text-primary truncate",
					children: st(e.label, n).map((e, t) => e.hit ? /* @__PURE__ */ _("strong", {
						className: "font-semibold text-primary",
						children: e.text
					}, t) : /* @__PURE__ */ _("span", { children: e.text }, t))
				}), e.secondary && /* @__PURE__ */ _("span", {
					className: "block text-xs text-text-secondary truncate",
					children: e.secondary
				})]
			})]
		}, e.id)), o && !e.length && /* @__PURE__ */ _("div", {
			className: "px-3 py-2 text-xs text-text-tertiary",
			children: "Recherche…"
		})]
	}), document.body);
}
//#endregion
//#region ../../src/ui/mention/MentionInput.tsx
function _t({ mentions: e, placeholder: t, className: n, disabled: r, defaultValue: i, onMentionsChange: a }) {
	let [o, s] = m(i?.text ?? ""), [c, l] = m(i?.mentions ?? []), u = p(null), d = (e, t) => {
		a?.({
			text: e,
			mentions: t
		});
	}, f = ft({
		providers: e.providers,
		trigger: e.trigger,
		onSelect: (e, t) => {
			let n = u.current, r = n?.selectionStart ?? o.length, i = o.slice(0, t.start) + o.slice(r), a = c.some((t) => t.id === e.id) ? c : [...c, e];
			s(i), l(a), d(i, a), requestAnimationFrame(() => {
				n?.focus(), n?.setSelectionRange(t.start, t.start);
			});
		}
	}), h = () => {
		let e = u.current;
		if (!e) return;
		let t = e.selectionStart ?? e.value.length, n = e.value.slice(0, t);
		f.handleCaret({
			textBeforeCaret: n,
			anchorRect: e.getBoundingClientRect()
		});
	}, g = (e) => {
		let t = c.filter((t, n) => n !== e);
		l(t), d(o, t);
	};
	return /* @__PURE__ */ v("div", {
		className: b(y("relative w-full flex flex-wrap items-center gap-1 rounded-md border bg-white", "px-2 py-1 min-h-9 text-sm text-text-primary border-border", "focus-within:ring-2 focus-within:ring-primary focus-within:border-primary", r && "bg-surface-2 cursor-not-allowed opacity-60", n)),
		children: [
			c.map((e, t) => /* @__PURE__ */ v("span", {
				className: "flex items-center gap-1 max-w-[16rem] truncate rounded-full bg-primary-light\n                     text-primary text-xs font-medium pl-2.5 pr-1 py-0.5",
				children: [/* @__PURE__ */ _("span", {
					className: "truncate",
					children: e.label
				}), /* @__PURE__ */ _("button", {
					type: "button",
					"aria-label": "Retirer",
					disabled: r,
					onClick: () => g(t),
					className: "shrink-0 opacity-60 hover:opacity-100",
					children: /* @__PURE__ */ _(pe, { size: 12 })
				})]
			}, e.id + t)),
			/* @__PURE__ */ _("input", {
				ref: u,
				value: o,
				disabled: r,
				onChange: (e) => {
					s(e.target.value), d(e.target.value, c), h();
				},
				onKeyUp: h,
				onKeyDown: (e) => {
					if (f.handleKeyDown(e)) {
						e.preventDefault();
						return;
					}
					e.key === "Backspace" && !o && c.length && g(c.length - 1);
				},
				onBlur: () => f.close(),
				placeholder: c.length ? "" : t,
				className: "flex-1 min-w-[6rem] bg-transparent outline-none placeholder:text-text-tertiary"
			}),
			/* @__PURE__ */ _(gt, {
				items: f.items,
				activeIndex: f.activeIndex,
				query: f.query,
				anchorRect: f.anchorRect,
				loading: f.loading,
				onHover: f.setActiveIndex,
				onPick: f.selectItem
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Input.tsx
var vt = t.forwardRef(function({ label: e, error: t, hint: n, leftIcon: r, rightIcon: i, className: a, id: o, mentions: s, onMentionsChange: c, defaultMentionValue: l, ...u }, d) {
	let f = o ?? (typeof e == "string" ? e.toLowerCase().replace(/\s+/g, "-") : void 0);
	return s?.enabled ? /* @__PURE__ */ v("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ _("label", {
				htmlFor: f,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ _(_t, {
				mentions: s,
				placeholder: u.placeholder,
				disabled: u.disabled,
				className: b(y(t && "border-danger focus-within:ring-danger", a)),
				defaultValue: l,
				onMentionsChange: c
			}),
			t && /* @__PURE__ */ _("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ _("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	}) : /* @__PURE__ */ v("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ _("label", {
				htmlFor: f,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ v("div", {
				className: "relative flex items-center",
				children: [
					r && /* @__PURE__ */ _("span", {
						className: "absolute left-3 text-text-secondary pointer-events-none",
						children: r
					}),
					/* @__PURE__ */ _("input", {
						ref: d,
						id: f,
						className: b(y("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-9", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r && "pl-9", i && "pr-9", a)),
						...u
					}),
					i && /* @__PURE__ */ _("span", {
						className: "absolute right-3 text-text-secondary pointer-events-none",
						children: i
					})
				]
			}),
			t && /* @__PURE__ */ _("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ _("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
});
//#endregion
//#region ../../src/ui/NumberInput.tsx
function yt({ value: e, onChange: t, min: n, max: r, step: i = 1, disabled: a = !1, label: s, error: c, hint: l, className: u, id: d }) {
	let f = d ?? s?.toLowerCase().replace(/\s+/g, "-"), p = o((e) => n !== void 0 && e < n ? n : r !== void 0 && e > r ? r : e, [n, r]), m = () => t(p(e + i)), h = () => t(p(e - i)), g = (e) => {
		let n = parseFloat(e.target.value);
		isNaN(n) || t(p(n));
	}, b = n !== void 0 && e <= n, x = r !== void 0 && e >= r;
	return /* @__PURE__ */ v("div", {
		className: "flex flex-col gap-1",
		children: [
			s && /* @__PURE__ */ _("label", {
				htmlFor: f,
				className: "text-sm font-medium text-text-primary",
				children: s
			}),
			/* @__PURE__ */ v("div", {
				className: y("inline-flex items-stretch h-9 rounded-md border bg-white overflow-hidden", "focus-within:ring-2 focus-within:ring-primary focus-within:border-primary", c ? "border-danger focus-within:ring-danger" : "border-border", a && "opacity-50 cursor-not-allowed", u),
				children: [/* @__PURE__ */ _("input", {
					id: f,
					type: "number",
					value: e,
					onChange: g,
					min: n,
					max: r,
					step: i,
					disabled: a,
					className: y("flex-1 min-w-0 px-3 text-sm text-text-primary bg-transparent", "focus:outline-none", "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none")
				}), /* @__PURE__ */ v("div", {
					className: "flex flex-col border-l border-border w-6 flex-shrink-0",
					children: [/* @__PURE__ */ _("button", {
						type: "button",
						tabIndex: -1,
						onClick: m,
						disabled: a || x,
						className: y("flex-1 flex items-center justify-center border-b border-border", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ _(M, {
							size: 11,
							strokeWidth: 2.5
						})
					}), /* @__PURE__ */ _("button", {
						type: "button",
						tabIndex: -1,
						onClick: h,
						disabled: a || b,
						className: y("flex-1 flex items-center justify-center", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ _(k, {
							size: 11,
							strokeWidth: 2.5
						})
					})]
				})]
			}),
			c && /* @__PURE__ */ _("p", {
				className: "text-xs text-danger",
				children: c
			}),
			l && !c && /* @__PURE__ */ _("p", {
				className: "text-xs text-text-secondary",
				children: l
			})
		]
	});
}
//#endregion
//#region ../../src/ui/mention/mentionChip.ts
var bt = "kb-mention-styles";
function xt() {
	if (typeof document > "u" || document.getElementById(bt)) return;
	let e = document.createElement("style");
	e.id = bt, e.textContent = "\n.kb-mention{display:inline-flex;align-items:center;gap:.125em;padding:0 .15em 0 .5em;border-radius:9999px;\n  background:var(--color-primary-light,#d3e3fd);color:var(--color-primary,#1a73e8);font-weight:600;\n  line-height:1.4;white-space:nowrap;vertical-align:baseline;text-decoration:none;}\n.kb-mention__label{padding:.05em 0;}\n.kb-mention__remove{display:inline-flex;align-items:center;justify-content:center;width:1.15em;height:1.15em;\n  border:0;padding:0;margin:0;background:transparent;border-radius:9999px;font:inherit;font-size:1em;line-height:1;\n  color:inherit;opacity:.55;cursor:pointer;user-select:none;}\n.kb-mention__remove:hover{opacity:1;background:rgba(0,0,0,.10);}\n", document.head.appendChild(e);
}
function St(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
var Ct = "data-kb-mention-remove";
function wt(e) {
	return `<span class="kb-mention" contenteditable="false" ${[
		`data-mention-id="${St(e.id)}"`,
		e.email ? `data-email="${St(e.email)}"` : "",
		e.kubunoUserId ? `data-user-id="${St(e.kubunoUserId)}"` : ""
	].filter(Boolean).join(" ")}><span class="kb-mention__label">${St(e.label)}</span><button type="button" class="kb-mention__remove" tabindex="-1" aria-label="Retirer" ${Ct}="1">×</button></span>`;
}
function Tt(e, t) {
	let n = window.getSelection();
	if (!n || !n.rangeCount) return !1;
	let r = n.getRangeAt(0), i = r.startContainer, a = r.startOffset, o = e.query.length + e.trigger.length;
	if (i.nodeType !== Node.TEXT_NODE || a < o) return !1;
	let s = document.createRange();
	s.setStart(i, a - o), s.setEnd(i, a), n.removeAllRanges(), n.addRange(s);
	let c = wt(t) + "\xA0";
	return document.execCommand("insertHTML", !1, c);
}
function Et(e, t) {
	let n = (n) => {
		let r = n.target?.closest?.(`[${Ct}]`);
		if (!r) return;
		let i = r.closest(".kb-mention");
		if (!i || !e.contains(i)) return;
		n.preventDefault(), n.stopPropagation();
		let a = document.createRange();
		a.selectNode(i);
		let o = i.nextSibling;
		if (o && o.nodeType === Node.TEXT_NODE) {
			let e = o.textContent ?? "";
			/^[ \s]/.test(e) && a.setEnd(o, 1);
		}
		let s = window.getSelection();
		s?.removeAllRanges(), s?.addRange(a), document.execCommand("delete") || a.deleteContents(), t?.();
	};
	return e.addEventListener("click", n), () => e.removeEventListener("click", n);
}
function Dt(e, t = "mailto") {
	if (typeof document > "u") return e;
	let n = document.createElement("div");
	return n.innerHTML = e, n.querySelectorAll(".kb-mention").forEach((e) => {
		let n = e.querySelector(".kb-mention__label")?.textContent ?? e.textContent ?? "", r = e.getAttribute("data-email");
		if (t === "mailto" && r) {
			let t = document.createElement("a");
			t.setAttribute("href", `mailto:${r}`), t.textContent = n, e.replaceWith(t);
		} else e.replaceWith(document.createTextNode(n));
	}), n.innerHTML;
}
//#endregion
//#region ../../src/ui/mention/useContentEditableMention.tsx
function Ot() {
	let e = window.getSelection();
	if (!e || !e.rangeCount) return null;
	let t = e.getRangeAt(0).getClientRects();
	return t.length ? t[t.length - 1] : e.getRangeAt(0).getBoundingClientRect();
}
function kt(e, t, n) {
	let r = !!t?.enabled, i = ft({
		providers: t?.providers,
		trigger: t?.trigger,
		onSelect: (e, t) => {
			Tt(t, e), n?.();
		}
	}), a = p(i.close);
	a.current = i.close, c(() => {
		if (!r) return;
		xt();
		let t = e.current;
		if (t) return Et(t, n);
	}, [r]);
	let s = o(() => {
		if (!r) return;
		let t = e.current, n = window.getSelection();
		if (!t || !n || !n.rangeCount) {
			a.current();
			return;
		}
		let o = n.getRangeAt(0);
		if (!t.contains(o.startContainer)) {
			a.current();
			return;
		}
		let s = o.startContainer, c = s.nodeType === Node.TEXT_NODE ? (s.textContent ?? "").slice(0, o.startOffset) : "";
		i.handleCaret({
			textBeforeCaret: c,
			anchorRect: Ot()
		});
	}, [
		r,
		e,
		i
	]), l = o(() => {
		s();
	}, [s]), u = o(() => {
		s();
	}, [s]), d = o((e) => {
		r && i.handleKeyDown(e) && e.preventDefault();
	}, [r, i]);
	return {
		overlay: r ? /* @__PURE__ */ _(gt, {
			items: i.items,
			activeIndex: i.activeIndex,
			query: i.query,
			anchorRect: i.anchorRect,
			loading: i.loading,
			onHover: i.setActiveIndex,
			onPick: i.selectItem
		}) : null,
		onInput: l,
		onKeyUp: u,
		onKeyDown: d,
		enabled: r
	};
}
//#endregion
//#region ../../src/ui/mention/MentionEditable.tsx
function At({ value: e, onChange: t, mentions: n, placeholder: r, className: i, style: a, disabled: o, id: s }) {
	let l = p(null), [u, d] = m(!e);
	c(() => {
		xt(), l.current && (l.current.innerHTML = e || ""), d(!l.current?.textContent?.trim());
	}, []);
	let f = () => {
		let e = l.current?.innerHTML ?? "", n = !l.current?.textContent?.trim();
		d(n), t(n ? "" : e);
	}, h = kt(l, n, f);
	return /* @__PURE__ */ v("div", {
		className: "relative",
		children: [
			/* @__PURE__ */ _("div", {
				ref: l,
				id: s,
				contentEditable: !o,
				suppressContentEditableWarning: !0,
				onInput: () => {
					f(), h.onInput();
				},
				onKeyUp: h.onKeyUp,
				onKeyDown: h.onKeyDown,
				className: i,
				style: {
					whiteSpace: "pre-wrap",
					...a
				}
			}),
			u && r && /* @__PURE__ */ _("div", {
				className: "absolute top-2 left-3 text-sm text-text-tertiary pointer-events-none select-none",
				children: r
			}),
			h.overlay
		]
	});
}
//#endregion
//#region ../../src/ui/Textarea.tsx
var jt = "w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary px-3 py-2 h-36 min-h-16 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60";
function Mt({ label: e, error: t, hint: n, className: r, id: i, mentions: a, onMentionsChange: o, ...s }) {
	let c = i ?? e?.toLowerCase().replace(/\s+/g, "-"), l = t ? "border-danger focus:ring-danger" : "border-border", u = a?.enabled ? /* @__PURE__ */ _(At, {
		id: c,
		value: typeof s.value == "string" ? s.value : "",
		onChange: (e) => o?.(e),
		mentions: a,
		placeholder: typeof s.placeholder == "string" ? s.placeholder : void 0,
		disabled: s.disabled,
		className: b(y(jt, "overflow-auto", "focus:ring-2", l, r))
	}) : /* @__PURE__ */ _("textarea", {
		id: c,
		className: b(y(jt, "resize-y", l, r)),
		...s
	});
	return /* @__PURE__ */ v("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ _("label", {
				htmlFor: c,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			u,
			t && /* @__PURE__ */ _("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ _("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Editable.tsx
var Nt = a(function({ defaultValue: e = "", placeholder: t, disabled: n, spellCheck: r = !1, onTextChange: i, className: a, style: o, ...s }, l) {
	let d = p(null);
	return u(l, () => d.current, []), c(() => {
		d.current && !d.current.textContent && (d.current.textContent = e);
	}, []), /* @__PURE__ */ _("div", {
		ref: d,
		contentEditable: !n,
		suppressContentEditableWarning: !0,
		spellCheck: r,
		role: "textbox",
		"aria-multiline": "true",
		"data-placeholder": t,
		onInput: () => i?.(d.current?.textContent ?? ""),
		style: o,
		className: b(y("w-full rounded-md border border-border bg-white text-sm text-text-primary px-3 py-2", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "empty:before:content-[attr(data-placeholder)] empty:before:text-text-tertiary empty:before:pointer-events-none", n && "bg-surface-2 cursor-not-allowed opacity-60", a)),
		...s
	});
});
//#endregion
//#region ../../src/ui/RichText.tsx
function Pt({ value: e, onChange: t, placeholder: n, className: r, minHeight: i = 96, disabled: a, mentions: o }) {
	let s = p(null), [l, u] = m(!1), [d, f] = m(""), [h, g] = m(!e), y = p(null), b = kt(s, o, () => x());
	c(() => {
		s.current && (s.current.innerHTML = e || ""), g(!s.current?.textContent?.trim() && !s.current?.querySelector("img,ul,ol"));
	}, []);
	let x = () => {
		let e = s.current?.innerHTML ?? "", n = !s.current?.textContent?.trim() && !s.current?.querySelector("img,ul,ol,li");
		g(n), t(n ? "" : e);
	}, S = (e, t) => {
		s.current?.focus(), document.execCommand(e, !1, t), x();
	}, C = () => {
		let e = window.getSelection();
		e && e.rangeCount && (y.current = e.getRangeAt(0).cloneRange());
	}, w = () => {
		let e = window.getSelection();
		e && y.current && (e.removeAllRanges(), e.addRange(y.current));
	}, E = () => {
		w();
		let e = d.trim();
		e && S("createLink", /^https?:\/\//i.test(e) ? e : `https://${e}`), u(!1), f("");
	}, D = ({ on: e, title: t, children: n }) => /* @__PURE__ */ _("button", {
		type: "button",
		title: t,
		"aria-label": t,
		onMouseDown: (e) => e.preventDefault(),
		onClick: e,
		className: "w-8 h-8 flex items-center justify-center rounded text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors",
		children: n
	});
	return /* @__PURE__ */ v("div", {
		className: `rounded-md border border-border bg-white overflow-hidden ${r ?? ""}`,
		children: [
			/* @__PURE__ */ v("div", {
				className: "flex items-center gap-0.5 px-1.5 py-1 border-b border-border",
				children: [
					/* @__PURE__ */ _(D, {
						title: "Gras",
						on: () => S("bold"),
						children: /* @__PURE__ */ _(T, { size: 15 })
					}),
					/* @__PURE__ */ _(D, {
						title: "Italique",
						on: () => S("italic"),
						children: /* @__PURE__ */ _(U, { size: 15 })
					}),
					/* @__PURE__ */ _(D, {
						title: "Souligné",
						on: () => S("underline"),
						children: /* @__PURE__ */ _(fe, { size: 15 })
					}),
					/* @__PURE__ */ _("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ _(D, {
						title: "Liste numérotée",
						on: () => S("insertOrderedList"),
						children: /* @__PURE__ */ _(te, { size: 15 })
					}),
					/* @__PURE__ */ _(D, {
						title: "Liste à puces",
						on: () => S("insertUnorderedList"),
						children: /* @__PURE__ */ _(K, { size: 15 })
					}),
					/* @__PURE__ */ _("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ _(D, {
						title: "Insérer un lien",
						on: () => {
							C(), u((e) => !e);
						},
						children: /* @__PURE__ */ _(G, { size: 15 })
					}),
					/* @__PURE__ */ _(D, {
						title: "Effacer la mise en forme",
						on: () => S("removeFormat"),
						children: /* @__PURE__ */ _(z, { size: 15 })
					})
				]
			}),
			l && /* @__PURE__ */ v("div", {
				className: "flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-surface-1",
				children: [/* @__PURE__ */ _("input", {
					autoFocus: !0,
					value: d,
					onChange: (e) => f(e.target.value),
					placeholder: "https://…",
					onKeyDown: (e) => {
						e.key === "Enter" && (e.preventDefault(), E()), e.key === "Escape" && u(!1);
					},
					className: "flex-1 text-sm px-2 py-1 rounded border border-border outline-none focus:border-primary"
				}), /* @__PURE__ */ _("button", {
					type: "button",
					onClick: E,
					className: "text-sm font-medium text-primary px-2",
					children: "OK"
				})]
			}),
			/* @__PURE__ */ v("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ _("div", {
						ref: s,
						contentEditable: !a,
						suppressContentEditableWarning: !0,
						onInput: () => {
							x(), b.onInput();
						},
						onKeyUp: b.onKeyUp,
						onKeyDown: b.onKeyDown,
						className: "px-3 py-2 text-sm text-text-primary outline-none leading-relaxed\n                     [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-5 [&_ol]:ml-5",
						style: { minHeight: i }
					}),
					h && n && /* @__PURE__ */ _("div", {
						className: "absolute top-2 left-3 text-sm text-text-tertiary pointer-events-none select-none",
						children: n
					}),
					b.overlay
				]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Checkbox.tsx
var Ft = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-sm border-2 cursor-pointer transition-colors checked:bg-[var(--ck)] checked:border-[var(--ck)] before:content-[''] before:w-[11px] before:h-[11px] before:scale-0 before:origin-center before:transition-transform before:duration-100 checked:before:scale-100 before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)] before:shadow-[inset_1em_1em_#fff] disabled:cursor-not-allowed disabled:opacity-50", It = {
	default: "border-border hover:border-border-strong",
	dark: "border-[#555] hover:border-[#808080] bg-[#3c3c3c]"
}, Lt = {
	default: {
		label: "text-sm text-text-primary",
		desc: "text-sm text-text-secondary"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function Rt({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: c }) {
	let l = a ?? (i === "dark" ? "#007acc" : "var(--color-primary)");
	return /* @__PURE__ */ v("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--ck": l
		},
		children: [/* @__PURE__ */ _("input", {
			type: "checkbox",
			checked: e,
			disabled: o,
			onChange: (e) => t(e.target.checked),
			className: y(Ft, It[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ v("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ _("span", {
				className: b("leading-snug", Lt[i].label, c),
				children: n
			}), r && /* @__PURE__ */ _("span", {
				className: b("leading-snug mt-0.5", Lt[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/Radio.tsx
var zt = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-full border-2 cursor-pointer transition-colors checked:border-[var(--rb)] before:content-[''] before:w-[10px] before:h-[10px] before:rounded-full before:bg-[var(--rb)] before:scale-0 before:transition-transform before:duration-100 checked:before:scale-100 disabled:cursor-not-allowed disabled:opacity-50", Bt = {
	default: "border-border hover:border-border-strong",
	dark: "border-[#555] hover:border-[#808080]"
}, Vt = {
	default: {
		label: "text-sm text-text-primary",
		desc: "text-sm text-text-secondary"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function Ht({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: c }) {
	let l = a ?? (i === "dark" ? "#007acc" : "var(--color-primary)");
	return /* @__PURE__ */ v("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--rb": l
		},
		children: [/* @__PURE__ */ _("input", {
			type: "radio",
			checked: e,
			disabled: o,
			onClick: () => {
				o || t(!e);
			},
			onChange: () => {},
			className: y(zt, Bt[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ v("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ _("span", {
				className: b("leading-snug", Vt[i].label, c),
				children: n
			}), r && /* @__PURE__ */ _("span", {
				className: b("leading-snug mt-0.5", Vt[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/easing.ts
function Ut(e, t, n, r) {
	let i = 3 * e, a = 3 * (n - e) - i, o = 1 - i - a, s = 3 * t, c = 3 * (r - t) - s, l = 1 - s - c, u = (e) => ((o * e + a) * e + i) * e, d = (e) => ((l * e + c) * e + s) * e, f = (e) => (3 * o * e + 2 * a) * e + i, p = 1e-6, m = (e) => {
		let t = e;
		for (let n = 0; n < 8; n++) {
			let n = u(t) - e;
			if (Math.abs(n) < p) return t;
			let r = f(t);
			if (Math.abs(r) < p) break;
			t -= n / r;
		}
		let n = 0, r = 1;
		t = e;
		for (let i = 0; i < 32 && r - n > p; i++) {
			let i = u(t) - e;
			if (Math.abs(i) < p) break;
			i > 0 ? r = t : n = t, t = (n + r) / 2;
		}
		return t;
	};
	return (e) => e <= 0 ? 0 : e >= 1 ? 1 : d(m(e));
}
var Wt = Ut(.4, 0, .2, 1), Gt = {
	sm: {
		width: 28,
		height: 16,
		trackRadius: 5,
		thumbSize: 12,
		thumbRadius: 3,
		thumbInset: 2
	},
	md: {
		width: 36,
		height: 20,
		trackRadius: 6,
		thumbSize: 14,
		thumbRadius: 4,
		thumbInset: 3
	}
};
function Kt(e) {
	let t = getComputedStyle(e), n = (e, n) => t.getPropertyValue(e).trim() || n;
	return {
		off: n("--color-surface-3", "#e8eaed"),
		border: n("--color-border", "#e0e0e0"),
		on: n("--color-primary", "#1a73e8"),
		thumb: "#ffffff"
	};
}
function qt(e, t) {
	let { geometry: n, palette: r } = t, i = Math.min(1, Math.max(0, t.progress)), a = t.dpr ?? window.devicePixelRatio ?? 1, o = Math.round(n.width * a), s = Math.round(n.height * a);
	(e.width !== o || e.height !== s) && (e.width = o, e.height = s);
	let c = e.getContext("2d");
	if (!c) return;
	c.setTransform(a, 0, 0, a, 0, 0), c.clearRect(0, 0, n.width, n.height);
	let l = .5, u = (e, t, r) => {
		c.globalAlpha = r, c.beginPath(), c.roundRect(l, l, n.width - 1, n.height - 1, n.trackRadius - l), c.fillStyle = e, c.fill(), c.lineWidth = 1, c.strokeStyle = t, c.stroke();
	};
	u(r.off, r.border, 1), i > 0 && u(r.on, r.on, i), c.globalAlpha = 1;
	let d = n.width - n.thumbSize - n.thumbInset * 2;
	c.save(), c.shadowColor = "rgb(0 0 0 / 12%)", c.shadowBlur = 2, c.shadowOffsetY = 1, c.beginPath(), c.roundRect(n.thumbInset + d * i, n.thumbInset, n.thumbSize, n.thumbSize, n.thumbRadius), c.fillStyle = r.thumb, c.fill(), c.restore();
}
//#endregion
//#region ../../src/ui/Toggle.tsx
var Jt = 150;
function Yt({ label: e, description: t, size: n = "md", className: r, id: i, ...a }) {
	let s = i ?? e?.toLowerCase().replace(/\s+/g, "-"), l = Gt[n], u = p(null), d = p(null), f = p(a.checked ?? a.defaultChecked ?? !1 ? 1 : 0), m = p(0), h = p(!1), g = o(() => {
		let e = d.current;
		e && qt(e, {
			geometry: l,
			palette: Kt(e),
			progress: f.current
		});
	}, [l]), b = o((e, t) => {
		cancelAnimationFrame(m.current);
		let n = f.current;
		if (t || n === e || matchMedia("(prefers-reduced-motion: reduce)").matches) {
			f.current = e, g();
			return;
		}
		let r = performance.now(), i = (t) => {
			let a = Math.min(1, (t - r) / Jt);
			f.current = n + (e - n) * Wt(a), g(), a < 1 && (m.current = requestAnimationFrame(i));
		};
		m.current = requestAnimationFrame(i);
	}, [g]), x = o((e = !1) => {
		b(+!!u.current?.checked, e);
	}, [b]);
	return c(() => {
		x(!h.current), h.current = !0;
	}, [
		a.checked,
		n,
		x
	]), c(() => {
		let e = u.current, t = e?.form, n = () => x(), r = () => requestAnimationFrame(() => x(!0));
		e?.addEventListener("change", n), t?.addEventListener("reset", r);
		let i = null;
		if (d.current) try {
			i = new ResizeObserver(() => x(!0)), i.observe(d.current, { box: "device-pixel-content-box" });
		} catch {
			i = null;
		}
		let a = null, o = () => {
			s(), x(!0);
		}, s = () => {
			a?.removeEventListener("change", o), a = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`), a.addEventListener("change", o);
		};
		s();
		let c = new MutationObserver(() => g());
		return c.observe(document.documentElement, {
			attributes: !0,
			attributeFilter: [
				"class",
				"style",
				"data-theme"
			]
		}), () => {
			e?.removeEventListener("change", n), t?.removeEventListener("reset", r), i?.disconnect(), a?.removeEventListener("change", o), c.disconnect(), cancelAnimationFrame(m.current);
		};
	}, [g, x]), /* @__PURE__ */ v("label", {
		htmlFor: s,
		className: y("inline-flex items-start gap-2.5 cursor-pointer select-none", a.disabled && "cursor-not-allowed opacity-50", r),
		children: [/* @__PURE__ */ v("div", {
			className: y("relative flex-shrink-0", (e || t) && "mt-0.5"),
			children: [/* @__PURE__ */ _("input", {
				ref: u,
				type: "checkbox",
				id: s,
				className: "peer sr-only",
				...a
			}), /* @__PURE__ */ _("canvas", {
				ref: d,
				"aria-hidden": !0,
				className: "block peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1",
				style: {
					width: l.width,
					height: l.height,
					borderRadius: l.trackRadius
				}
			})]
		}), (e || t) && /* @__PURE__ */ v("div", {
			className: "flex flex-col gap-0.5",
			children: [e && /* @__PURE__ */ _("span", {
				className: "text-sm text-text-primary leading-5",
				children: e
			}), t && /* @__PURE__ */ _("span", {
				className: "text-xs text-text-secondary",
				children: t
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/FloatCheckbox.tsx
function Xt({ selected: e, onToggle: t, className: n }) {
	return /* @__PURE__ */ _("div", {
		role: "checkbox",
		"aria-checked": e,
		onClick: (e) => {
			e.stopPropagation(), t();
		},
		className: y("transition-opacity cursor-pointer", e ? "opacity-100" : "opacity-0 group-hover:opacity-100", n),
		children: /* @__PURE__ */ _("div", {
			className: y("w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors", e ? "bg-primary border-primary" : "bg-black/30 border-white"),
			children: e && /* @__PURE__ */ _("span", {
				className: "text-white text-[10px] font-bold leading-none",
				children: "✓"
			})
		})
	});
}
//#endregion
//#region ../../src/ui/Separator.tsx
function Zt({ orientation: e = "horizontal", className: t }) {
	return /* @__PURE__ */ _("div", {
		role: "separator",
		"aria-orientation": e,
		className: y("bg-border flex-shrink-0", e === "horizontal" ? "h-px w-full" : "w-px self-stretch", t)
	});
}
//#endregion
//#region ../../src/ui/Spinner.tsx
var Qt = {
	xs: "h-3 w-3 border",
	sm: "h-4 w-4 border-2",
	md: "h-6 w-6 border-2",
	lg: "h-8 w-8 border-[3px]"
};
function $t({ size: e = "md", className: t, label: n = "Chargement…" }) {
	return /* @__PURE__ */ _("span", {
		role: "status",
		"aria-label": n,
		className: y("inline-block rounded-full border-border border-t-primary animate-spin", Qt[e], t)
	});
}
function en({ label: e = "Chargement…" }) {
	return /* @__PURE__ */ _("div", {
		className: "absolute inset-0 flex items-center justify-center bg-white/70 z-10",
		children: /* @__PURE__ */ _($t, {
			size: "lg",
			label: e
		})
	});
}
//#endregion
//#region ../../src/ui/RangeSlider.tsx
function tn({ d: e, animate: t }) {
	return /* @__PURE__ */ _("span", {
		className: "inline-block overflow-hidden align-baseline",
		style: { height: "1em" },
		children: /* @__PURE__ */ _("span", {
			className: "flex flex-col",
			style: {
				transform: `translateY(-${e}em)`,
				transition: t ? "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)" : "none"
			},
			children: Array.from({ length: 10 }, (e, t) => /* @__PURE__ */ _("span", {
				style: {
					height: "1em",
					lineHeight: "1em"
				},
				children: t
			}, t))
		})
	});
}
function nn({ text: e, className: t }) {
	let n = p(!1);
	return c(() => {
		n.current = !0;
	}, []), /* @__PURE__ */ _("span", {
		className: `inline-flex items-baseline tabular-nums leading-none ${t ?? ""}`,
		children: [...e].map((e, t) => /\d/.test(e) ? /* @__PURE__ */ _(tn, {
			d: Number(e),
			animate: n.current
		}, t) : /* @__PURE__ */ _("span", { children: e }, t))
	});
}
var rn = (e, t, n) => n <= t ? 0 : Math.max(0, Math.min(100, (e - t) / (n - t) * 100));
function an({ value: e, onChange: t, min: n = 0, max: r = 100, step: i = 1, variant: a = "bubble", orientation: o = "horizontal", format: s, minLabel: c, maxLabel: u, showValue: d = !1, accent: f, trackColor: p, disabled: h, className: g, style: y, id: x, ...S }) {
	let C = l(), [w, T] = m(!1), E = x ?? C, D = s ?? ((e) => String(e)), O = rn(e, n, r), k = f ?? "var(--color-primary, #1a73e8)", A = p ?? "rgba(0,0,0,0.10)", j = (e) => {
		let i = Number(e);
		Number.isFinite(i) && t(Math.max(n, Math.min(r, i)));
	}, M = /* @__PURE__ */ _("input", {
		id: E,
		type: "range",
		min: n,
		max: r,
		step: i,
		value: e,
		disabled: h,
		onChange: (e) => t(Number(e.target.value)),
		onMouseDown: (e) => e.stopPropagation(),
		"aria-label": S["aria-label"],
		className: "absolute inset-0 m-0 w-full h-full cursor-pointer appearance-none bg-transparent\n                 focus:outline-none disabled:cursor-not-allowed\n                 [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent\n                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-transparent\n                 [&::-moz-range-track]:bg-transparent\n                 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent",
		style: {
			WebkitAppearance: "none",
			appearance: "none"
		}
	}), N = (e = 12) => /* @__PURE__ */ _("span", {
		"aria-hidden": !0,
		className: "absolute top-1/2 rounded-full pointer-events-none",
		style: {
			left: `${O}%`,
			width: e,
			height: e,
			transform: "translate(-50%, -50%)",
			background: k,
			boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,0.35)"
		}
	});
	if (a === "boxed") return /* @__PURE__ */ v("div", {
		className: b("select-none", h && "opacity-60", g),
		style: y,
		children: [/* @__PURE__ */ v("div", {
			className: "relative rounded-xl border-2 bg-surface-0 px-4 pt-3 pb-5 transition-colors focus-within:border-primary",
			style: { borderColor: "var(--color-border, #dadce0)" },
			children: [/* @__PURE__ */ _("input", {
				type: "text",
				inputMode: "numeric",
				value: D(e),
				disabled: h,
				onChange: (e) => j(e.target.value.replace(/[^\d.-]/g, "")),
				className: "w-full bg-transparent text-2xl font-medium text-text-primary tabular-nums\n                       focus:outline-none disabled:cursor-not-allowed",
				"aria-label": S["aria-label"]
			}), /* @__PURE__ */ _("div", {
				className: "absolute left-3 right-3 bottom-0 h-0 translate-y-1/2",
				children: /* @__PURE__ */ v("div", {
					className: "relative h-1.5 rounded-full",
					style: { background: A },
					children: [
						/* @__PURE__ */ _("div", {
							className: "absolute inset-y-0 left-0 rounded-full",
							style: {
								width: `${O}%`,
								background: k
							}
						}),
						N(14),
						M
					]
				})
			})]
		}), /* @__PURE__ */ v("div", {
			className: "mt-1.5 flex items-center justify-between text-xs text-text-tertiary",
			children: [/* @__PURE__ */ _("span", { children: c ?? D(n) }), /* @__PURE__ */ _("span", { children: u ?? D(r) })]
		})]
	});
	if (o === "vertical") {
		let a = /* @__PURE__ */ _("input", {
			id: E,
			type: "range",
			min: n,
			max: r,
			step: i,
			value: e,
			disabled: h,
			onChange: (e) => t(Number(e.target.value)),
			onMouseDown: (e) => e.stopPropagation(),
			"aria-label": S["aria-label"],
			className: "absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none bg-transparent\n                   focus:outline-none disabled:cursor-not-allowed\n                   [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent\n                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-transparent\n                   [&::-moz-range-track]:bg-transparent\n                   [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent",
			style: {
				writingMode: "vertical-lr",
				direction: "rtl",
				WebkitAppearance: "none",
				appearance: "none"
			}
		});
		return /* @__PURE__ */ _("div", {
			className: b("relative h-full select-none", h && "opacity-60", g),
			style: y,
			children: /* @__PURE__ */ v("div", {
				className: "relative mx-auto h-full w-1.5 rounded-full",
				style: { background: A },
				children: [
					/* @__PURE__ */ _("div", {
						className: "absolute inset-x-0 bottom-0 rounded-full",
						style: {
							height: `${O}%`,
							background: k
						}
					}),
					/* @__PURE__ */ _("span", {
						"aria-hidden": !0,
						className: "absolute left-1/2 h-3 w-3 rounded-full pointer-events-none",
						style: {
							bottom: `${O}%`,
							transform: "translate(-50%, 50%)",
							background: k,
							boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,0.35)"
						}
					}),
					a
				]
			})
		});
	}
	let P = d || w;
	return /* @__PURE__ */ v("div", {
		className: b("relative w-full select-none", h && "opacity-60", g),
		style: y,
		onPointerDown: () => !h && T(!0),
		onPointerUp: () => T(!1),
		onPointerLeave: () => T(!1),
		children: [/* @__PURE__ */ _("div", {
			"aria-hidden": !0,
			className: "pointer-events-none absolute -top-1 -translate-y-full transition-[opacity,transform] duration-150",
			style: {
				left: `${O}%`,
				transform: `translate(-50%, ${P ? "-100%" : "-80%"})`,
				opacity: +!!P
			},
			children: /* @__PURE__ */ _("span", {
				className: "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold text-white shadow",
				style: { background: k },
				children: /* @__PURE__ */ _(nn, { text: D(e) })
			})
		}), /* @__PURE__ */ v("div", {
			className: "relative h-1.5 rounded-full",
			style: { background: A },
			children: [
				/* @__PURE__ */ _("div", {
					className: "absolute inset-y-0 left-0 rounded-full",
					style: {
						width: `${O}%`,
						background: k
					}
				}),
				N(),
				M
			]
		})]
	});
}
//#endregion
//#region ../../src/ui/useMenuDismiss.ts
var on = "data-kb-menu";
function sn(e) {
	return !!(e instanceof Element ? e : e?.parentElement ?? null)?.closest(`[${on}]`);
}
function cn(e, t) {
	c(() => {
		if (!e) return;
		let n = (e) => {
			(e.key === "Escape" || !sn(e.target)) && t();
		}, r = () => t();
		return document.addEventListener("keydown", n, !0), window.addEventListener("blur", r), () => {
			document.removeEventListener("keydown", n, !0), window.removeEventListener("blur", r);
		};
	}, [e, t]);
}
//#endregion
//#region ../../src/ui/CaretDown.tsx
function ln({ color: e, size: t = 10, gap: n = 4, className: r }) {
	return /* @__PURE__ */ _("svg", {
		width: t,
		height: t,
		viewBox: "0 0 10 10",
		"aria-hidden": !0,
		className: r,
		style: {
			flexShrink: 0,
			fill: e ?? "currentColor",
			marginRight: n
		},
		children: /* @__PURE__ */ _("path", { d: "M1 3.5h8L5 8.5z" })
	});
}
//#endregion
//#region ../../src/ui/Dropdown.tsx
var un = {
	default: {
		text: "#202124",
		hoverBg: "rgba(0,0,0,0.06)",
		activeBg: "rgba(0,0,0,0.08)",
		chevron: "#5f6368",
		border: "var(--color-border)",
		popBg: "var(--kb-float-surface)",
		popShadow: "var(--kb-float-highlight), var(--kb-shadow-float)",
		popBorder: "var(--kb-float-border)",
		itemText: "#202124",
		itemHover: "rgba(0,0,0,0.06)",
		selBg: "rgba(26,115,232,0.12)",
		selHoverBg: "rgba(26,115,232,0.16)",
		checkColor: "#1a73e8"
	},
	dark: {
		text: "#cccccc",
		hoverBg: "rgba(255,255,255,0.08)",
		activeBg: "rgba(255,255,255,0.12)",
		chevron: "#808080",
		border: "#3c3c3c",
		popBg: "rgb(37 37 38 / 72%)",
		popShadow: "var(--kb-float-highlight-dark), var(--kb-shadow-float-dark)",
		popBorder: "var(--kb-float-border-dark)",
		itemText: "#cccccc",
		itemHover: "rgba(255,255,255,0.08)",
		selBg: "rgba(0,120,212,0.2)",
		selHoverBg: "rgba(0,120,212,0.3)",
		checkColor: "#007acc"
	},
	ghost: {
		text: "#5f6368",
		hoverBg: "rgba(0,0,0,0.04)",
		activeBg: "rgba(0,0,0,0.06)",
		chevron: "#80868b",
		border: "transparent",
		popBg: "var(--kb-float-surface)",
		popShadow: "var(--kb-float-highlight), var(--kb-shadow-float)",
		popBorder: "var(--kb-float-border)",
		itemText: "#202124",
		itemHover: "rgba(0,0,0,0.06)",
		selBg: "rgba(26,115,232,0.12)",
		selHoverBg: "rgba(26,115,232,0.16)",
		checkColor: "#1a73e8"
	}
};
function dn({ value: e, onChange: t, options: n, width: r, dropdownMinWidth: i, placeholder: a, disabled: s = !1, height: l = 36, fontSize: u = 14, className: f, variant: h = "default", buttonStyle: g, focusable: y = !1 }) {
	let [b, x] = m(!1);
	cn(b, o(() => x(!1), []));
	let [S, C] = m(!1), w = n.some((e) => !!e.icon), [T, E] = m(null), D = p(null), O = p(null), k = un[h], A = n.find((t) => t.value === e)?.label ?? a ?? e, j = () => {
		if (!s) {
			if (D.current) {
				let e = D.current.getBoundingClientRect();
				E({
					top: e.bottom + 2,
					left: e.left,
					minWidth: Math.max(i ?? 0, e.width)
				});
			}
			x((e) => !e);
		}
	}, M = o(() => {
		let e = D.current;
		if (!e) return !1;
		let t = e.getBoundingClientRect();
		if (t.bottom <= 0 || t.top >= window.innerHeight || t.right <= 0 || t.left >= window.innerWidth) return !1;
		let n = e.parentElement;
		for (; n;) {
			let e = getComputedStyle(n);
			if (/(auto|scroll|hidden)/.test(e.overflowY + e.overflowX)) {
				let e = n.getBoundingClientRect();
				if (t.bottom <= e.top || t.top >= e.bottom || t.right <= e.left || t.left >= e.right) return !1;
			}
			n = n.parentElement;
		}
		return !0;
	}, []), N = o(() => {
		let e = D.current, t = O.current;
		if (!e || !t) return;
		let n = e.getBoundingClientRect(), r = t.getBoundingClientRect(), i = window.innerWidth, a = window.innerHeight, o = n.left, s = n.bottom + 2;
		o + r.width > i - 8 && (o = i - 8 - r.width), s + r.height > a - 8 && (s = Math.max(8, n.top - 2 - r.height)), o < 8 && (o = 8), s < 8 && (s = 8), t.style.left = `${o}px`, t.style.top = `${s}px`;
	}, []);
	c(() => {
		if (!b) return;
		let e = (e) => {
			!D.current?.contains(e.target) && !O.current?.contains(e.target) && x(!1);
		}, t = () => {
			M() ? N() : x(!1);
		};
		return document.addEventListener("pointerdown", e, !0), window.addEventListener("scroll", t, !0), window.addEventListener("resize", t), () => {
			document.removeEventListener("pointerdown", e, !0), window.removeEventListener("scroll", t, !0), window.removeEventListener("resize", t);
		};
	}, [
		b,
		N,
		M
	]), d(() => {
		b && T && N();
	}, [
		b,
		T,
		N
	]);
	let P = {};
	r !== void 0 && (P.width = r);
	let F = "var(--color-primary, #1a73e8)", I = h === "default" && (b || S);
	return /* @__PURE__ */ v("div", {
		className: `relative ${f ?? ""}`,
		style: P,
		children: [/* @__PURE__ */ v("button", {
			type: "button",
			ref: D,
			onClick: j,
			onMouseDown: y ? void 0 : ((e) => e.preventDefault()),
			onFocus: y ? () => C(!0) : void 0,
			onBlur: y ? () => C(!1) : void 0,
			disabled: s,
			className: `w-full flex items-center justify-between gap-1 select-none${y ? " outline-none" : ""}`,
			style: {
				height: l,
				padding: "0 4px 0 8px",
				fontSize: u,
				fontFamily: "var(--font-family-sans)",
				color: k.text,
				background: b && !I ? k.activeBg : void 0,
				border: `1px solid ${I ? F : k.border}`,
				borderRadius: "var(--radius-md)",
				boxShadow: I ? `0 0 0 2px ${F}` : void 0,
				cursor: s ? "not-allowed" : "pointer",
				opacity: s ? .5 : 1,
				transition: "background 0.1s, box-shadow 0.1s, border-color 0.1s",
				...g
			},
			onMouseEnter: (e) => {
				!b && !s && !I && (e.currentTarget.style.background = k.hoverBg);
			},
			onMouseLeave: (e) => {
				b || (e.currentTarget.style.background = "");
			},
			children: [/* @__PURE__ */ _("span", {
				className: "truncate flex-1 text-left",
				children: A
			}), /* @__PURE__ */ _(ln, { color: k.chevron })]
		}), b && T && X(/* @__PURE__ */ v("div", {
			ref: O,
			onMouseDown: (e) => {
				e.preventDefault(), e.stopPropagation();
			},
			style: {
				position: "fixed",
				top: T.top,
				left: T.left,
				minWidth: T.minWidth,
				zIndex: 9999
			},
			"data-kb-menu": "",
			className: h === "dark" ? "kb-frosted kb-frosted-dark" : "kb-frosted",
			children: [/* @__PURE__ */ _("div", {
				className: "kb-frost-layer",
				"aria-hidden": !0
			}), /* @__PURE__ */ _("div", {
				style: {
					maxHeight: 280,
					overflowY: "auto",
					padding: 5
				},
				children: n.map((n) => /* @__PURE__ */ v("button", {
					type: "button",
					onClick: () => {
						t(n.value), x(!1);
					},
					className: "w-full text-left flex items-center gap-2",
					style: {
						padding: "5px 10px",
						borderRadius: 6,
						fontSize: u,
						color: k.itemText,
						background: n.value === e ? k.selBg : void 0,
						fontWeight: n.value === e ? 600 : void 0
					},
					onMouseEnter: (t) => {
						t.currentTarget.style.background = n.value === e ? k.selHoverBg : k.itemHover;
					},
					onMouseLeave: (t) => {
						t.currentTarget.style.background = n.value === e ? k.selBg : "";
					},
					children: [
						/* @__PURE__ */ _("span", {
							style: {
								width: 14,
								flexShrink: 0,
								textAlign: "center",
								color: k.checkColor,
								fontSize: 14
							},
							children: n.value === e ? "✓" : ""
						}),
						w && /* @__PURE__ */ _("span", {
							className: "flex-shrink-0 flex items-center justify-center",
							style: { width: 18 },
							children: n.icon
						}),
						n.label
					]
				}, n.value))
			})]
		}), document.body)]
	});
}
//#endregion
//#region ../../src/ui/date-picker/helpers.ts
var fn = [
	"L",
	"M",
	"M",
	"J",
	"V",
	"S",
	"D"
], pn = [
	"Jan",
	"Fév",
	"Mar",
	"Avr",
	"Mai",
	"Juin",
	"Juil",
	"Août",
	"Sep",
	"Oct",
	"Nov",
	"Déc"
];
function mn(e, t) {
	if (!e) return null;
	try {
		if (t === "time") {
			let [t, n] = e.split(":").map(Number);
			if (isNaN(t) || isNaN(n)) return null;
			let r = /* @__PURE__ */ new Date();
			return r.setHours(t, n, 0, 0), r;
		}
		let n = Te(e);
		return we(n) ? n : null;
	} catch {
		return null;
	}
}
function hn(e, t) {
	return e ? t === "date" ? Z(e, "dd/MM/yyyy") : t === "time" ? Z(e, "HH:mm") : t === "datetime" ? Z(e, "dd/MM/yyyy HH:mm") : "" : "";
}
function gn(e, t) {
	return e ? t === "date" ? Z(e, "yyyy-MM-dd") : t === "time" ? Z(e, "HH:mm") : t === "datetime" ? Z(e, "yyyy-MM-dd'T'HH:mm") : null : null;
}
function _n(e) {
	return he({
		start: De(Ee(e), { weekStartsOn: 1 }),
		end: _e(ge(e), { weekStartsOn: 1 })
	});
}
function vn(e) {
	let t = e - e % 12;
	return Array.from({ length: 12 }, (e, n) => t + n);
}
function yn(e, t, n) {
	let r = e.getBoundingClientRect(), i = window.innerHeight - r.bottom - 8, a = r.top - 8;
	return {
		top: i >= t || i >= a ? r.bottom + window.scrollY + 4 : r.top + window.scrollY - t - 4,
		left: Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - n - 8))
	};
}
function bn(e) {
	return {
		w: e === "time" ? 172 : 284,
		h: e === "time" ? 230 : e === "datetime" ? 480 : 340
	};
}
//#endregion
//#region ../../src/ui/date-picker/DayView.tsx
function xn({ viewDate: e, setViewDate: t, setView: n, selected: r, onSelect: i, setHoverDate: a, isRange: o, isDisabled: s, inRange: c, isEdge: l }) {
	let u = _n(e), d = Z(e, "MMMM", { locale: ke }), f = d.charAt(0).toUpperCase() + d.slice(1);
	return /* @__PURE__ */ v("div", { children: [
		/* @__PURE__ */ v("div", {
			className: "flex items-center gap-1 mb-2",
			children: [
				/* @__PURE__ */ _("button", {
					type: "button",
					onClick: () => t(Oe(e, 1)),
					className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
					children: /* @__PURE__ */ _(A, { size: 14 })
				}),
				/* @__PURE__ */ v("div", {
					className: "flex-1 flex items-center justify-center gap-1",
					children: [/* @__PURE__ */ _("button", {
						type: "button",
						onClick: () => n("month"),
						className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
						children: f
					}), /* @__PURE__ */ _("button", {
						type: "button",
						onClick: () => n("year"),
						className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
						children: Q(e)
					})]
				}),
				/* @__PURE__ */ _("button", {
					type: "button",
					onClick: () => t(me(e, 1)),
					className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
					children: /* @__PURE__ */ _(j, { size: 14 })
				})
			]
		}),
		/* @__PURE__ */ _("div", {
			className: "grid grid-cols-7 mb-0.5",
			children: fn.map((e, t) => /* @__PURE__ */ _("div", {
				className: "h-7 flex items-center justify-center text-[11px] font-medium text-text-tertiary",
				children: e
			}, t))
		}),
		/* @__PURE__ */ _("div", {
			className: "grid grid-cols-7",
			onMouseLeave: () => a?.(null),
			children: u.map((t, n) => {
				let u = Se(t, e), d = !o && r && xe(t, r), f = l(t), p = c(t), m = s(t), h = Ce(t);
				return /* @__PURE__ */ _("button", {
					type: "button",
					disabled: m,
					onClick: () => !m && i(t),
					onMouseEnter: () => a?.(t),
					className: y("h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium transition-colors", d || f ? "rounded-full bg-primary text-white" : "", !d && !f && p ? "bg-primary/10 text-primary" : "", !d && !f && !p && !m && h ? "rounded-full border border-primary text-primary hover:bg-primary-light" : "", !d && !f && !p && !m && !h && u ? "rounded-full text-text-primary hover:bg-surface-2" : "", !d && !f && !p && !m && !h && !u ? "rounded-full text-text-tertiary hover:bg-surface-2" : "", m ? "opacity-30 cursor-not-allowed rounded-full" : ""),
					children: Z(t, "d")
				}, n);
			})
		})
	] });
}
//#endregion
//#region ../../src/ui/date-picker/MonthView.tsx
function Sn({ viewDate: e, setViewDate: t, setView: n, selected: r }) {
	return /* @__PURE__ */ v("div", { children: [/* @__PURE__ */ v("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ _("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(Q(e) - 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ _(A, { size: 14 })
			}),
			/* @__PURE__ */ _("button", {
				type: "button",
				onClick: () => n("year"),
				className: "flex-1 text-sm font-semibold text-center text-text-primary hover:text-primary transition-colors rounded hover:bg-surface-1 py-0.5",
				children: Q(e)
			}),
			/* @__PURE__ */ _("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(Q(e) + 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ _(j, { size: 14 })
			})
		]
	}), /* @__PURE__ */ _("div", {
		className: "grid grid-cols-3 gap-1",
		children: pn.map((i, a) => /* @__PURE__ */ _("button", {
			type: "button",
			onClick: () => {
				t((e) => {
					let t = new Date(e);
					return t.setMonth(a), t;
				}), n("day");
			},
			className: y("h-9 rounded-lg text-sm font-medium transition-colors", r && ve(r) === a && Q(r) === Q(e) ? "bg-primary text-white" : "text-text-primary hover:bg-surface-2"),
			children: i
		}, a))
	})] });
}
//#endregion
//#region ../../src/ui/date-picker/YearView.tsx
function Cn({ viewDate: e, setViewDate: t, setView: n, selected: r }) {
	let i = f(() => vn(Q(e)), [e]);
	return /* @__PURE__ */ v("div", { children: [/* @__PURE__ */ v("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ _("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(Q(e) - 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ _(A, { size: 14 })
			}),
			/* @__PURE__ */ v("span", {
				className: "flex-1 text-sm font-semibold text-center text-text-primary",
				children: [
					i[0],
					" – ",
					i[i.length - 1]
				]
			}),
			/* @__PURE__ */ _("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(Q(e) + 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ _(j, { size: 14 })
			})
		]
	}), /* @__PURE__ */ _("div", {
		className: "grid grid-cols-3 gap-1",
		children: i.map((e) => {
			let i = r && Q(r) === e, a = Q(/* @__PURE__ */ new Date()) === e;
			return /* @__PURE__ */ _("button", {
				type: "button",
				onClick: () => {
					t((t) => {
						let n = new Date(t);
						return n.setFullYear(e), n;
					}), n("month");
				},
				className: y("h-9 rounded-lg text-sm font-medium transition-colors", i ? "bg-primary text-white" : a ? "border border-primary text-primary hover:bg-primary-light" : "text-text-primary hover:bg-surface-2"),
				children: e
			}, e);
		})
	})] });
}
//#endregion
//#region ../../src/ui/date-picker/CalendarView.tsx
function wn({ viewDate: e, setViewDate: t, view: n, setView: r, selected: i, onSelect: a, rangeStart: s, rangeEnd: c, hoverDate: l, setHoverDate: u, isRange: d, minDate: p, maxDate: m, disabledDate: h }) {
	let g = p ? Te(p) : null, v = m ? Te(m) : null, y = o((e) => g && be(e, g) || v && ye(e, v) ? !0 : h ? h(e) : !1, [
		g,
		v,
		h
	]), b = f(() => c || (s && !c && l ? l : null), [
		s,
		c,
		l
	]), x = o((e) => {
		if (!d || !s || !b) return !1;
		let [t, n] = be(s, b) ? [s, b] : [b, s];
		return ye(e, t) && be(e, n);
	}, [
		d,
		s,
		b
	]), S = o((e) => d ? s && xe(e, s) || b && xe(e, b) : !1, [
		d,
		s,
		b
	]);
	return n === "day" ? /* @__PURE__ */ _(xn, {
		viewDate: e,
		setViewDate: t,
		setView: r,
		selected: i,
		onSelect: a,
		setHoverDate: u,
		isRange: d,
		isDisabled: y,
		inRange: x,
		isEdge: S
	}) : _(n === "month" ? Sn : Cn, {
		viewDate: e,
		setViewDate: t,
		setView: r,
		selected: i
	});
}
//#endregion
//#region ../../src/ui/date-picker/TimeScroll.tsx
function Tn({ values: e, selected: t, onSelect: n, label: r }) {
	let i = p(null), a = p(null);
	return c(() => {
		let e = a.current, t = i.current;
		!e || !t || (t.scrollTop = e.offsetTop - t.clientHeight / 2 + e.clientHeight / 2);
	}, [t, r]), /* @__PURE__ */ v("div", {
		className: "flex flex-col items-center w-14",
		children: [/* @__PURE__ */ _("span", {
			className: "text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1",
			children: r
		}), /* @__PURE__ */ _("div", {
			ref: i,
			className: "relative overflow-y-auto h-40",
			style: { scrollbarWidth: "none" },
			children: e.map((e) => /* @__PURE__ */ _("button", {
				ref: e === t ? a : void 0,
				type: "button",
				onClick: () => n(e),
				className: y("w-14 h-8 flex items-center justify-center text-sm rounded transition-colors", e === t ? "bg-primary/10 text-primary font-semibold" : "text-text-primary hover:bg-surface-2"),
				children: String(e).padStart(2, "0")
			}, e))
		})]
	});
}
//#endregion
//#region ../../src/ui/date-picker/PickerPopover.tsx
function En({ popRef: e, pos: t, width: n, showCalendar: r, showTime: i, viewDate: a, setViewDate: o, view: s, setView: c, selected: l, onSelectDate: u, rangeStart: d, rangeEnd: f, hoverDate: p, setHoverDate: m, isRange: h, minDate: g, maxDate: y, disabledDate: b, hourValues: x, minuteValues: S, hours: C, minutes: w, onHours: T, onMinutes: E, showClear: D, onClear: O, onConfirm: k, dayPanel: A }) {
	return /* @__PURE__ */ v("div", {
		ref: e,
		role: "dialog",
		style: {
			position: "absolute",
			top: t.top,
			left: t.left,
			width: n,
			zIndex: 9999
		},
		className: "bg-white rounded-xl shadow-2xl border border-border flex items-stretch",
		children: [/* @__PURE__ */ v("div", {
			className: "p-3 select-none flex-shrink-0",
			style: A ? { width: 284 } : void 0,
			children: [
				r && /* @__PURE__ */ _(wn, {
					viewDate: a,
					setViewDate: o,
					view: s,
					setView: c,
					selected: l,
					onSelect: u,
					rangeStart: d,
					rangeEnd: f,
					hoverDate: p,
					setHoverDate: m,
					isRange: h,
					minDate: g,
					maxDate: y,
					disabledDate: b
				}),
				r && i && /* @__PURE__ */ _("div", { className: "my-3 h-px bg-border" }),
				i && /* @__PURE__ */ v("div", {
					className: "flex items-start justify-center gap-1",
					children: [
						/* @__PURE__ */ _(Tn, {
							values: x,
							selected: C,
							onSelect: T,
							label: "Heure"
						}),
						/* @__PURE__ */ _("span", {
							className: "mt-8 text-text-tertiary text-base font-semibold",
							children: ":"
						}),
						/* @__PURE__ */ _(Tn, {
							values: S,
							selected: S.includes(w) ? w : S.reduce((e, t) => Math.abs(t - w) < Math.abs(e - w) ? t : e),
							onSelect: E,
							label: "Min"
						})
					]
				}),
				i && /* @__PURE__ */ v("div", {
					className: "flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border",
					children: [D ? /* @__PURE__ */ _("button", {
						type: "button",
						onClick: O,
						className: "text-xs text-text-secondary hover:text-danger transition-colors",
						children: "Effacer"
					}) : /* @__PURE__ */ _("span", {}), /* @__PURE__ */ _("button", {
						type: "button",
						onClick: k,
						className: "text-xs font-medium px-4 py-1.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors",
						children: "OK"
					})]
				})
			]
		}), A && /* @__PURE__ */ _("div", {
			className: "border-l border-border flex-shrink-0 self-stretch",
			children: A
		})]
	});
}
//#endregion
//#region ../../src/core/registry/ExtensionRegistry.ts
var Dn = /* @__PURE__ */ new Map(), On = {
	register(e, t, n) {
		let r = Dn.get(e) ?? /* @__PURE__ */ new Map();
		r.set(t, n), Dn.set(e, r);
	},
	unregister(e, t) {
		Dn.get(e)?.delete(t);
	},
	getAll(e) {
		let t = Dn.get(e);
		return t ? Array.from(t.values()) : [];
	}
}, kn = "calendar.calendar-overlay", An = "datepicker.day-panel";
//#endregion
//#region ../../src/ui/date-picker/DayPanel.tsx
function jn() {
	return On.getAll(An).length > 0;
}
function Mn() {
	return [...On.getAll(An), ...On.getAll(kn)];
}
function Nn({ date: e }) {
	let t = we(e), n = t ? Z(e, "yyyy-MM") : "", r = t ? Z(e, "yyyy-MM-dd") : "", [i, a] = m(null);
	c(() => {
		if (!t) return;
		let r = !0, i = Ee(e).toISOString(), o = ge(e).toISOString(), s = Mn();
		return Promise.all(s.map((e) => e.fetch(i, o).catch(() => []))).then((e) => {
			r && a({
				key: n,
				items: e.flat()
			});
		}), () => {
			r = !1;
		};
	}, [n]);
	let o = i?.key === n, s = o ? i.items.filter((e) => e.date === r) : [], l = t ? Z(e, "d") : "", u = t ? Z(e, "EEEE", { locale: ke }) : "", d = t ? Z(e, "MMMM yyyy", { locale: ke }) : "";
	return /* @__PURE__ */ v("div", {
		className: "flex flex-col",
		style: { width: 240 },
		children: [/* @__PURE__ */ v("div", {
			className: "px-3 pt-3 pb-2 border-b border-border flex-shrink-0",
			children: [/* @__PURE__ */ v("div", {
				className: "flex items-baseline gap-2",
				children: [/* @__PURE__ */ _("span", {
					className: "text-2xl font-semibold text-text-primary leading-none",
					children: l
				}), /* @__PURE__ */ _("span", {
					className: "text-sm text-text-secondary capitalize",
					children: u
				})]
			}), /* @__PURE__ */ _("div", {
				className: "text-xs text-text-tertiary capitalize mt-0.5",
				children: d
			})]
		}), /* @__PURE__ */ _("div", {
			className: "flex-1 overflow-y-auto p-2 min-h-0",
			style: { maxHeight: 300 },
			children: o ? s.length === 0 ? /* @__PURE__ */ _("div", {
				className: "text-xs text-text-tertiary px-1 py-6 text-center",
				children: "Aucun évènement"
			}) : /* @__PURE__ */ _("ul", {
				className: "space-y-0.5",
				children: s.map((e) => /* @__PURE__ */ v("li", {
					className: "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-2 transition-colors",
					children: [/* @__PURE__ */ _("span", {
						className: "w-2 h-2 rounded-full flex-shrink-0",
						style: { background: e.color ?? "#5f6368" }
					}), /* @__PURE__ */ _("span", {
						className: `text-xs truncate ${e.done ? "line-through text-text-tertiary" : "text-text-primary"}`,
						children: e.title
					})]
				}, e.id))
			}) : /* @__PURE__ */ _("div", {
				className: "text-xs text-text-tertiary px-1 py-3",
				children: "Chargement…"
			})
		})]
	});
}
//#endregion
//#region ../../src/core/store/reauthStore.ts
var Pn = Ae((e, t) => ({
	pending: null,
	request: () => new Promise((n) => {
		let r = t().pending;
		if (r) {
			r.waiters.push(n);
			return;
		}
		e({ pending: { waiters: [n] } });
	}),
	resolve: (n) => {
		let r = t().pending?.waiters ?? [];
		e({ pending: null }), r.forEach((e) => e(n));
	},
	cancel: () => {
		let n = t().pending?.waiters ?? [];
		e({ pending: null }), n.forEach((e) => e(null));
	}
})), Fn = () => Pn.getState().request(), In = je.create({
	baseURL: "/api/v1",
	withCredentials: !0
});
In.interceptors.request.use((e) => {
	let t = Hn();
	return t && (e.headers.Authorization = `Bearer ${t}`), e;
});
var Ln = !1, Rn = [];
In.interceptors.response.use((e) => String(e.headers["content-type"] ?? "").includes("text/html") && e.config.url && !e.config.url.includes("/auth/") ? Promise.reject({
	message: "Module non disponible (service inactif)",
	code: "MODULE_UNAVAILABLE"
}) : e, async (e) => {
	let t = e.config, n = e.response?.data?.error;
	if (e.response?.status === 403 && n === "REAUTH_REQUIRED" && !t._reauth) {
		t._reauth = !0;
		let n = await Fn();
		return n ? (t.headers["X-Reauth-Token"] = n, In(t)) : Promise.reject(zn(e));
	}
	let r = t.url?.includes("/auth/refresh");
	if (e.response?.status !== 401 || t._retry || r) return Promise.reject(zn(e));
	if (t._retry = !0, Ln) return new Promise((e) => {
		Rn.push((n) => {
			t.headers.Authorization = `Bearer ${n}`, e(In(t));
		});
	});
	Ln = !0;
	try {
		let { data: e } = await je.post("/api/v1/auth/refresh", {}, { withCredentials: !0 }), n = e.access_token;
		return Un(n), Rn.forEach((e) => e(n)), Rn = [], t.headers.Authorization = `Bearer ${n}`, In(t);
	} catch {
		return Rn = [], Wn(), Promise.reject(e);
	} finally {
		Ln = !1;
	}
});
function zn(e) {
	let t = e.response?.data;
	return {
		message: t?.message ?? e.message ?? "Erreur inconnue",
		code: t?.error ?? "UNKNOWN"
	};
}
var Bn = () => null;
function Vn(e) {
	if (e) {
		let t = window.location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `access_token=${e}; path=/; SameSite=Strict; max-age=900${t}`;
	} else document.cookie = "access_token=; path=/; SameSite=Strict; max-age=0";
}
function Hn() {
	return Bn();
}
function Un(e) {
	Vn(e);
}
function Wn() {
	Vn(null);
}
//#endregion
//#region ../../src/core/api/modules.ts
var Gn = {
	list: () => In.get("/modules"),
	publicConfig: () => In.get("/config")
}, Kn = "kubuno_theme", qn = 1, Jn = null, Yn = /* @__PURE__ */ new Set(), Xn = /* @__PURE__ */ new Set(), Zn = !1;
function Qn(e) {
	if (!e.scripts_enabled) return !1;
	let t = e.theme_api_version ?? qn;
	return t === qn ? !0 : (console.warn(`[theme] ${e.id} : theme_api v${t} ≠ host v${qn} — scripts ignorés`), !1);
}
function $n(t, n, r = !1) {
	return {
		React: e,
		ui: Ne,
		components: {
			register: (e, t, n) => r ? Pe.registerPreview(e, t) : Pe.register(e, t, n),
			unregister: (e, t) => r ? void 0 : Pe.unregister(e, t)
		},
		theme: {
			id: t.id,
			name: t.name,
			colorScheme: t.color_scheme,
			vars: t.vars
		},
		moduleId: n
	};
}
function er(e, t) {
	if (document.querySelector(`link[data-kbtheme="${t}"]`)) return;
	let n = document.createElement("link");
	n.rel = "stylesheet", n.href = e, n.dataset.kbtheme = t, document.head.appendChild(n);
}
async function tr(e, t) {
	try {
		let n = await import(
			/* @vite-ignore */
			e
), r = n.register ?? n.default;
		typeof r == "function" ? r(t) : console.warn(`[theme] ${e} : pas d'export register() — ignoré`);
	} catch (t) {
		console.error(`[theme] échec du script ${e}`, t);
	}
}
function nr() {
	document.querySelectorAll("link[data-kbtheme], style[data-kbtheme]").forEach((e) => e.remove()), Pe.clearAll();
	let e = document.documentElement;
	for (let t of Yn) e.style.removeProperty(t);
	Yn.clear(), Xn.clear(), Zn = !1, Jn = null;
}
function rr() {
	return Array.from(document.querySelectorAll("link[data-kbmod]")).map((e) => e.dataset.kbmod).filter((e) => !!e);
}
function ir(e, t) {
	let n = e.modules?.[t];
	if (!(!n || !e.assets_base) && (n.css && er(`${e.assets_base}/${n.css}`, `m:${t}`), n.script && Qn(e))) {
		let r = `${e.id}:${t}`;
		if (Xn.has(r)) return;
		Xn.add(r), tr(`${e.assets_base}/${n.script}`, $n(e, t));
	}
}
function ar(e) {
	nr();
	let t = document.documentElement;
	for (let [n, r] of Object.entries(e.vars ?? {})) t.style.setProperty(n, r), Yn.add(n);
	t.style.colorScheme = e.color_scheme, e.assets_base && e.global?.css && er(`${e.assets_base}/${e.global.css}`, "global"), e.assets_base && e.global?.script && Qn(e) && !Zn && (Zn = !0, tr(`${e.assets_base}/${e.global.script}`, $n(e))), Jn = e;
	for (let t of rr()) ir(e, t);
}
var or = Ae((e, t) => ({
	themes: [],
	activeThemeId: localStorage.getItem(Kn) ?? "kubuno-reference",
	isLoaded: !1,
	fetchThemes: async () => {
		try {
			let [t, n] = await Promise.all([je.get("/api/v1/themes"), je.get("/api/v1/config").catch(() => ({ data: { config: {} } }))]), r = t.data.themes, i = (n.data.config ?? {})["appearance.theme"] ?? "kubuno-reference", a = localStorage.getItem(Kn) ?? i, o = r.find((e) => e.id === a) ?? r.find((e) => e.id === "kubuno-reference") ?? r[0];
			e({
				themes: r,
				activeThemeId: o?.id ?? a,
				isLoaded: !0
			}), o && ar(o);
		} catch {
			e({ isLoaded: !0 });
		}
	},
	applyTheme: (n) => {
		let r = t().themes.find((e) => e.id === n);
		r && (ar(r), localStorage.setItem(Kn, n), e({ activeThemeId: n }));
	},
	applyThemeModuleAssets: (e) => {
		Jn && ir(Jn, e);
	},
	loadThemePreview: (e) => {
		if (Pe.clearPreview(), !e.assets_base || !Qn(e)) return;
		let t = [];
		if (e.global?.script && t.push(`${e.assets_base}/${e.global.script}`), e.modules) for (let n of Object.values(e.modules)) n.script && t.push(`${e.assets_base}/${n.script}`);
		for (let n of t) tr(n, $n(e, void 0, !0));
	},
	clearThemePreview: () => Pe.clearPreview()
})), sr = /* @__PURE__ */ new Set(), cr = /* @__PURE__ */ new Map();
async function lr(e) {
	let t = e.filter((e) => e.frontend_entry && !sr.has(e.module_id));
	if (t.length === 0) return 0;
	let n = t.map((e) => {
		let t = cr.get(e.module_id);
		if (t) return t;
		let n = ur(e).finally(() => cr.delete(e.module_id));
		return cr.set(e.module_id, n), n;
	});
	return (await Promise.allSettled(n)).filter((e) => e.status === "fulfilled" && e.value).length;
}
async function ur(e) {
	let t = e.frontend_entry;
	try {
		let n = t.replace(/\.js(\?.*)?$/, ".css$1");
		if (n !== t && !document.querySelector(`link[data-kbmod="${e.module_id}"]`)) {
			let t = document.createElement("link");
			t.rel = "stylesheet", t.href = n, t.dataset.kbmod = e.module_id, document.head.appendChild(t);
		}
		let r = await import(
			/* @vite-ignore */
			t
), i = typeof r.sdkVersion == "number" ? r.sdkVersion : void 0;
		if (i !== void 0 && i !== Me) return console.warn(`[modules] ${e.module_id} : SDK v${i} ≠ host v${Me} — ignoré`), !1;
		if (typeof r.register != "function") return console.warn(`[modules] ${e.module_id} : pas d'export register() — ignoré`), !1;
		r.register(), sr.add(e.module_id);
		try {
			or.getState().applyThemeModuleAssets(e.module_id);
		} catch (t) {
			console.error(`[theme] application des overrides du module ${e.module_id}`, t);
		}
		return !0;
	} catch (t) {
		return console.error(`[modules] ${e.module_id} : échec de chargement du bundle UI`, t), !1;
	}
}
//#endregion
//#region ../../src/core/store/modulesStore.ts
var dr = [], fr = Ae((e) => ({
	activeModules: [],
	sidebarItems: dr,
	isLoading: !1,
	modulesReady: !1,
	loadedVersion: 0,
	fetchModules: async () => {
		e({ isLoading: !0 });
		try {
			let { data: t } = await Gn.list();
			e({
				activeModules: t.modules,
				sidebarItems: dr
			}), await lr(t.modules) > 0 && e((e) => ({ loadedVersion: e.loadedVersion + 1 }));
		} catch {} finally {
			e({
				isLoading: !1,
				modulesReady: !0
			});
		}
	}
})), pr = 241;
function mr({ mode: e = "date", value: t, onChange: n, startValue: r, endValue: i, onRangeChange: a, label: s, placeholder: l, disabled: u = !1, readOnly: d = !1, clearable: h = !1, required: g, error: b, hint: x, minDate: S, maxDate: C, disabledDate: w, minuteStep: T = 5, size: D = "md", className: O, id: k, name: A }) {
	let j = p(null), M = p(null), [N, P] = m(!1), [F, I] = m("day"), [L, R] = m(/* @__PURE__ */ new Date()), z = f(() => mn(t, e), [t, e]), B = f(() => mn(r, "date"), [r]), V = f(() => mn(i, "date"), [i]), [H, U] = m(() => z?.getHours() ?? 0), [W, G] = m(() => z?.getMinutes() ?? 0), [K, te] = m("first"), [q, ne] = m(null), [re, ie] = m(null), [ae, oe] = m({
		top: 0,
		left: 0
	}), se = f(() => (e === "date" || e === "datetime") && jn(), [e, fr((e) => e.loadedVersion)]), J = k ?? (typeof s == "string" ? s.toLowerCase().replace(/\s+/g, "-") : void 0), ce = f(() => {
		if (e === "daterange") {
			let e = B, t = V;
			return e ? t ? `${hn(e, "date")} – ${hn(t, "date")}` : hn(e, "date") : "";
		}
		return hn(z, e);
	}, [
		e,
		z,
		B,
		V
	]), Y = o(() => {
		if (u || d) return;
		let t = j.current;
		if (!t) return;
		let n = bn(e), r = n.w + (se ? pr : 0);
		oe(yn(t, n.h, r)), R(e === "daterange" ? B ?? /* @__PURE__ */ new Date() : z ?? /* @__PURE__ */ new Date()), I("day"), z && (e === "time" || e === "datetime") && (U(z.getHours()), G(z.getMinutes())), e === "daterange" && (te("first"), ne(null), ie(null)), P(!0);
	}, [
		u,
		d,
		e,
		z,
		B,
		se
	]);
	c(() => {
		if (!N) return;
		let e = (e) => {
			M.current && !M.current.contains(e.target) && j.current && !j.current.contains(e.target) && P(!1);
		}, t = (e) => {
			e.key === "Escape" && P(!1);
		};
		return document.addEventListener("mousedown", e), document.addEventListener("keydown", t), () => {
			document.removeEventListener("mousedown", e), document.removeEventListener("keydown", t);
		};
	}, [N]);
	let le = o((t) => {
		if (e === "daterange") {
			if (K === "first") ne(t), te("second"), a?.(gn(t, "date"), null);
			else {
				let e = q ?? t, [n, r] = be(e, t) ? [e, t] : [t, e];
				a?.(gn(n, "date"), gn(r, "date")), P(!1);
			}
			return;
		}
		if (e === "date") {
			n?.(gn(t, "date")), P(!1);
			return;
		}
		if (e === "datetime") {
			let e = new Date(t);
			e.setHours(H, W, 0, 0), n?.(gn(e, "datetime"));
		}
	}, [
		e,
		K,
		q,
		H,
		W,
		n,
		a
	]), ue = o((t, r) => {
		let i = e === "datetime" && z ? new Date(z) : /* @__PURE__ */ new Date();
		i.setHours(t, r, 0, 0), n?.(gn(i, e));
	}, [
		e,
		z,
		n
	]), de = o((e) => {
		U(e), ue(e, W);
	}, [W, ue]), fe = o((e) => {
		G(e), ue(H, e);
	}, [H, ue]), me = (t) => {
		t.stopPropagation(), e === "daterange" ? a?.(null, null) : n?.(null);
	}, he = () => {
		if (!t) {
			let t = e === "datetime" && z ? new Date(z) : /* @__PURE__ */ new Date();
			t.setHours(H, W, 0, 0), n?.(gn(t, e));
		}
		P(!1);
	}, ge = h && (e === "daterange" ? !!(r || i) : !!t) && !u && !d, _e = D === "sm" ? "h-7 text-sm" : "h-9 text-sm", Z = _(e === "time" ? ee : E, { size: 14 }), ve = {
		date: "jj/mm/aaaa",
		time: "hh:mm",
		datetime: "jj/mm/aaaa hh:mm",
		daterange: "jj/mm/aaaa – jj/mm/aaaa"
	}[e], Q = Array.from({ length: 24 }, (e, t) => t), ye = Array.from({ length: Math.ceil(60 / T) }, (e, t) => t * T), xe = e !== "time", Se = e === "time" || e === "datetime", Ce = bn(e).w + (se ? pr : 0), we = re ?? z ?? L, Te = q ?? B, Ee = q ? null : V;
	return /* @__PURE__ */ v("div", {
		className: y("flex flex-col gap-1", O),
		children: [
			s && /* @__PURE__ */ v("label", {
				htmlFor: J,
				className: "text-sm font-medium text-text-primary",
				children: [s, g && /* @__PURE__ */ _("span", {
					className: "text-danger ml-0.5",
					children: "*"
				})]
			}),
			/* @__PURE__ */ v("div", {
				className: "relative",
				children: [A && /* @__PURE__ */ _("input", {
					type: "hidden",
					name: A,
					value: t ?? "",
					readOnly: !0
				}), /* @__PURE__ */ v("button", {
					ref: j,
					id: J,
					type: "button",
					onClick: Y,
					disabled: u,
					"aria-haspopup": "dialog",
					"aria-expanded": N,
					className: y("w-full flex items-center gap-2 px-3 rounded border bg-white text-left", "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", b ? "border-danger focus:ring-danger" : "border-border", u && "bg-surface-2 cursor-not-allowed opacity-60", d && "cursor-default", _e),
					children: [
						/* @__PURE__ */ _("span", {
							className: "text-text-tertiary shrink-0",
							children: Z
						}),
						/* @__PURE__ */ _("span", {
							className: y("flex-1 truncate", ce ? "text-text-primary" : "text-text-tertiary"),
							children: ce || (l ?? ve)
						}),
						ge ? /* @__PURE__ */ _("button", {
							type: "button",
							onClick: me,
							className: "shrink-0 text-text-tertiary hover:text-text-primary transition-colors",
							tabIndex: -1,
							children: /* @__PURE__ */ _(pe, { size: 13 })
						}) : null
					]
				})]
			}),
			b && /* @__PURE__ */ _("p", {
				className: "text-xs text-danger",
				children: b
			}),
			x && !b && /* @__PURE__ */ _("p", {
				className: "text-xs text-text-secondary",
				children: x
			}),
			N && X(/* @__PURE__ */ _(En, {
				popRef: M,
				pos: ae,
				width: Ce,
				showCalendar: xe,
				showTime: Se,
				viewDate: L,
				setViewDate: R,
				view: F,
				setView: I,
				selected: z,
				onSelectDate: le,
				rangeStart: Te,
				rangeEnd: Ee,
				hoverDate: re,
				setHoverDate: ie,
				isRange: e === "daterange",
				minDate: S,
				maxDate: C,
				disabledDate: w,
				hourValues: Q,
				minuteValues: ye,
				hours: H,
				minutes: W,
				onHours: de,
				onMinutes: fe,
				showClear: ge,
				onClear: (e) => {
					me(e), P(!1);
				},
				onConfirm: he,
				dayPanel: se ? /* @__PURE__ */ _(Nn, { date: we }) : void 0
			}), document.body)
		]
	});
}
//#endregion
//#region ../../src/ui/fontFamily.ts
var hr = (e) => e.charCodeAt(0) << 24 | e.charCodeAt(1) << 16 | e.charCodeAt(2) << 8 | e.charCodeAt(3), gr = hr("name"), _r = hr("ttcf"), vr = hr("OS/2");
function yr(e) {
	let t = e.toLowerCase(), n = /italic|oblique/.test(t) ? "italic" : "normal", r = 400;
	return /thin|hairline/.test(t) ? r = 100 : /extra\s*light|ultra\s*light/.test(t) ? r = 200 : /semi\s*light|demi\s*light/.test(t) ? r = 350 : /light/.test(t) ? r = 300 : /medium/.test(t) ? r = 500 : /semi\s*bold|demi\s*bold/.test(t) ? r = 600 : /extra\s*bold|ultra\s*bold/.test(t) ? r = 800 : /black|heavy/.test(t) ? r = 900 : /bold/.test(t) && (r = 700), {
		weight: r,
		style: n
	};
}
function br(e) {
	try {
		let t = new DataView(e), n, r;
		if (t.getUint32(0) === _r) {
			let e = t.getUint32(12);
			n = t.getUint16(e + 4), r = e + 12;
		} else n = t.getUint16(4), r = 12;
		let i = -1, a = -1;
		for (let e = 0; e < n; e++) {
			let n = r + e * 16, o = t.getUint32(n);
			o === gr ? i = t.getUint32(n + 8) : o === vr && (a = t.getUint32(n + 8));
		}
		if (i < 0) return null;
		let o = t.getUint16(i + 2), s = i + t.getUint16(i + 4), c = (e) => {
			let n = null;
			for (let r = 0; r < o; r++) {
				let a = i + 6 + r * 12;
				if (t.getUint16(a + 6) !== e) continue;
				let o = t.getUint16(a), c = t.getUint16(a + 4), l = t.getUint16(a + 8), u = s + t.getUint16(a + 10), d = "";
				if (o === 3 || o === 0) for (let e = 0; e + 1 < l; e += 2) d += String.fromCharCode(t.getUint16(u + e));
				else for (let e = 0; e < l; e++) d += String.fromCharCode(t.getUint8(u + e));
				let f = (o === 3 ? 2 : 0) + +(c === 1033);
				d && (!n || f > n.score) && (n = {
					score: f,
					s: d
				});
			}
			return n ? n.s.trim() : null;
		}, l = c(16) || c(1);
		if (!l) return null;
		let u = c(17) || c(2) || "Regular", d = yr(u);
		if (a >= 0) {
			let e = t.getUint16(a + 4);
			e >= 1 && e <= 1e3 && (d.weight = e);
		}
		return {
			family: l,
			subfamily: u,
			weight: d.weight,
			style: d.style
		};
	} catch {
		return null;
	}
}
function xr(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e) {
		let e = (r || "").trim();
		if (!e) continue;
		let i = e.toLowerCase();
		t.has(i) || (t.add(i), n.push(e));
	}
	return n;
}
//#endregion
//#region ../../src/ui/FontPicker.tsx
var Sr = {
	light: {
		text: "var(--color-text-primary)",
		sec: "var(--color-text-secondary)",
		ter: "var(--color-text-tertiary)",
		border: "var(--color-border)",
		bg: "var(--color-surface-0)",
		hover: "var(--color-surface-1)",
		active: "var(--color-surface-2)",
		sel: "var(--color-primary-light)",
		accent: "var(--color-primary)"
	},
	dark: {
		text: "#e8e8e8",
		sec: "#b4b4b4",
		ter: "#8e8e8e",
		border: "#3a3a3a",
		bg: "#2a2a2a",
		hover: "#363636",
		active: "#404040",
		sel: "rgba(90,155,220,0.22)",
		accent: "#5a9bdc"
	}
}, Cr = (e) => `"${e.replace(/"/g, "")}", "Segoe UI", system-ui, sans-serif`, wr = [
	"sans",
	"serif",
	"mono",
	"script",
	"display"
], Tr = {
	sans: "Sans Serif",
	serif: "Serif",
	mono: "Monospace",
	script: "Manuscrite",
	display: "Fantaisie"
}, Er = /(mono|consol|courier|menlo|monaco|fixedsys|terminal|source code|fira ?code|jetbrains|inconsolata|space mono|ubuntu mono|cascadia|hack|iosevka|\bcode\b)/i, Dr = /(script|hand|brush|comic|cursive|calligr|pacifico|dancing|lobster|caveat|satisfy|sacramento|great vibes|shadows into|indie flower|kalam|marck|allura|tangerine|segoe script|bradley|lucida handwriting)/i, Or = /(display|impact|bebas|oswald|anton|abril|playbill|stencil|bungee|black ops|fredoka|lilita|luckiest|righteous|permanent marker|creepster|monoton|bangers|poster|headline)/i, kr = /(serif|times|georgia|garamond|book antiqua|palatino|cambria|constantia|didot|bodoni|minion|caslon|merriweather|playfair|lora|crimson|spectral|slab|rockwell|century|sylfaen|cardo|vollkorn)/i;
function Ar(e) {
	let t = e.toLowerCase();
	return Er.test(t) ? "mono" : Dr.test(t) ? "script" : Or.test(t) ? "display" : /\bsans\b/.test(t) ? "sans" : kr.test(t) ? "serif" : "sans";
}
function jr(e, t) {
	if (!t) return e;
	let n = e.toLowerCase().indexOf(t.toLowerCase());
	return n < 0 ? e : /* @__PURE__ */ v(g, { children: [
		e.slice(0, n),
		/* @__PURE__ */ _("span", {
			style: {
				color: "var(--color-primary)",
				fontWeight: 600
			},
			children: e.slice(n, n + t.length)
		}),
		e.slice(n + t.length)
	] });
}
function Mr({ value: e, onChange: t, fonts: n, recent: r = [], width: i = 150, height: a = 36, fontSize: o = 14, disabled: s = !1, className: u, variant: h = "default", placeholder: g = "", buttonStyle: y, sampleText: b = "AaBbCc", theme: x = "light" }) {
	let S = Sr[x], [C, w] = m(!1), [T, E] = m(null), [O, k] = m(""), [A, j] = m(0), M = p(null), N = p(null), P = p(null), F = p(null), I = l(), ee = f(() => xr([...r, ...n]), [r, n]), L = f(() => new Set(r.map((e) => e.toLowerCase())), [r]), { rows: R, options: z } = f(() => {
		let e = [], t = [], n = (n, r) => {
			if (n.length) {
				r && e.push({
					kind: "header",
					label: r
				});
				for (let r of n) e.push({
					kind: "opt",
					font: r,
					i: t.length
				}), t.push(r);
			}
		}, r = O.trim().toLowerCase();
		if (r) {
			let e = ee.filter((e) => e.toLowerCase().includes(r));
			e.sort((e, t) => !e.toLowerCase().startsWith(r) - +!t.toLowerCase().startsWith(r)), n(e, null);
		} else {
			let e = ee.filter((e) => L.has(e.toLowerCase()));
			n(e, e.length ? "Récentes" : null);
			let t = ee.filter((e) => !L.has(e.toLowerCase()));
			for (let e of wr) n(t.filter((t) => Ar(t) === e).sort((e, t) => e.localeCompare(t)), Tr[e]);
		}
		return {
			rows: e,
			options: t
		};
	}, [
		ee,
		L,
		O
	]), B = () => {
		if (s) return;
		let e = M.current?.getBoundingClientRect();
		e && E({
			top: e.bottom + 4,
			left: e.left,
			minWidth: Math.max(248, e.width)
		}), k(""), w((e) => !e);
	};
	c(() => {
		if (!C) return;
		let t = Math.max(0, z.indexOf(e));
		j(t);
		let n = (e) => {
			!M.current?.contains(e.target) && !N.current?.contains(e.target) && w(!1);
		};
		document.addEventListener("mousedown", n);
		let r = setTimeout(() => {
			F.current?.focus(), P.current?.querySelector(`[data-idx="${t}"]`)?.scrollIntoView({ block: "center" });
		}, 0);
		return () => {
			document.removeEventListener("mousedown", n), clearTimeout(r);
		};
	}, [C]), c(() => {
		C && P.current?.querySelector(`[data-idx="${A}"]`)?.scrollIntoView({ block: "nearest" });
	}, [A, C]), d(() => {
		let e = N.current;
		if (!e || !C || !T) return;
		let t = e.getBoundingClientRect(), n = T.left, r = T.top;
		t.right > window.innerWidth - 8 && (n = window.innerWidth - 8 - t.width), t.bottom > window.innerHeight - 8 && (r = Math.max(8, window.innerHeight - 8 - t.height)), n < 8 && (n = 8), e.style.left = `${n}px`, e.style.top = `${r}px`;
	}, [
		C,
		T,
		R.length
	]);
	let V = (e) => {
		t(e), w(!1);
	}, H = (e) => {
		let t = z.length - 1;
		e.key === "ArrowDown" ? (e.preventDefault(), j((e) => Math.min(t, e + 1))) : e.key === "ArrowUp" ? (e.preventDefault(), j((e) => Math.max(0, e - 1))) : e.key === "Home" ? (e.preventDefault(), j(0)) : e.key === "End" ? (e.preventDefault(), j(t)) : e.key === "PageDown" ? (e.preventDefault(), j((e) => Math.min(t, e + 8))) : e.key === "PageUp" ? (e.preventDefault(), j((e) => Math.max(0, e - 8))) : e.key === "Enter" ? (e.preventDefault(), z[A] && V(z[A])) : e.key === "Escape" && (e.preventDefault(), w(!1));
	}, U = h === "ghost", W = O.trim();
	return /* @__PURE__ */ v("div", {
		className: `relative ${u ?? ""}`,
		style: { width: i },
		children: [/* @__PURE__ */ v("button", {
			type: "button",
			ref: M,
			onClick: B,
			onMouseDown: (e) => e.preventDefault(),
			disabled: s,
			role: "combobox",
			"aria-haspopup": "listbox",
			"aria-expanded": C,
			"aria-controls": I,
			"aria-label": "Police",
			className: "w-full flex items-center justify-between gap-1 select-none",
			style: {
				height: a,
				padding: "0 6px 0 10px",
				fontSize: o,
				color: S.text,
				fontFamily: "\"Roboto Flex\", var(--font-family-sans, \"Segoe UI\"), system-ui, sans-serif",
				background: C ? S.active : void 0,
				border: `1px solid ${U ? "transparent" : S.border}`,
				borderRadius: "var(--radius-md)",
				cursor: s ? "not-allowed" : "pointer",
				opacity: s ? .5 : 1,
				transition: "background 0.12s, border-color 0.12s",
				...y
			},
			onMouseEnter: (e) => {
				!C && !s && (e.currentTarget.style.background = S.hover);
			},
			onMouseLeave: (e) => {
				C || (e.currentTarget.style.background = "");
			},
			title: e || g,
			children: [/* @__PURE__ */ _("span", {
				className: "truncate flex-1 text-left",
				style: e ? void 0 : { color: S.ter },
				children: e || g
			}), /* @__PURE__ */ _(ln, {
				size: 11,
				color: S.sec
			})]
		}), C && T && X(/* @__PURE__ */ v("div", {
			ref: N,
			onMouseDown: (e) => e.stopPropagation(),
			style: {
				position: "fixed",
				top: T.top,
				left: T.left,
				minWidth: T.minWidth,
				width: "max-content",
				maxWidth: 360,
				zIndex: 9999,
				background: S.bg,
				borderRadius: 10,
				border: `1px solid ${S.border}`,
				boxShadow: "0 8px 24px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.10)",
				overflow: "hidden"
			},
			children: [/* @__PURE__ */ v("div", {
				className: "flex items-center gap-2 px-2.5",
				style: {
					height: 40,
					borderBottom: `1px solid ${S.border}`
				},
				children: [
					/* @__PURE__ */ _(oe, {
						size: 15,
						style: {
							color: S.ter,
							flexShrink: 0
						}
					}),
					/* @__PURE__ */ _("input", {
						ref: F,
						value: O,
						onChange: (e) => {
							k(e.target.value), j(0);
						},
						onKeyDown: H,
						placeholder: "Rechercher une police…",
						"aria-label": "Rechercher une police",
						"aria-controls": I,
						"aria-autocomplete": "list",
						className: "flex-1 outline-none bg-transparent",
						style: {
							color: S.text,
							fontSize: 12
						}
					}),
					O && /* @__PURE__ */ _("button", {
						type: "button",
						onClick: () => {
							k(""), j(0), F.current?.focus();
						},
						className: "text-xs px-1.5 py-0.5 rounded",
						style: { color: S.sec },
						"aria-label": "Effacer la recherche",
						children: "Effacer"
					})
				]
			}), /* @__PURE__ */ v("div", {
				ref: P,
				id: I,
				role: "listbox",
				"aria-activedescendant": z[A] ? `${I}-opt-${A}` : void 0,
				style: {
					maxHeight: 340,
					overflowY: "auto",
					padding: "4px 0"
				},
				children: [z.length === 0 && /* @__PURE__ */ v("div", {
					className: "px-4 py-6 text-center",
					style: {
						color: S.ter,
						fontSize: 12
					},
					children: [
						"Aucune police pour « ",
						W,
						" »"
					]
				}), R.map((t, n) => t.kind === "header" ? /* @__PURE__ */ _("div", {
					"aria-hidden": !0,
					style: {
						padding: "8px 12px 4px",
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.05em",
						textTransform: "uppercase",
						color: S.ter,
						fontFamily: "var(--font-family-sans)"
					},
					children: t.label
				}, `h${n}`) : /* @__PURE__ */ v("button", {
					id: `${I}-opt-${t.i}`,
					"data-idx": t.i,
					type: "button",
					role: "option",
					"aria-selected": t.font === e,
					onClick: () => V(t.font),
					onMouseEnter: () => j(t.i),
					className: "w-full text-left flex items-center gap-2",
					style: {
						padding: "7px 10px 7px 12px",
						color: S.text,
						background: t.i === A ? S.sel : t.font === e ? S.hover : void 0
					},
					children: [
						/* @__PURE__ */ _("span", {
							style: {
								width: 16,
								flexShrink: 0,
								color: S.accent,
								display: "inline-flex"
							},
							children: t.font === e && /* @__PURE__ */ _(D, { size: 15 })
						}),
						/* @__PURE__ */ _("span", {
							className: "truncate flex-1",
							style: {
								fontFamily: Cr(t.font),
								fontSize: 15
							},
							children: jr(t.font, W)
						}),
						b && /* @__PURE__ */ _("span", {
							className: "truncate",
							style: {
								flexShrink: 0,
								maxWidth: 96,
								marginLeft: 8,
								fontFamily: Cr(t.font),
								fontSize: 15,
								color: S.ter
							},
							children: b
						})
					]
				}, `o${t.i}`))]
			})]
		}), document.body)]
	});
}
//#endregion
//#region ../../src/ui/FontSizeField.tsx
var Nr = "var(--radius-md)";
function Pr({ value: e, onChange: t, sizes: n, min: r, max: i, width: a, height: o, fontSize: s, disabled: l, boxStyle: u, theme: f = "light" }) {
	let h = Sr[f], [g, y] = m(!1), [b, x] = m(null), [S, C] = m(e), [w, T] = m(!1), E = p(null), D = p(null), O = p(null);
	c(() => {
		w || C(e);
	}, [e, w]);
	let k = (n) => {
		let a = n.trim();
		if (a === "") {
			C(e);
			return;
		}
		let o = Math.round(parseFloat(a.replace(",", ".")));
		if (!Number.isFinite(o)) {
			C(e);
			return;
		}
		t(String(Math.max(r, Math.min(i, o))));
	}, A = (n) => {
		let a = Math.max(r, Math.min(i, (parseInt(S || e || "0", 10) || 0) + n));
		t(String(a)), C(String(a));
	}, j = () => {
		if (l) return;
		let e = E.current?.getBoundingClientRect();
		e && x({
			top: e.bottom + 4,
			left: e.left,
			width: e.width
		}), y((e) => !e);
	};
	return c(() => {
		if (!g) return;
		let e = (e) => {
			!E.current?.contains(e.target) && !O.current?.contains(e.target) && y(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [g]), d(() => {
		let e = O.current;
		if (!e || !g || !b) return;
		let t = e.getBoundingClientRect(), n = b.left, r = b.top;
		t.bottom > window.innerHeight - 8 && (r = Math.max(8, b.top - t.height - o - 8)), t.right > window.innerWidth - 8 && (n = window.innerWidth - 8 - t.width), e.style.left = `${n}px`, e.style.top = `${r}px`;
	}, [
		g,
		b,
		o
	]), /* @__PURE__ */ v("div", {
		ref: E,
		className: "relative",
		style: { width: a },
		children: [/* @__PURE__ */ v("div", {
			className: "flex items-center select-none",
			style: {
				height: o,
				background: g ? h.active : void 0,
				border: `1px solid ${h.border}`,
				cursor: l ? "not-allowed" : "text",
				opacity: l ? .5 : 1,
				transition: "background 0.12s",
				...u
			},
			onMouseEnter: (e) => {
				!g && !l && (e.currentTarget.style.background = h.hover);
			},
			onMouseLeave: (e) => {
				g || (e.currentTarget.style.background = "");
			},
			children: [/* @__PURE__ */ _("input", {
				ref: D,
				value: S,
				disabled: l,
				inputMode: "numeric",
				onChange: (e) => C(e.target.value),
				onFocus: () => {
					T(!0), D.current?.select();
				},
				onBlur: () => {
					T(!1), k(S);
				},
				onKeyDown: (t) => {
					t.key === "Enter" ? (t.preventDefault(), k(S), D.current?.blur()) : t.key === "ArrowUp" ? (t.preventDefault(), A(1)) : t.key === "ArrowDown" ? (t.preventDefault(), A(-1)) : t.key === "Escape" && (t.preventDefault(), C(e), D.current?.blur());
				},
				className: "min-w-0 flex-1 outline-none bg-transparent text-left",
				style: {
					height: "100%",
					padding: "0 2px 0 8px",
					fontSize: s,
					color: h.text,
					fontFamily: "var(--font-family-sans)"
				},
				"aria-label": "Taille de police"
			}), /* @__PURE__ */ _("button", {
				type: "button",
				tabIndex: -1,
				disabled: l,
				onMouseDown: (e) => e.preventDefault(),
				onClick: j,
				"aria-label": "Choisir une taille",
				"aria-haspopup": "listbox",
				"aria-expanded": g,
				className: "flex items-center justify-center",
				style: {
					width: 18,
					height: "100%",
					flexShrink: 0,
					cursor: l ? "not-allowed" : "pointer"
				},
				children: /* @__PURE__ */ _(ln, {
					size: 10,
					color: h.sec
				})
			})]
		}), g && b && X(/* @__PURE__ */ _("div", {
			ref: O,
			role: "listbox",
			onMouseDown: (e) => e.stopPropagation(),
			style: {
				position: "fixed",
				top: b.top,
				left: b.left,
				minWidth: Math.max(56, b.width),
				maxHeight: 280,
				overflowY: "auto",
				zIndex: 9999,
				padding: "4px 0",
				background: h.bg,
				border: `1px solid ${h.border}`,
				borderRadius: 8,
				boxShadow: "0 8px 24px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.10)"
			},
			children: n.map((n) => {
				let r = String(n), i = r === e;
				return /* @__PURE__ */ _("button", {
					type: "button",
					role: "option",
					"aria-selected": i,
					onClick: () => {
						t(r), C(r), y(!1);
					},
					className: "w-full text-left",
					style: {
						padding: "5px 12px",
						fontSize: s,
						color: h.text,
						fontWeight: i ? 600 : void 0,
						background: i ? h.sel : void 0
					},
					onMouseEnter: (e) => {
						e.currentTarget.style.background = i ? h.sel : h.hover;
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.background = i ? h.sel : "";
					},
					children: r
				}, r);
			})
		}), document.body)]
	});
}
function Fr({ font: e, onFontChange: t, fonts: n, recentFonts: r, size: i, onSizeChange: a, sizes: o, minSize: s = 1, maxSize: c = 999, height: l = 30, fontWidth: u = 150, sizeWidth: d = 62, fontSize: f = 14, disabled: p = !1, className: m, theme: h = "light" }) {
	return /* @__PURE__ */ v("div", {
		className: `flex items-stretch ${m ?? ""}`,
		children: [/* @__PURE__ */ _(Mr, {
			value: e,
			onChange: t,
			fonts: n,
			recent: r,
			width: u,
			height: l,
			fontSize: f,
			disabled: p,
			placeholder: "",
			theme: h,
			buttonStyle: {
				borderRadius: 0,
				borderTopLeftRadius: Nr,
				borderBottomLeftRadius: Nr
			}
		}), /* @__PURE__ */ _("div", {
			style: { marginLeft: -1 },
			children: /* @__PURE__ */ _(Pr, {
				value: i,
				onChange: a,
				sizes: o,
				min: s,
				max: c,
				width: d,
				height: l,
				fontSize: f,
				disabled: p,
				theme: h,
				boxStyle: {
					borderRadius: 0,
					borderTopRightRadius: Nr,
					borderBottomRightRadius: Nr
				}
			})
		})]
	});
}
//#endregion
//#region ../../src/ui/MenuDropdown.tsx
function Ir() {
	let [e, t] = m(() => typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(pointer: coarse)").matches);
	return c(() => {
		let e = window.matchMedia("(pointer: coarse)"), n = () => t(e.matches);
		return e.addEventListener("change", n), () => e.removeEventListener("change", n);
	}, []), e;
}
var Lr = {
	light: {
		bg: "var(--kb-float-surface)",
		text: "#202124",
		sep: "var(--kb-black-12)",
		label: "#5f6368",
		hover: "#1a73e8",
		hoverText: "#fff",
		accent: "#1a73e8",
		shortcut: "#5f6368",
		danger: "#d93025",
		border: "var(--kb-float-border)",
		sheetBg: "#fff",
		shadow: "var(--kb-float-highlight), var(--kb-shadow-float)"
	},
	dark: {
		bg: "var(--kb-float-surface-dark)",
		text: "#d6d6d6",
		sep: "var(--kb-white-12)",
		label: "#8e8e8e",
		hover: "#5a9bdc",
		hoverText: "#fff",
		accent: "#5a9bdc",
		shortcut: "#8e8e8e",
		danger: "#e84a4a",
		border: "var(--kb-float-border-dark)",
		sheetBg: "#323232",
		shadow: "var(--kb-float-highlight-dark), var(--kb-shadow-float-dark)"
	}
};
function Rr({ items: e, pos: n, onClose: r, minWidth: i = 200, theme: a = "light" }) {
	let o = n.minWidth ?? i, s = Lr[a], l = p(null), u = p(null), f = Ir(), [h, y] = m(null), [b, x] = m(null);
	if (c(() => {
		let e = (e) => {
			let t = e.target;
			(t instanceof Element ? t : t?.parentElement ?? null)?.closest("[data-kb-menu]") || r();
		};
		return document.addEventListener("pointerdown", e, !0), () => document.removeEventListener("pointerdown", e, !0);
	}, [r]), cn(!0, r), d(() => {
		let e = l.current;
		if (!e || f) return;
		let t = () => {
			let t = window.innerWidth, r = window.innerHeight;
			u.current && (u.current.style.maxHeight = `${r - 16 - 2}px`), e.style.maxWidth = `${t - 16}px`, e.style.left = `${n.left}px`, e.style.top = `${n.top}px`;
			let i = e.getBoundingClientRect(), a = n.left, o = n.top;
			a + i.width > t - 8 && (a = t - 8 - i.width), o + i.height > r - 8 && (o = r - 8 - i.height), a < 8 && (a = 8), o < 8 && (o = 8), e.style.left = `${a}px`, e.style.top = `${o}px`;
		};
		return t(), window.addEventListener("resize", t), () => window.removeEventListener("resize", t);
	}, [n, f]), f) {
		let n = h ? h.items : e, i = {
			padding: "13px 20px",
			fontSize: 15,
			lineHeight: "22px",
			minHeight: 50,
			display: "flex",
			alignItems: "center",
			gap: 12,
			width: "100%",
			textAlign: "left"
		};
		return X(/* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("div", {
			className: "fixed inset-0 z-[9998]",
			style: { background: "rgba(0,0,0,0.35)" },
			onClick: r
		}), /* @__PURE__ */ v("div", {
			ref: l,
			onMouseDown: (e) => e.stopPropagation(),
			[on]: "",
			className: "fixed left-0 right-0 bottom-0 z-[9999]",
			style: {
				background: s.sheetBg,
				color: s.text,
				borderTopLeftRadius: 16,
				borderTopRightRadius: 16,
				maxHeight: "78vh",
				overflowY: "auto",
				paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
				boxShadow: "0 -8px 30px rgba(0,0,0,0.28)",
				animation: "kbnSheetUp 0.18s ease-out"
			},
			children: [
				/* @__PURE__ */ _("style", { children: "@keyframes kbnSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}" }),
				/* @__PURE__ */ _("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						padding: "8px 0 2px"
					},
					children: /* @__PURE__ */ _("div", { style: {
						width: 38,
						height: 4,
						borderRadius: 2,
						background: s.sep
					} })
				}),
				h && /* @__PURE__ */ v("button", {
					onClick: () => y(null),
					style: {
						...i,
						color: s.text,
						fontWeight: 600,
						borderBottom: `1px solid ${s.sep}`
					},
					children: [/* @__PURE__ */ _("span", {
						style: {
							width: 20,
							flexShrink: 0,
							color: s.accent,
							fontSize: 18,
							display: "inline-flex",
							alignItems: "center"
						},
						children: "‹"
					}), /* @__PURE__ */ _("span", {
						style: { flex: 1 },
						children: h.label
					})]
				}),
				n.map((e, n) => {
					if (e.type === "separator") return /* @__PURE__ */ _("div", { style: {
						background: s.sep,
						height: 1,
						margin: "4px 0"
					} }, n);
					if (e.type === "label") return /* @__PURE__ */ _("div", {
						style: {
							padding: "8px 20px 4px",
							fontSize: "var(--kb-text-body)",
							color: s.label,
							fontWeight: 600,
							textTransform: "uppercase",
							letterSpacing: "0.05em"
						},
						children: e.text
					}, n);
					if (e.type === "custom") return /* @__PURE__ */ _(t.Fragment, { children: e.render(r) }, n);
					if (e.type === "submenu") return /* @__PURE__ */ v("button", {
						disabled: e.disabled,
						onClick: () => y({
							label: e.label,
							items: e.items
						}),
						style: {
							...i,
							color: s.text,
							opacity: e.disabled ? .4 : 1
						},
						children: [
							/* @__PURE__ */ _("span", {
								style: {
									width: 20,
									flexShrink: 0,
									color: s.accent,
									fontSize: 16,
									display: "inline-flex",
									alignItems: "center"
								},
								children: e.icon ?? ""
							}),
							/* @__PURE__ */ _("span", {
								style: { flex: 1 },
								children: e.label
							}),
							/* @__PURE__ */ _("span", {
								style: {
									color: s.label,
									fontSize: 16,
									flexShrink: 0
								},
								children: "›"
							})
						]
					}, n);
					let a = e.danger ? s.danger : s.text;
					return /* @__PURE__ */ v("button", {
						disabled: e.disabled,
						onClick: () => {
							e.onClick(), r();
						},
						style: {
							...i,
							color: a,
							opacity: e.disabled ? .4 : 1
						},
						children: [/* @__PURE__ */ _("span", {
							style: {
								width: 20,
								flexShrink: 0,
								color: e.danger ? s.danger : s.accent,
								fontSize: 16,
								display: "inline-flex",
								alignItems: "center"
							},
							children: e.checked ? "✓" : e.icon ? e.icon : ""
						}), /* @__PURE__ */ _("span", {
							style: { flex: 1 },
							children: e.label
						})]
					}, n);
				})
			]
		})] }), document.body);
	}
	return X(/* @__PURE__ */ v("div", {
		ref: l,
		onMouseDown: (e) => {
			e.preventDefault(), e.stopPropagation();
		},
		[on]: "",
		className: a === "dark" ? "kb-frosted kb-frosted-dark" : "kb-frosted",
		style: {
			position: "fixed",
			top: n.top,
			left: n.left,
			minWidth: o,
			zIndex: 9999
		},
		children: [/* @__PURE__ */ _("div", {
			className: "kb-frost-layer",
			"aria-hidden": !0
		}), /* @__PURE__ */ _("div", {
			ref: u,
			style: {
				padding: 5,
				overflowY: "auto",
				overflowX: "hidden"
			},
			children: e.map((e, n) => {
				if (e.type === "separator") return /* @__PURE__ */ _("div", { style: {
					background: s.sep,
					height: 1,
					margin: "5px 6px"
				} }, n);
				if (e.type === "label") return /* @__PURE__ */ _("div", {
					style: {
						padding: "4px 10px",
						fontSize: "var(--kb-text-meta)",
						color: s.label,
						fontWeight: 600,
						textTransform: "uppercase",
						letterSpacing: "0.05em"
					},
					children: e.text
				}, n);
				if (e.type === "submenu") return /* @__PURE__ */ _(zr, {
					item: e,
					onClose: r,
					theme: a,
					index: n,
					hovered: b,
					setHovered: x
				}, n);
				if (e.type === "custom") return /* @__PURE__ */ _(t.Fragment, { children: e.render(r) }, n);
				let i = b === n && !e.disabled, o = i ? s.hoverText : e.danger ? s.danger : s.text;
				return /* @__PURE__ */ v("button", {
					disabled: e.disabled,
					onClick: () => {
						e.onClick(), r();
					},
					onMouseEnter: () => x(n),
					onMouseLeave: () => x((e) => e === n ? null : e),
					className: "w-full flex items-center gap-2 text-left disabled:opacity-40 disabled:cursor-not-allowed",
					style: {
						padding: "5px 12px 5px 10px",
						fontSize: "var(--kb-text-body)",
						color: o,
						lineHeight: "20px",
						borderRadius: 6,
						background: i ? s.hover : "transparent"
					},
					children: [
						/* @__PURE__ */ _("span", {
							style: {
								width: 20,
								flexShrink: 0,
								color: i ? s.hoverText : e.danger ? s.danger : s.accent,
								fontSize: 14,
								display: "inline-flex",
								alignItems: "center"
							},
							children: e.checked ? "✓" : e.icon ? e.icon : ""
						}),
						/* @__PURE__ */ _("span", {
							className: "flex-1",
							children: e.label
						}),
						e.shortcut && /* @__PURE__ */ _("span", {
							style: {
								color: i ? s.hoverText : s.shortcut,
								fontSize: "var(--kb-text-body)",
								marginLeft: 24,
								flexShrink: 0,
								opacity: i ? .85 : 1
							},
							children: e.shortcut
						})
					]
				}, n);
			})
		})]
	}), document.body);
}
function zr({ item: e, onClose: n, theme: r, index: i, hovered: a, setHovered: o }) {
	let [s, c] = t.useState(null), l = Lr[r], u = p(null), d = p(void 0), f = () => {
		d.current && clearTimeout(d.current);
		let e = u.current?.getBoundingClientRect();
		if (!e) return;
		let t = e.right + 220 > window.innerWidth - 8 && e.left - 220 > 8 ? e.left - 220 + 2 : e.right - 2;
		c({
			top: e.top - 4,
			left: t,
			minWidth: 220
		});
	}, m = () => {
		d.current && clearTimeout(d.current), d.current = setTimeout(() => c(null), 180);
	}, h = a === i || s !== null && a === null;
	return /* @__PURE__ */ v("div", {
		onMouseEnter: () => {
			o(i), f();
		},
		onMouseLeave: () => {
			o((e) => e === i ? null : e), m();
		},
		style: { position: "relative" },
		children: [/* @__PURE__ */ v("button", {
			ref: u,
			disabled: e.disabled,
			className: "w-full flex items-center gap-2 text-left disabled:opacity-40 disabled:cursor-not-allowed",
			style: {
				padding: "5px 12px 5px 10px",
				fontSize: "var(--kb-text-body)",
				color: h ? l.hoverText : l.text,
				lineHeight: "20px",
				borderRadius: 6,
				background: h ? l.hover : "transparent"
			},
			children: [
				/* @__PURE__ */ _("span", {
					style: {
						width: 20,
						flexShrink: 0,
						color: h ? l.hoverText : l.accent,
						fontSize: 14,
						display: "inline-flex",
						alignItems: "center"
					},
					children: e.icon ?? ""
				}),
				/* @__PURE__ */ _("span", {
					className: "flex-1",
					children: e.label
				}),
				/* @__PURE__ */ _("span", {
					style: {
						color: h ? l.hoverText : l.label,
						fontSize: "var(--kb-text-body)",
						marginLeft: 24,
						flexShrink: 0
					},
					children: "▸"
				})
			]
		}), s && /* @__PURE__ */ _("div", {
			onMouseEnter: f,
			onMouseLeave: m,
			children: /* @__PURE__ */ _(Rr, {
				items: e.items,
				pos: s,
				onClose: n,
				theme: r
			})
		})]
	});
}
function Br() {
	let [e, n] = t.useState(null);
	return {
		pos: e,
		open: (e) => {
			if (e.type === "contextmenu") {
				n({
					top: e.clientY,
					left: e.clientX
				});
				return;
			}
			let t = e.currentTarget.getBoundingClientRect();
			n({
				top: t.bottom + 2,
				left: t.left
			});
		},
		openAt: (e, t) => n({
			top: t,
			left: e
		}),
		close: () => n(null),
		isOpen: e !== null
	};
}
//#endregion
//#region ../../src/ui/Tabs.tsx
var Vr = {
	tabs_scroll_left: "Scroll tabs left",
	tabs_scroll_right: "Scroll tabs right"
};
function Hr({ tabs: e, value: t, onChange: n, className: r, size: i = "md", variant: a = "underline", t: s }) {
	let l = (e) => e === t, u = i === "sm" ? 14 : 16, d = (e) => s ? s(e) : Vr[e] ?? e, f = p(null), [h, g] = m({
		left: !1,
		right: !1
	}), b = o(() => {
		let e = f.current;
		if (!e) return;
		let t = e.scrollWidth - e.clientWidth;
		g((n) => {
			let r = {
				left: e.scrollLeft > 1,
				right: e.scrollLeft < t - 1
			};
			return n.left === r.left && n.right === r.right ? n : r;
		});
	}, []);
	c(() => {
		let e = f.current;
		if (!e || a !== "underline") return;
		b(), e.addEventListener("scroll", b, { passive: !0 });
		let t = new ResizeObserver(b);
		t.observe(e);
		for (let n of Array.from(e.children)) t.observe(n);
		return () => {
			e.removeEventListener("scroll", b), t.disconnect();
		};
	}, [
		b,
		a,
		e.length
	]);
	let x = (e) => {
		let t = f.current;
		t && t.scrollBy({
			left: e * Math.max(120, t.clientWidth * .75),
			behavior: "smooth"
		});
	}, S = y(a === "pills" && "flex gap-1", a === "stretched" && "flex border-b border-border", r), C = a === "underline" || a === "stretched", w = (e) => y("flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors", i === "sm" && (C ? "px-3 pt-1.5 pb-[9px]" : "px-3 py-1.5"), i === "md" && (C ? "px-4 pt-2 pb-[11px]" : "px-4 py-2"), C && "relative before:absolute before:inset-x-0 before:bottom-0 before:mx-2\n                   before:h-[3px] before:rounded-t-[3px] before:content-['']", C && "justify-center hover:bg-surface-2", C && l(e) && "text-primary before:bg-primary", C && !l(e) && "text-text-secondary hover:text-text-primary", a === "stretched" && "flex-1 justify-center", a === "pills" && "rounded-full", a === "pills" && l(e) && "bg-primary-light text-primary", a === "pills" && !l(e) && "text-text-secondary hover:bg-surface-2"), T = "flex shrink-0 items-center px-0.5 text-text-secondary transition-colors hover:text-text-primary", E = e.map((e) => {
		let t = e.icon;
		return /* @__PURE__ */ v("button", {
			type: "button",
			role: "tab",
			"aria-selected": l(e.id),
			onClick: () => n(e.id),
			className: w(e.id),
			children: [
				t && /* @__PURE__ */ _(t, { size: u }),
				e.label,
				e.badge !== void 0 && /* @__PURE__ */ _("span", {
					className: y("rounded-full text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1", l(e.id) ? "bg-primary text-white" : "bg-surface-3 text-text-secondary"),
					children: e.badge
				})
			]
		}, e.id);
	});
	return a === "underline" ? /* @__PURE__ */ v("div", {
		className: y("flex items-stretch border-b border-border", r),
		children: [
			h.left && /* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": d("tabs_scroll_left"),
				className: T,
				onClick: () => x(-1),
				children: /* @__PURE__ */ _(A, { size: u })
			}),
			/* @__PURE__ */ _("div", {
				ref: f,
				className: "no-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden",
				children: /* @__PURE__ */ _("div", {
					role: "tablist",
					className: "grid w-max grid-flow-col auto-cols-fr gap-1",
					children: E
				})
			}),
			h.right && /* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": d("tabs_scroll_right"),
				className: T,
				onClick: () => x(1),
				children: /* @__PURE__ */ _(j, { size: u })
			})
		]
	}) : /* @__PURE__ */ _("div", {
		className: S,
		role: "tablist",
		children: E
	});
}
//#endregion
//#region ../../src/ui/Accordion.tsx
function Ur({ items: e, defaultOpen: n = [], open: r, onOpenChange: i, single: a = !1, className: o, size: s = "md" }) {
	let c = r !== void 0, [l, u] = t.useState(n), d = c ? r : l, f = (e, t) => {
		let n = e.includes(t);
		return a ? n ? [] : [t] : n ? e.filter((e) => e !== t) : [...e, t];
	}, p = (e) => {
		c ? i?.(f(r, e)) : (u((t) => f(t, e)), i?.(f(d, e)));
	}, m = s === "sm" ? "px-3 py-2" : "px-4 py-3";
	return /* @__PURE__ */ _("div", {
		className: y("flex flex-col gap-2", o),
		children: e.map((e) => {
			let t = d.includes(e.id), n = e.icon;
			return /* @__PURE__ */ v("div", {
				className: "rounded-xl border border-border bg-surface-0 overflow-hidden",
				children: [/* @__PURE__ */ v("button", {
					type: "button",
					disabled: e.disabled,
					"aria-expanded": t,
					onClick: () => !e.disabled && p(e.id),
					className: y("flex w-full items-center gap-3 text-left transition-colors", m, e.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-surface-2"),
					children: [
						n && /* @__PURE__ */ _(n, {
							size: 16,
							className: "shrink-0 text-text-secondary"
						}),
						/* @__PURE__ */ _("span", {
							className: "flex-1 min-w-0 text-xs font-semibold uppercase tracking-wide text-text-secondary truncate",
							children: e.title
						}),
						e.badge !== void 0 && /* @__PURE__ */ _("span", {
							className: "rounded-full bg-surface-3 text-text-secondary text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1",
							children: e.badge
						}),
						/* @__PURE__ */ _(k, {
							size: 16,
							className: y("shrink-0 text-text-tertiary transition-transform duration-200", t && "rotate-180")
						})
					]
				}), /* @__PURE__ */ _("div", {
					className: "grid transition-[grid-template-rows] duration-200 ease-out",
					style: { gridTemplateRows: t ? "1fr" : "0fr" },
					children: /* @__PURE__ */ _("div", {
						className: "overflow-hidden",
						children: /* @__PURE__ */ _("div", {
							className: y(s === "sm" ? "px-3 pb-3" : "px-4 pb-4", "pt-1 border-t border-border"),
							children: e.content
						})
					})
				})]
			}, e.id);
		})
	});
}
//#endregion
//#region ../../src/ui/ResizeHandle.tsx
function Wr({ position: e, onResize: t, min: n = 160, max: r = 560, onReset: i, title: a }) {
	return /* @__PURE__ */ v("div", {
		onMouseDown: (i) => {
			i.preventDefault();
			let a = i.clientX, o = e, s = !0, c = (e) => {
				s && t(Math.max(n, Math.min(r, o + (e.clientX - a))));
			}, l = () => {
				s = !1, document.removeEventListener("mousemove", c), document.removeEventListener("mouseup", l), document.body.style.userSelect = "", document.body.style.cursor = "";
			};
			document.addEventListener("mousemove", c), document.addEventListener("mouseup", l), document.body.style.userSelect = "none", document.body.style.cursor = "ew-resize";
		},
		onDoubleClick: i,
		title: a,
		style: { left: e },
		className: "absolute top-0 bottom-0 z-20 w-3 -translate-x-1/2 cursor-ew-resize group",
		children: [/* @__PURE__ */ _("div", { className: "absolute inset-y-0 left-1/2 -translate-x-1/2 w-[5px] rounded-full bg-border group-hover:bg-primary/40 transition-colors" }), /* @__PURE__ */ _("div", {
			className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center\n                      h-9 w-3.5 rounded-full bg-surface-0 border border-border text-text-tertiary shadow-sm\n                      opacity-80 group-hover:opacity-100 group-hover:bg-primary-light group-hover:text-primary\n                      group-hover:border-primary/40 transition",
			children: /* @__PURE__ */ _(B, { size: 13 })
		})]
	});
}
function Gr(e, t, n = 160, r = 560) {
	let [i, a] = m(() => {
		let i = Number(localStorage.getItem(e));
		return i >= n && i <= r ? i : t;
	});
	return c(() => {
		try {
			localStorage.setItem(e, String(i));
		} catch {}
	}, [e, i]), [i, a];
}
//#endregion
//#region ../../src/ui/StartPage.tsx
var Kr = "kubuno.startpage.recentW", qr = 180, Jr = 520, Yr = 256;
function Xr({ recentTitle: e = "Récents", recentIcon: t, recentItems: n, recentEmpty: r, tabs: i, defaultTab: a, activeTab: o, onTabChange: s }) {
	let [c, l] = m(a ?? i[0]?.id ?? ""), u = o ?? c, [d, f] = Gr(Kr, Yr, qr, Jr), p = (e) => {
		s?.(e), o === void 0 && l(e);
	}, h = i.map((e) => ({
		id: e.id,
		label: e.label
	})), y = i.find((e) => e.id === u) ?? i[0], [b, x] = m(null), S = (e, t) => {
		!t.actions || t.actions.length === 0 || (e.preventDefault(), x({
			x: Math.min(e.clientX, window.innerWidth - 200),
			y: Math.min(e.clientY, window.innerHeight - (t.actions.length * 36 + 16)),
			actions: t.actions
		}));
	};
	return /* @__PURE__ */ v("div", {
		className: "relative flex h-full overflow-hidden bg-white",
		children: [
			/* @__PURE__ */ v("aside", {
				className: "hidden lg:flex flex-shrink-0 bg-surface-1 flex-col overflow-hidden",
				style: { width: d },
				children: [/* @__PURE__ */ v("div", {
					className: "px-4 h-[57px] flex items-center gap-2 border-b border-border flex-shrink-0",
					children: [/* @__PURE__ */ _("span", {
						className: "text-text-tertiary flex-shrink-0",
						children: t ?? /* @__PURE__ */ _(ee, { size: 15 })
					}), /* @__PURE__ */ _("span", {
						className: "text-sm font-medium text-text-primary",
						children: e
					})]
				}), n.length === 0 ? /* @__PURE__ */ _("div", {
					className: "flex-1 flex items-center justify-center px-4 text-center",
					children: r ?? /* @__PURE__ */ _("p", {
						className: "text-text-tertiary text-xs",
						children: "—"
					})
				}) : /* @__PURE__ */ _("div", {
					className: "flex-1 overflow-y-auto py-1",
					children: n.map((e) => /* @__PURE__ */ v("button", {
						onClick: e.onClick,
						onContextMenu: (t) => S(t, e),
						className: `w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${e.pendingTone ? "pointer-events-none" : "hover:bg-surface-2"}`,
						style: e.pendingTone ? { backgroundColor: e.pendingTone === "permanent" ? "#fee2e2" : "#f3e8ff" } : void 0,
						children: [e.icon && /* @__PURE__ */ _("span", {
							className: "flex-shrink-0",
							children: e.icon
						}), /* @__PURE__ */ v("span", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ _("span", {
								className: "block text-sm text-text-primary truncate",
								title: e.name,
								children: e.name
							}), e.subtitle && /* @__PURE__ */ _("span", {
								className: "block text-[11px] text-text-tertiary",
								children: e.subtitle
							})]
						})]
					}, e.id))
				})]
			}),
			/* @__PURE__ */ _("div", {
				className: "hidden lg:block",
				children: /* @__PURE__ */ _(Wr, {
					position: d,
					onResize: f,
					min: qr,
					max: Jr,
					onReset: () => f(Yr),
					title: e
				})
			}),
			/* @__PURE__ */ v("div", {
				className: "flex-1 min-w-0 flex flex-col overflow-hidden",
				children: [/* @__PURE__ */ _("div", {
					className: "px-6 h-[57px] flex items-center flex-shrink-0 border-b border-border",
					children: /* @__PURE__ */ _(Hr, {
						tabs: h,
						value: u,
						onChange: p
					})
				}), /* @__PURE__ */ _("div", {
					className: "flex-1 min-h-0 overflow-hidden flex flex-col",
					children: y?.content
				})]
			}),
			b && /* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("div", {
				className: "fixed inset-0 z-[9998]",
				onClick: () => x(null),
				onContextMenu: (e) => {
					e.preventDefault(), x(null);
				}
			}), /* @__PURE__ */ _("div", {
				className: "fixed z-[9999] min-w-[190px] bg-white border border-border rounded-lg shadow-lg py-1",
				style: {
					top: b.y,
					left: b.x
				},
				children: b.actions.map((e) => /* @__PURE__ */ v("button", {
					onClick: () => {
						x(null), e.onClick();
					},
					className: `w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                  ${e.danger ? "text-danger hover:bg-danger/10" : "text-text-primary hover:bg-surface-1"}`,
					children: [e.icon && /* @__PURE__ */ _("span", {
						className: "flex-shrink-0",
						children: e.icon
					}), e.label]
				}, e.id))
			})] })
		]
	});
}
//#endregion
//#region ../../src/ui/KubunoLogo.tsx
function Zr({ size: e = 24, className: t, title: n = "Kubuno" }) {
	return /* @__PURE__ */ v("svg", {
		width: Math.round(e * 321 / 346),
		height: e,
		viewBox: "0 0 321 346",
		fill: "currentColor",
		role: "img",
		"aria-label": n,
		className: t,
		children: [/* @__PURE__ */ _("title", { children: n }), /* @__PURE__ */ v("g", {
			transform: "translate(0,346) scale(0.1,-0.1)",
			stroke: "none",
			children: [
				/* @__PURE__ */ _("path", { d: "M264 3307 c-3 -8 -3 -434 -1 -948 3 -913 3 -936 24 -1009 70 -249 198 -454 419 -672 125 -123 303 -268 328 -268 3 0 5 654 4 1452 l-3 1453 -383 3 c-313 2 -383 0 -388 -11z" }),
				/* @__PURE__ */ _("path", { d: "M1187 3313 c-4 -3 -7 -680 -7 -1504 l0 -1498 27 -19 c38 -27 279 -165 354 -202 l61 -31 61 32 c34 17 87 47 118 65 31 19 60 34 64 34 3 0 26 14 51 30 l44 31 0 729 c0 608 2 731 14 742 7 7 112 110 233 228 120 118 343 336 496 484 l277 269 -2 306 -3 306 -204 3 -203 2 -87 -83 c-47 -47 -151 -147 -231 -225 l-145 -140 -5 -299 -5 -299 -60 -62 c-32 -34 -63 -62 -67 -62 -4 0 -9 262 -10 583 l-3 582 -381 3 c-209 1 -383 -1 -387 -5z" }),
				/* @__PURE__ */ _("path", { d: "M2217 1782 l-118 -117 1 -265 2 -265 225 -225 224 -225 61 64 c133 140 264 349 319 508 l20 58 -143 138 c-294 284 -459 442 -466 444 -4 1 -60 -51 -125 -115z" })
			]
		})]
	});
}
//#endregion
//#region ../../src/ui/LabelIcon.tsx
var Qr = 596.432 / 363.452;
function $r({ size: e = 24, className: t, style: n, title: r }) {
	return /* @__PURE__ */ v("svg", {
		width: Math.round(e * Qr * 100) / 100,
		height: e,
		viewBox: "767.938 486.862 596.432 363.452",
		fill: "currentColor",
		fillRule: "evenodd",
		role: r ? "img" : "presentation",
		"aria-label": r,
		"aria-hidden": r ? void 0 : !0,
		className: t,
		style: n,
		children: [r ? /* @__PURE__ */ _("title", { children: r }) : null, /* @__PURE__ */ _("path", { d: "M 768.043 532.379 C 768.038 531.247 768.032 530.114 768.022 528.982 C 768.092 516.215 773.502 503.855 782.953 495.248 C 790.446 490.278 799.172 486.948 808.246 486.943 C 933.616 486.943 1058.987 487.154 1184.356 486.862 C 1204.994 486.939 1226 494.556 1239.253 510.908 C 1278.229 553.311 1313.462 599.023 1353.231 640.714 C 1362.194 650.714 1366.005 664.389 1363.723 677.601 C 1361.66 684.459 1358.251 690.999 1353.193 696.128 C 1316.095 738.242 1277.805 779.332 1242.223 822.758 C 1227.039 841.321 1203.692 850.288 1180.063 850.239 C 1057.966 850.239 935.868 850.03 813.771 850.315 C 799.369 850.259 784.332 845.812 775.393 833.828 C 771.05 826.781 768.313 818.676 768.303 810.349 C 767.818 717.693 767.914 625.036 768.043 532.379 Z M 1276.456 668.588 A 41.516 41.516 0 1 1 1193.425 668.588 A 41.516 41.516 0 1 1 1276.456 668.588 Z" })]
	});
}
//#endregion
//#region ../../src/ui/color.ts
function ei(e) {
	return [
		parseInt(e.slice(1, 3), 16),
		parseInt(e.slice(3, 5), 16),
		parseInt(e.slice(5, 7), 16)
	];
}
function ti(e, t, n) {
	return "#" + [
		e,
		t,
		n
	].map((e) => Math.max(0, Math.min(255, Math.round(e))).toString(16).padStart(2, "0")).join("");
}
function ni(e, t, n) {
	e /= 255, t /= 255, n /= 255;
	let r = Math.max(e, t, n), i = Math.min(e, t, n), a = (r + i) / 2, o = 0, s = 0;
	if (r !== i) {
		let c = r - i;
		s = a > .5 ? c / (2 - r - i) : c / (r + i), o = r === e ? (t - n) / c + (t < n ? 6 : 0) : r === t ? (n - e) / c + 2 : (e - t) / c + 4, o *= 60;
	}
	return [
		o,
		s,
		a
	];
}
function ri(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function ii(e, t, n) {
	if (e = (e % 360 + 360) % 360 / 360, t === 0) {
		let e = n * 255;
		return [
			e,
			e,
			e
		];
	}
	let r = n < .5 ? n * (1 + t) : n + t - n * t, i = 2 * n - r;
	return [
		ri(i, r, e + 1 / 3) * 255,
		ri(i, r, e) * 255,
		ri(i, r, e - 1 / 3) * 255
	];
}
function ai(e, t, n) {
	e /= 255, t /= 255, n /= 255;
	let r = Math.max(e, t, n), i = r - Math.min(e, t, n), a = 0;
	i !== 0 && (a = r === e ? (t - n) / i % 6 : r === t ? (n - e) / i + 2 : (e - t) / i + 4, a *= 60, a < 0 && (a += 360));
	let o = r === 0 ? 0 : i / r;
	return [
		a,
		o,
		r
	];
}
function oi(e, t, n) {
	e = (e % 360 + 360) % 360;
	let r = n * t, i = r * (1 - Math.abs(e / 60 % 2 - 1)), a = n - r, o = 0, s = 0, c = 0;
	return e < 60 ? (o = r, s = i) : e < 120 ? (o = i, s = r) : e < 180 ? (s = r, c = i) : e < 240 ? (s = i, c = r) : e < 300 ? (o = i, c = r) : (o = r, c = i), [
		(o + a) * 255,
		(s + a) * 255,
		(c + a) * 255
	];
}
function si(e, t, n) {
	let r = e / 255, i = t / 255, a = n / 255, o = 1 - Math.max(r, i, a);
	if (o >= 1) return [
		0,
		0,
		0,
		100
	];
	let s = (1 - r - o) / (1 - o), c = (1 - i - o) / (1 - o), l = (1 - a - o) / (1 - o);
	return [
		s * 100,
		c * 100,
		l * 100,
		o * 100
	];
}
function ci(e, t, n, r) {
	return e /= 100, t /= 100, n /= 100, r /= 100, [
		255 * (1 - e) * (1 - r),
		255 * (1 - t) * (1 - r),
		255 * (1 - n) * (1 - r)
	];
}
//#endregion
//#region ../../src/ui/ColorPicker.tsx
var li = {
	accent: "#5a9bdc",
	border: "#212121",
	text: "#d6d6d6",
	textDim: "#8e8e8e",
	toolbar: "#393939",
	surface: "#252525",
	title: "#c0c0c0"
}, ui = {
	accent: "#1a73e8",
	border: "#dadce0",
	text: "#202124",
	textDim: "#5f6368",
	toolbar: "#ffffff",
	surface: "#f1f3f4",
	title: "#5f6368"
};
function di(e, t) {
	return typeof window > "u" ? t : getComputedStyle(document.documentElement).getPropertyValue(e).trim() || t;
}
function fi() {
	return {
		accent: di("--color-primary", "#1a73e8"),
		border: di("--color-border", "#dadce0"),
		text: di("--color-text-primary", "#202124"),
		textDim: di("--color-text-secondary", "#5f6368"),
		toolbar: di("--color-surface-0", "#ffffff"),
		surface: di("--color-surface-2", "#f1f3f4"),
		title: di("--color-text-secondary", "#5f6368")
	};
}
function pi() {
	let [e, t] = m(fi);
	return c(() => {
		let e = new MutationObserver(() => t(fi()));
		return e.observe(document.documentElement, {
			attributes: !0,
			attributeFilter: [
				"style",
				"class",
				"data-theme"
			]
		}), () => e.disconnect();
	}, []), e;
}
var mi = {
	layer_color_picker: "Couleur",
	layer_harmony_comp: "Complémentaire",
	layer_harmony_analog: "Analogues",
	layer_harmony_triad: "Triade",
	layer_harmony_tetrad: "Tétrade",
	layer_harmony_split: "Complémentaires divisées",
	layer_harmony_mono: "Monochrome",
	layer_color_recent: "Récemment utilisées",
	layer_color_eyedropper: "Pipette",
	layer_color_cancel: "Annuler",
	layer_color_confirm: "Ajouter"
};
function hi(e, t, n, r) {
	let i = (e) => [
		(t + e + 360) % 360,
		n,
		r
	];
	switch (e) {
		case "comp": return [i(0), i(180)];
		case "analog": return [
			i(-30),
			i(0),
			i(30)
		];
		case "triad": return [
			i(0),
			i(120),
			i(240)
		];
		case "tetrad": return [
			i(0),
			i(90),
			i(180),
			i(270)
		];
		case "split": return [
			i(0),
			i(150),
			i(210)
		];
		case "mono": return [
			[
				t,
				n,
				Math.max(.2, r * .45)
			],
			[
				t,
				n,
				r
			],
			[
				t,
				Math.max(.12, n * .45),
				Math.min(1, r + .15)
			]
		];
	}
}
var gi = {
	comp: [0, 180],
	analog: [
		-30,
		0,
		30
	],
	triad: [
		0,
		120,
		240
	],
	tetrad: [
		0,
		90,
		180,
		270
	],
	split: [
		0,
		150,
		210
	],
	mono: []
};
function _i({ scheme: e, size: t = 20, color: n = "currentColor" }) {
	let r = t / 2, i = t / 2 - 3, a = Math.max(1.6, t * .095), o = (e === "analog" ? [
		-48,
		0,
		48
	] : gi[e]).map((e) => [r + i * Math.sin(e * Math.PI / 180), r - i * Math.cos(e * Math.PI / 180)]), s = o.map(([e, t]) => `${e.toFixed(1)},${t.toFixed(1)}`).join(" ");
	return /* @__PURE__ */ v("svg", {
		width: t,
		height: t,
		viewBox: `0 0 ${t} ${t}`,
		fill: "none",
		strokeLinejoin: "round",
		strokeLinecap: "round",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ _("circle", {
			cx: r,
			cy: r,
			r: i,
			stroke: n,
			strokeOpacity: .3,
			strokeWidth: 1
		}), e === "mono" ? /* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("line", {
			x1: r,
			y1: r + i,
			x2: r,
			y2: r - i,
			stroke: n,
			strokeOpacity: .45,
			strokeWidth: 1.2
		}), [
			-1,
			-.33,
			.33,
			1
		].map((e, t) => /* @__PURE__ */ _("circle", {
			cx: r,
			cy: r - i * e,
			r: t === 3 ? a * 1.25 : a,
			fill: n,
			fillOpacity: .45 + .18 * (t + 1)
		}, t))] }) : /* @__PURE__ */ v(g, { children: [o.length === 2 ? /* @__PURE__ */ _("line", {
			x1: o[0][0],
			y1: o[0][1],
			x2: o[1][0],
			y2: o[1][1],
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2
		}) : e === "analog" ? /* @__PURE__ */ _("path", {
			d: `M${o[0][0].toFixed(1)},${o[0][1].toFixed(1)} A${i},${i} 0 0 1 ${o[2][0].toFixed(1)},${o[2][1].toFixed(1)}`,
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2,
			fill: "none"
		}) : /* @__PURE__ */ _("polygon", {
			points: s,
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2,
			fill: n,
			fillOpacity: .14
		}), o.map(([e, t], r) => /* @__PURE__ */ _("circle", {
			cx: e,
			cy: t,
			r: r === 0 ? a * 1.3 : a,
			fill: n
		}, r))] })]
	});
}
function vi({ size: e, h: t, s: n, v: r, shape: i, onChange: a }) {
	let o = p(null), s = p(!1), l = e / 2 - 1, u = e / 2, d = e / 2, f = .8660254, m = {
		w: [u, d - l],
		blk: [u - l * f, d + l * .5],
		hue: [u + l * f, d + l * .5]
	}, h = (e, t, n, r, i) => {
		let a = (r[1] - i[1]) * (n[0] - i[0]) + (i[0] - r[0]) * (n[1] - i[1]), o = ((r[1] - i[1]) * (e - i[0]) + (i[0] - r[0]) * (t - i[1])) / a, s = ((i[1] - n[1]) * (e - i[0]) + (n[0] - i[0]) * (t - i[1])) / a;
		return [
			o,
			s,
			1 - o - s
		];
	}, g = () => {
		if (i === "triangle") {
			let e = 1 - r, t = n * r, i = (1 - n) * r;
			return [i * m.w[0] + t * m.hue[0] + e * m.blk[0], i * m.w[1] + t * m.hue[1] + e * m.blk[1]];
		}
		let t = n * e, a = (1 - r) * e;
		if (i === "circle") {
			let n = e / 2, r = e / 2, i = e / 2, o = t - n, s = a - r, c = Math.hypot(o, s);
			c > i && (o *= i / c, s *= i / c, t = n + o, a = r + s);
		}
		return [t, a];
	};
	c(() => {
		let n = o.current;
		if (!n) return;
		let r = n.getContext("2d"), a = Math.round(e * 3);
		n.width = a, n.height = a;
		let s = r.createImageData(a, a), c = s.data, l = a / 2, u = [m.w[0] * 3, m.w[1] * 3], d = [m.hue[0] * 3, m.hue[1] * 3], f = [m.blk[0] * 3, m.blk[1] * 3];
		for (let e = 0; e < a; e++) for (let n = 0; n < a; n++) {
			let r = 0, o = 0, s = !0;
			if (i === "triangle") {
				let [t, i, a] = h(n + .5, e + .5, u, d, f);
				t < 0 || i < 0 || a < 0 ? s = !1 : (o = 1 - a, r = t + i > 0 ? i / (t + i) : 0);
			} else if (i === "circle") {
				let t = n - l, i = e - l;
				Math.hypot(t, i) > l ? s = !1 : (r = n / a, o = 1 - e / a);
			} else r = n / a, o = 1 - e / a;
			let p = (e * a + n) * 4;
			if (!s) {
				c[p + 3] = 0;
				continue;
			}
			let [m, g, _] = oi(t, r, o);
			c[p] = m, c[p + 1] = g, c[p + 2] = _, c[p + 3] = 255;
		}
		r.putImageData(s, 0, 0);
	}, [
		t,
		i,
		e
	]);
	let y = (t) => {
		let n = o.current;
		if (!n) return;
		let r = n.getBoundingClientRect(), s = t.clientX - r.left, c = t.clientY - r.top;
		if (i === "triangle") {
			let [e, t, n] = h(s, c, m.w, m.hue, m.blk);
			e = Math.max(0, e), t = Math.max(0, t), n = Math.max(0, n);
			let r = e + t + n || 1;
			e /= r, t /= r, n /= r;
			let i = 1 - n;
			a(e + t > 0 ? t / (e + t) : 0, i);
			return;
		}
		if (i === "circle") {
			let t = e / 2, n = e / 2, r = e / 2, i = s - t, a = c - n, o = Math.hypot(i, a);
			o > r && (s = t + i * r / o, c = n + a * r / o);
		}
		a(Math.max(0, Math.min(1, s / e)), Math.max(0, Math.min(1, 1 - c / e)));
	};
	c(() => {
		let e = (e) => {
			s.current && y(e);
		}, t = () => {
			s.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let [b, x] = g();
	return /* @__PURE__ */ v("div", {
		className: "absolute",
		style: {
			left: (212 - e) / 2,
			top: (212 - e) / 2,
			width: e,
			height: e
		},
		children: [/* @__PURE__ */ _("canvas", {
			ref: o,
			tabIndex: 0,
			role: "slider",
			"aria-label": "Saturation / valeur",
			"aria-valuetext": `S ${Math.round(n * 100)}%, V ${Math.round(r * 100)}%`,
			onPointerDown: (e) => {
				s.current = !0, y(e);
			},
			onKeyDown: (e) => {
				let t = e.shiftKey ? .1 : .02, i = (e) => Math.max(0, Math.min(1, e));
				if (e.key === "ArrowLeft") a(i(n - t), r);
				else if (e.key === "ArrowRight") a(i(n + t), r);
				else if (e.key === "ArrowUp") a(n, i(r + t));
				else if (e.key === "ArrowDown") a(n, i(r - t));
				else return;
				e.preventDefault();
			},
			className: "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
			style: {
				width: e,
				height: e,
				cursor: "crosshair",
				borderRadius: i === "circle" ? "50%" : 2
			}
		}), /* @__PURE__ */ _("div", {
			className: "absolute rounded-full pointer-events-none",
			style: {
				width: 11,
				height: 11,
				border: "2px solid #fff",
				boxShadow: "0 0 0 1px rgba(0,0,0,.5)",
				left: b - 5.5,
				top: x - 5.5
			}
		})]
	});
}
function yi({ label: e, value: t, max: n, track: r, onInput: i, C: a }) {
	let o = p(null), s = p(!1), l = (e) => {
		let t = o.current;
		if (!t) return;
		let r = t.getBoundingClientRect();
		i(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * n);
	};
	return c(() => {
		let e = (e) => {
			s.current && l(e);
		}, t = () => {
			s.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	}), /* @__PURE__ */ v("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ _("span", {
				className: "text-[10px] w-3 text-center",
				style: { color: a.textDim },
				children: e
			}),
			/* @__PURE__ */ _("div", {
				ref: o,
				tabIndex: 0,
				role: "slider",
				"aria-label": e,
				"aria-valuemin": 0,
				"aria-valuemax": Math.round(n),
				"aria-valuenow": Math.round(t),
				onPointerDown: (e) => {
					s.current = !0, l(e);
				},
				onKeyDown: (e) => {
					let r = e.shiftKey ? 10 : 1;
					if (e.key === "ArrowLeft" || e.key === "ArrowDown") i(Math.max(0, t - r));
					else if (e.key === "ArrowRight" || e.key === "ArrowUp") i(Math.min(n, t + r));
					else return;
					e.preventDefault();
				},
				className: "relative flex-1 h-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
				style: {
					background: r,
					border: `1px solid ${a.border}`,
					borderRadius: 2
				},
				children: /* @__PURE__ */ _("div", {
					className: "absolute top-[-2px] bottom-[-2px] pointer-events-none",
					style: {
						width: 3,
						background: "#fff",
						boxShadow: "0 0 0 1px rgba(0,0,0,.6)",
						left: `calc(${t / n * 100}% - 1.5px)`,
						borderRadius: 2
					}
				})
			}),
			/* @__PURE__ */ _("input", {
				type: "number",
				min: 0,
				max: Math.round(n),
				value: Math.round(t),
				onChange: (e) => i(Math.max(0, Math.min(n, +e.target.value))),
				className: "w-11 h-5 text-[10px] text-center outline-none",
				style: {
					background: a.surface,
					color: a.text,
					border: `1px solid ${a.border}`,
					borderRadius: 2
				}
			})
		]
	});
}
function bi({ t: e, color: t, onChange: n, onClose: r, C: i = li, history: a = [], onPickHistory: o, onConfirm: s, onCancel: l, confirmLabel: u, cancelLabel: d, leftTools: f = [] }) {
	let h = {
		...li,
		...i
	}, g = (t) => e ? e(t) : mi[t] ?? t, [y, b, x] = ei(t), [S, C, w] = ai(y, b, x), [T, E] = m(S), [D, O] = m(C), [k, A] = m(w), [j, M] = m("RGB"), [N, P] = m("square"), [F, ee] = m("comp");
	c(() => {
		let [e, n, r] = ei(t);
		if (ti(...oi(T, D, k)).toLowerCase() !== t.toLowerCase()) {
			let [t, i, a] = ai(e, n, r);
			E(t), O(i), A(a);
		}
	}, [t]);
	let L = (e, t, r) => {
		E(e), O(t), A(r), n(ti(...oi(e, t, r)));
	}, R = (e, t, n) => {
		let [r, i, a] = ai(e, t, n);
		L(r, i, a);
	}, z = typeof window < "u" && "EyeDropper" in window, B = async () => {
		let e = window.EyeDropper;
		if (e) try {
			let [t, n, r] = ei((await new e().open()).sRGBHex);
			R(t, n, r);
		} catch {}
	}, V = p(null), H = p(!1), U = (e) => {
		let t = V.current;
		if (!t) return;
		let n = t.getBoundingClientRect(), r = e.clientX - n.left - n.width / 2, i = e.clientY - n.top - n.height / 2, a = Math.atan2(r, -i) * 180 / Math.PI;
		a = (a + 360) % 360, L(a, D, k);
	};
	c(() => {
		let e = (e) => {
			H.current && U(e);
		}, t = () => {
			H.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let [W, G, K] = oi(T, D, k).map(Math.round), te = ti(...oi(T, 1, 1)), q = ti(W, G, K), ne = T * Math.PI / 180, ie = 212 / 2 + 95 * Math.sin(ne), ae = 212 / 2 - 95 * Math.cos(ne), oe = Math.round(156 / Math.SQRT2), se = N === "square" ? oe : 162, J = hi(F, T, D, k), Y = (e, t, n) => ti(Math.round(e), Math.round(t), Math.round(n)), le = [];
	if (j === "RGB") le = [
		{
			l: "R",
			val: W,
			max: 255,
			track: `linear-gradient(to right,${Y(0, G, K)},${Y(255, G, K)})`,
			set: (e) => R(e, G, K)
		},
		{
			l: "G",
			val: G,
			max: 255,
			track: `linear-gradient(to right,${Y(W, 0, K)},${Y(W, 255, K)})`,
			set: (e) => R(W, e, K)
		},
		{
			l: "B",
			val: K,
			max: 255,
			track: `linear-gradient(to right,${Y(W, G, 0)},${Y(W, G, 255)})`,
			set: (e) => R(W, G, e)
		}
	];
	else if (j === "HSV") le = [
		{
			l: "H",
			val: T,
			max: 360,
			track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
			set: (e) => L(e, D, k)
		},
		{
			l: "S",
			val: D * 100,
			max: 100,
			track: `linear-gradient(to right,${Y(...oi(T, 0, k))},${Y(...oi(T, 1, k))})`,
			set: (e) => L(T, e / 100, k)
		},
		{
			l: "V",
			val: k * 100,
			max: 100,
			track: `linear-gradient(to right,#000,${Y(...oi(T, D, 1))})`,
			set: (e) => L(T, D, e / 100)
		}
	];
	else if (j === "HSL") {
		let [e, t, n] = ni(W, G, K);
		le = [
			{
				l: "H",
				val: e,
				max: 360,
				track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
				set: (e) => R(...ii(e, t, n))
			},
			{
				l: "S",
				val: t * 100,
				max: 100,
				track: `linear-gradient(to right,${Y(...ii(e, 0, n))},${Y(...ii(e, 1, n))})`,
				set: (t) => R(...ii(e, t / 100, n))
			},
			{
				l: "L",
				val: n * 100,
				max: 100,
				track: `linear-gradient(to right,#000,${Y(...ii(e, t, .5))},#fff)`,
				set: (n) => R(...ii(e, t, n / 100))
			}
		];
	} else if (j === "CMYK") {
		let [e, t, n, r] = si(W, G, K);
		le = [
			{
				l: "C",
				val: e,
				max: 100,
				track: `linear-gradient(to right,${Y(...ci(0, t, n, r))},${Y(...ci(100, t, n, r))})`,
				set: (e) => R(...ci(e, t, n, r))
			},
			{
				l: "M",
				val: t,
				max: 100,
				track: `linear-gradient(to right,${Y(...ci(e, 0, n, r))},${Y(...ci(e, 100, n, r))})`,
				set: (t) => R(...ci(e, t, n, r))
			},
			{
				l: "Y",
				val: n,
				max: 100,
				track: `linear-gradient(to right,${Y(...ci(e, t, 0, r))},${Y(...ci(e, t, 100, r))})`,
				set: (n) => R(...ci(e, t, n, r))
			},
			{
				l: "K",
				val: r,
				max: 100,
				track: `linear-gradient(to right,${Y(...ci(e, t, n, 0))},#000)`,
				set: (r) => R(...ci(e, t, n, r))
			}
		];
	} else le = [{
		l: "K",
		val: Math.round((W + G + K) / 3) / 255 * 100,
		max: 100,
		track: "linear-gradient(to right,#000,#fff)",
		set: (e) => {
			let t = Math.round(e / 100 * 255);
			R(t, t, t);
		}
	}];
	return /* @__PURE__ */ v("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 312,
			background: h.toolbar,
			border: `1px solid ${h.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ v("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ _("span", {
					className: "text-[10px] font-medium",
					style: { color: h.title },
					children: g("layer_color_picker")
				}), /* @__PURE__ */ _("button", {
					onClick: r,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: h.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ v("div", {
				className: "flex items-start gap-1.5 justify-center",
				children: [
					/* @__PURE__ */ v("div", {
						className: "flex flex-col gap-1",
						style: { height: 212 },
						children: [
							[
								"square",
								"triangle",
								"circle"
							].map((e) => {
								let t = N === e;
								return /* @__PURE__ */ _("button", {
									onClick: () => P(e),
									title: e,
									"aria-pressed": t,
									className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
									style: {
										background: t ? h.accent : h.surface,
										color: t ? "#fff" : h.textDim,
										border: `1px solid ${t ? h.accent : h.border}`
									},
									children: _(e === "square" ? ce : e === "triangle" ? de : I, { size: 15 })
								}, e);
							}),
							z && /* @__PURE__ */ _("button", {
								onClick: B,
								title: g("layer_color_eyedropper"),
								"aria-label": g("layer_color_eyedropper"),
								className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
								style: {
									background: h.surface,
									color: h.textDim,
									border: `1px solid ${h.border}`
								},
								onMouseEnter: (e) => {
									e.currentTarget.style.color = h.accent, e.currentTarget.style.borderColor = h.accent;
								},
								onMouseLeave: (e) => {
									e.currentTarget.style.color = h.textDim, e.currentTarget.style.borderColor = h.border;
								},
								children: /* @__PURE__ */ _(re, { size: 14 })
							}),
							f.map((e) => /* @__PURE__ */ _("button", {
								onClick: e.onClick,
								title: e.title,
								"aria-label": e.title,
								"aria-pressed": e.active ?? void 0,
								className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
								style: {
									background: e.active ? h.accent : h.surface,
									color: e.active ? "#fff" : h.textDim,
									border: `1px solid ${e.active ? h.accent : h.border}`
								},
								children: e.icon
							}, e.id))
						]
					}),
					/* @__PURE__ */ v("div", {
						className: "relative",
						style: {
							width: 212,
							height: 212
						},
						children: [
							/* @__PURE__ */ _("div", {
								ref: V,
								tabIndex: 0,
								role: "slider",
								"aria-label": g("layer_color_picker"),
								"aria-valuemin": 0,
								"aria-valuemax": 360,
								"aria-valuenow": Math.round(T),
								onPointerDown: (e) => {
									H.current = !0, U(e);
								},
								onKeyDown: (e) => {
									let t = e.shiftKey ? 10 : 1;
									if (e.key === "ArrowLeft" || e.key === "ArrowDown") L((T - t + 360) % 360, D, k);
									else if (e.key === "ArrowRight" || e.key === "ArrowUp") L((T + t) % 360, D, k);
									else return;
									e.preventDefault();
								},
								className: "absolute inset-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
								style: { background: "conic-gradient(#f00 0deg,#ff0 60deg,#0f0 120deg,#0ff 180deg,#00f 240deg,#f0f 300deg,#f00 360deg)" }
							}),
							/* @__PURE__ */ _("div", {
								className: "absolute rounded-full",
								style: {
									inset: 22,
									background: h.toolbar
								}
							}),
							/* @__PURE__ */ _("div", {
								className: "absolute rounded-full pointer-events-none",
								style: {
									width: 14,
									height: 14,
									border: "2px solid #fff",
									boxShadow: "0 0 0 1px rgba(0,0,0,.6)",
									background: te,
									left: ie - 7,
									top: ae - 7
								}
							}),
							J.slice(1).map((e, t) => {
								let n = e[0] * Math.PI / 180, r = 212 / 2 + 95 * Math.sin(n), i = 212 / 2 - 95 * Math.cos(n);
								return /* @__PURE__ */ _("div", {
									className: "absolute rounded-full pointer-events-none",
									style: {
										width: 10,
										height: 10,
										border: "2px solid rgba(255,255,255,.85)",
										background: ti(...oi(e[0], e[1], e[2])),
										left: r - 5,
										top: i - 5
									}
								}, t);
							}),
							/* @__PURE__ */ _(vi, {
								size: se,
								h: T,
								s: D,
								v: k,
								shape: N,
								onChange: (e, t) => L(T, e, t)
							})
						]
					}),
					/* @__PURE__ */ _("div", {
						className: "flex flex-col gap-1 justify-between",
						style: { height: 212 },
						children: [
							{
								key: "comp",
								label: "layer_harmony_comp"
							},
							{
								key: "analog",
								label: "layer_harmony_analog"
							},
							{
								key: "triad",
								label: "layer_harmony_triad"
							},
							{
								key: "tetrad",
								label: "layer_harmony_tetrad"
							},
							{
								key: "split",
								label: "layer_harmony_split"
							},
							{
								key: "mono",
								label: "layer_harmony_mono"
							}
						].map((e) => {
							let t = F === e.key;
							return /* @__PURE__ */ _("button", {
								onClick: () => ee(e.key),
								title: g(e.label),
								"aria-label": g(e.label),
								"aria-pressed": t,
								className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
								style: {
									background: t ? h.accent : h.surface,
									color: t ? "#fff" : h.textDim,
									border: `1px solid ${t ? h.accent : h.border}`
								},
								children: /* @__PURE__ */ _(_i, {
									scheme: e.key,
									size: 20
								})
							}, e.key);
						})
					})
				]
			}),
			/* @__PURE__ */ _("div", {
				className: "flex gap-1 mt-2.5",
				children: J.map((e, t) => {
					let n = ti(...oi(e[0], e[1], e[2]));
					return /* @__PURE__ */ _("button", {
						onClick: () => L(e[0], e[1], e[2]),
						title: n,
						className: "flex-1 h-6",
						style: {
							background: n,
							borderRadius: 3,
							border: `1px solid ${h.border}`
						}
					}, t);
				})
			}),
			/* @__PURE__ */ v("div", {
				className: "flex items-center gap-2 mt-2",
				children: [
					/* @__PURE__ */ _("div", { style: {
						width: 28,
						height: 24,
						background: q,
						border: `1px solid ${h.border}`,
						borderRadius: 2,
						flexShrink: 0
					} }),
					/* @__PURE__ */ _("span", {
						className: "text-[10px]",
						style: { color: h.textDim },
						children: "#"
					}),
					/* @__PURE__ */ _("input", {
						value: q.replace("#", "").toUpperCase(),
						onChange: (e) => {
							let t = e.target.value.trim().replace(/^#/, "");
							if (/^[0-9a-fA-F]{3}$/.test(t) && (t = t.split("").map((e) => e + e).join("")), /^[0-9a-fA-F]{6}$/.test(t)) {
								let [e, n, r] = ei("#" + t);
								R(e, n, r);
							}
						},
						className: "flex-1 h-6 text-[11px] px-2 outline-none font-mono uppercase",
						style: {
							background: h.surface,
							border: `1px solid ${h.border}`,
							color: h.text,
							borderRadius: 2
						}
					})
				]
			}),
			/* @__PURE__ */ _("div", {
				className: "flex mt-2.5 mb-1.5",
				style: { borderBottom: `1px solid ${h.border}` },
				children: [
					"RGB",
					"HSV",
					"HSL",
					"CMYK",
					"GRAY"
				].map((e) => /* @__PURE__ */ _("button", {
					onClick: () => M(e),
					className: "px-1.5 py-0.5 text-[10px] font-medium",
					style: {
						color: j === e ? h.accent : h.textDim,
						borderBottom: j === e ? `2px solid ${h.accent}` : "2px solid transparent"
					},
					children: e
				}, e))
			}),
			/* @__PURE__ */ _("div", {
				className: "space-y-1.5",
				children: le.map((e) => /* @__PURE__ */ _(yi, {
					label: e.l,
					value: e.val,
					max: e.max,
					track: e.track,
					onInput: e.set,
					C: h
				}, e.l))
			}),
			/* @__PURE__ */ _("div", {
				className: "flex flex-wrap gap-1 mt-2.5",
				children: [
					"#000000",
					"#ffffff",
					"#e84a4a",
					"#f9ab00",
					"#f4d03f",
					"#1e8e3e",
					"#16a085",
					"#4a90e8",
					"#2c3e50",
					"#9b51e0",
					"#ff7eb6",
					"#7f8c8d"
				].map((e) => /* @__PURE__ */ _("button", {
					onClick: () => {
						let [t, n, r] = ei(e);
						R(t, n, r);
					},
					title: e,
					style: {
						width: 16,
						height: 16,
						background: e,
						borderRadius: 2,
						border: `1px solid ${e.toLowerCase() === q.toLowerCase() ? h.accent : h.border}`
					}
				}, e))
			}),
			a.length > 0 && /* @__PURE__ */ v("div", {
				className: "mt-3 pt-2",
				style: { borderTop: `1px solid ${h.border}` },
				children: [/* @__PURE__ */ _("div", {
					className: "text-[10px] uppercase tracking-wide mb-1.5",
					style: { color: h.textDim },
					children: g("layer_color_recent")
				}), /* @__PURE__ */ _("div", {
					className: "grid gap-1",
					style: { gridTemplateColumns: "repeat(10, 1fr)" },
					children: a.slice(0, 30).map((e, t) => /* @__PURE__ */ _("button", {
						title: e,
						onClick: () => {
							let [t, n, r] = ei(e);
							R(t, n, r), o?.(e);
						},
						className: "aspect-square transition-transform hover:scale-110",
						style: {
							background: e,
							borderRadius: 3,
							border: `1px solid ${e.toLowerCase() === q.toLowerCase() ? h.accent : h.border}`,
							boxShadow: e.toLowerCase() === q.toLowerCase() ? `0 0 0 1px ${h.accent}` : "none"
						}
					}, e + t))
				})]
			}),
			(s || l) && /* @__PURE__ */ v("div", {
				className: "flex items-center justify-end gap-2 mt-3 pt-2.5",
				style: { borderTop: `1px solid ${h.border}` },
				children: [l && /* @__PURE__ */ _("button", {
					onClick: l,
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: h.text,
						background: "transparent",
						border: `1px solid ${h.border}`
					},
					children: d ?? g("layer_color_cancel")
				}), s && /* @__PURE__ */ _("button", {
					onClick: () => s(q),
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: "#fff",
						background: h.accent,
						border: `1px solid ${h.accent}`
					},
					children: u ?? g("layer_color_confirm")
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/ColorField.tsx
function xi({ t: e, C: t, color: n, onChange: r, history: i, onPickHistory: a, className: o, style: s, width: l = 32, height: u = 24, leftTools: f }) {
	let h = pi(), y = t ?? h, [b, x] = m(!1), S = p(null), C = p(null), [w, T] = m(null), E = () => {
		let e = S.current, t = C.current;
		if (!e || !t) return;
		let n = e.getBoundingClientRect(), r = t.offsetWidth || 244, i = t.offsetHeight || 480, a = window.innerWidth, o = window.innerHeight, s = n.left - r - 8;
		s < 8 && (s = n.right + 8), s + r > a - 8 && (s = a - r - 8), s < 8 && (s = 8);
		let c = n.top;
		c + i > o - 8 && (c = o - i - 8), c < 8 && (c = 8), T({
			left: s,
			top: c
		});
	};
	return d(() => {
		if (!b) {
			T(null);
			return;
		}
		E();
	}, [b]), c(() => {
		if (!b) return;
		let e = () => E();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [b]), /* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("button", {
		ref: S,
		type: "button",
		onClick: () => x((e) => !e),
		className: o,
		style: {
			width: l,
			height: u,
			background: n,
			border: `1px solid ${b ? y.accent : y.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...s
		}
	}), b && X(/* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => x(!1)
	}), /* @__PURE__ */ _("div", {
		ref: C,
		className: "fixed",
		style: {
			left: w?.left ?? 0,
			top: w?.top ?? 0,
			zIndex: 200,
			visibility: w ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ _(bi, {
			t: e,
			C: y,
			color: n,
			onChange: r,
			onClose: () => x(!1),
			history: i,
			onPickHistory: a,
			leftTools: f
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/ColorSwatchPicker.tsx
var Si = "kubuno:picker:custom-swatches";
function Ci() {
	if (typeof localStorage > "u") return [];
	try {
		let e = JSON.parse(localStorage.getItem(Si) || "[]");
		return Array.isArray(e) ? e.slice(0, 20) : [];
	} catch {
		return [];
	}
}
var wi = /* @__PURE__ */ "#000000.#434343.#666666.#999999.#b7b7b7.#cccccc.#d9d9d9.#efefef.#f3f3f3.#ffffff.#980000.#ff0000.#ff9900.#ffff00.#00ff00.#00ffff.#4a86e8.#0000ff.#9900ff.#ff00ff.#e6b8af.#f4cccc.#fce5cd.#fff2cc.#d9ead3.#d0e0e3.#c9daf8.#cfe2f3.#d9d2e9.#ead1dc.#dd7e6b.#ea9999.#f9cb9c.#ffe599.#b6d7a8.#a2c4c9.#a4c2f4.#9fc5e8.#b4a7d6.#d5a6bd.#cc4125.#e06666.#f6b26b.#ffd966.#93c47d.#76a5af.#6d9eeb.#6fa8dc.#8e7cc3.#c27ba0.#a61c00.#cc0000.#e69138.#f1c232.#6aa84f.#45818e.#3c78d8.#3d85c6.#674ea7.#a64d79.#85200c.#990000.#b45f06.#bf9000.#38761d.#134f5c.#1155cc.#0b5394.#351c75.#741b47.#5b0f00.#660000.#783f04.#7f6000.#274e13.#0c343d.#1c4587.#073763.#20124d.#4c1130".split(".");
function Ti({ color: e, onChange: t, onClose: n, t: r, theme: i, customLabel: a = "Personnalisé", confirmLabel: o, cancelLabel: s }) {
	let c = pi(), l = i ?? c, [u, d] = m(!1), [f, p] = m(e), [h, g] = m(Ci), y = (e) => g((t) => {
		let n = [e, ...t.filter((t) => t.toLowerCase() !== e.toLowerCase())].slice(0, 20);
		try {
			localStorage.setItem(Si, JSON.stringify(n));
		} catch {}
		return n;
	}), b = o ?? (r ? r("color_add", { defaultValue: "Ajouter" }) : "Ajouter"), x = s ?? (r ? r("color_cancel", { defaultValue: "Annuler" }) : "Annuler");
	if (u) return /* @__PURE__ */ _(bi, {
		t: r,
		C: l,
		color: f,
		onChange: p,
		onClose: () => d(!1),
		confirmLabel: b,
		cancelLabel: x,
		onConfirm: (e) => {
			y(e), t(e), d(!1);
		},
		onCancel: () => d(!1)
	});
	let S = () => {
		p(e), d(!0);
	}, C = async () => {
		let e = window.EyeDropper;
		if (e) try {
			let r = await new e().open();
			y(r.sRGBHex), t(r.sRGBHex), n?.();
		} catch {}
	}, w = e.toLowerCase();
	return /* @__PURE__ */ v("div", {
		className: "p-3 rounded-lg shadow-lg border",
		style: {
			width: 232,
			background: l.toolbar,
			borderColor: l.border
		},
		children: [
			/* @__PURE__ */ _("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: wi.map((e) => {
					let r = e.toLowerCase() === w;
					return /* @__PURE__ */ _("button", {
						title: e,
						onMouseDown: (e) => e.preventDefault(),
						onClick: () => {
							t(e), n?.();
						},
						className: "aspect-square rounded-full transition-transform hover:scale-110",
						style: {
							background: e,
							border: e.toLowerCase() === "#ffffff" ? "1px solid #dadce0" : "1px solid rgba(0,0,0,.08)",
							boxShadow: r ? "0 0 0 2px #1a73e8" : "none"
						}
					}, e);
				})
			}),
			/* @__PURE__ */ _("div", {
				className: "mt-3 mb-1 text-[11px] font-semibold uppercase tracking-wide",
				style: { color: l.title },
				children: a
			}),
			/* @__PURE__ */ v("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: [
					h.map((e) => /* @__PURE__ */ _("button", {
						title: e,
						onMouseDown: (e) => e.preventDefault(),
						onClick: () => {
							t(e), n?.();
						},
						className: "aspect-square rounded-full transition-transform hover:scale-110",
						style: {
							background: e,
							border: "1px solid rgba(0,0,0,.08)",
							boxShadow: e.toLowerCase() === w ? "0 0 0 2px #1a73e8" : "none"
						}
					}, e)),
					/* @__PURE__ */ _("button", {
						onClick: S,
						title: a,
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: l.border,
							color: l.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = l.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ _(ie, { size: 12 })
					}),
					typeof window < "u" && "EyeDropper" in window && /* @__PURE__ */ _("button", {
						onClick: C,
						title: "Pipette",
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: l.border,
							color: l.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = l.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ _(re, { size: 11 })
					})
				]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/gradient.ts
function Ei(e, t = 100) {
	let [n, r, i] = ei(e);
	return `rgba(${n}, ${r}, ${i}, ${Math.max(0, Math.min(100, t)) / 100})`;
}
function Di(e) {
	let t = [...e.stops].sort((e, t) => e.position - t.position).map((e) => `${Ei(e.color, e.opacity ?? 100)} ${Math.round(e.position * 100)}%`).join(", ");
	return e.type === "radial" ? `radial-gradient(circle, ${t})` : `linear-gradient(${Math.round(e.angle)}deg, ${t})`;
}
var Oi = {
	type: "linear",
	angle: 90,
	stops: [{
		color: "#4a90d9",
		position: 0,
		opacity: 100
	}, {
		color: "#9b59b6",
		position: 1,
		opacity: 100
	}]
}, ki = {
	gradient_linear: "Linéaire",
	gradient_radial: "Radial",
	gradient_angle: "Angle",
	gradient_position: "Position",
	gradient_opacity: "Opacité",
	gradient_add_stop: "Ajouter un arrêt"
};
function Ai(e, t) {
	let n = [...e].sort((e, t) => e.position - t.position);
	if (t <= n[0].position) return {
		...n[0],
		position: t
	};
	if (t >= n[n.length - 1].position) return {
		...n[n.length - 1],
		position: t
	};
	let r = 0;
	for (; r < n.length - 1 && n[r + 1].position < t;) r++;
	let i = n[r], a = n[r + 1], o = (t - i.position) / (a.position - i.position || 1), [s, c, l] = ei(i.color), [u, d, f] = ei(a.color);
	return {
		color: ti(s + (u - s) * o, c + (d - c) * o, l + (f - l) * o),
		position: t,
		opacity: Math.round(i.opacity + (a.opacity - i.opacity) * o)
	};
}
function ji({ t: e, value: t, onChange: n, onClose: r, C: i }) {
	let a = pi(), o = i ?? a, s = (t) => e ? e(t) : ki[t] ?? t, l = t ?? Oi, [u, d] = m(0), f = p(null), h = p(null), g = [...l.stops].map((e, t) => ({
		s: e,
		i: t
	})).sort((e, t) => e.s.position - t.s.position), y = l.stops[Math.min(u, l.stops.length - 1)] ?? l.stops[0], b = (e) => n({
		...l,
		...e
	}), x = (e, t) => b({ stops: l.stops.map((n, r) => r === e ? {
		...n,
		...t
	} : n) }), S = (e) => {
		let t = f.current;
		if (!t) return 0;
		let n = t.getBoundingClientRect();
		return Math.max(0, Math.min(1, (e - n.left) / n.width));
	};
	c(() => {
		let e = (e) => {
			h.current != null && x(h.current, { position: S(e.clientX) });
		}, t = () => {
			h.current = null;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let C = (e = .5) => {
		let t = Ai(l.stops, e), r = [...l.stops, t];
		n({
			...l,
			stops: r
		}), d(r.length - 1);
	}, w = (e) => {
		l.stops.length <= 2 || (b({ stops: l.stops.filter((t, n) => n !== e) }), d(0));
	}, T = Di(l);
	return /* @__PURE__ */ v("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 260,
			background: o.toolbar,
			border: `1px solid ${o.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ v("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ _("div", {
					className: "flex gap-1",
					children: ["linear", "radial"].map((e) => /* @__PURE__ */ _("button", {
						onClick: () => b({ type: e }),
						className: "px-2 py-0.5 text-[10px] font-medium",
						style: {
							borderRadius: 3,
							background: l.type === e ? o.accent : o.surface ?? "#2c2c2c",
							color: l.type === e ? "#fff" : o.textDim,
							border: `1px solid ${o.border}`
						},
						children: s(e === "linear" ? "gradient_linear" : "gradient_radial")
					}, e))
				}), r && /* @__PURE__ */ _("button", {
					onClick: r,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: o.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ v("div", {
				className: "relative mb-3",
				style: { height: 22 },
				children: [/* @__PURE__ */ _("div", {
					ref: f,
					onPointerDown: (e) => {
						C(S(e.clientX));
					},
					className: "absolute inset-0 cursor-copy",
					style: {
						borderRadius: 3,
						border: `1px solid ${o.border}`,
						backgroundImage: `${T}, repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%)`,
						backgroundSize: "auto, 10px 10px"
					}
				}), g.map(({ s: e, i: t }) => /* @__PURE__ */ _("div", {
					onPointerDown: (e) => {
						e.stopPropagation(), h.current = t, d(t);
					},
					title: `${Math.round(e.position * 100)}%`,
					className: "absolute -bottom-1 cursor-ew-resize",
					style: {
						left: `calc(${e.position * 100}% - 6px)`,
						width: 12,
						height: 12,
						background: e.color,
						borderRadius: 2,
						border: `2px solid ${t === u ? o.accent : "#fff"}`,
						boxShadow: "0 0 0 1px rgba(0,0,0,.5)"
					}
				}, t))]
			}),
			l.type === "linear" && /* @__PURE__ */ v("label", {
				className: "flex items-center gap-2 mb-2",
				children: [
					/* @__PURE__ */ _("span", {
						className: "text-[10px] uppercase flex-shrink-0",
						style: {
							color: o.textDim,
							width: 48
						},
						children: s("gradient_angle")
					}),
					/* @__PURE__ */ _(an, {
						min: 0,
						max: 360,
						className: "flex-1",
						value: l.angle,
						onChange: (e) => b({ angle: e }),
						accent: o.accent,
						trackColor: o.border,
						"aria-label": s("gradient_angle")
					}),
					/* @__PURE__ */ _("input", {
						type: "number",
						min: 0,
						max: 360,
						value: Math.round(l.angle),
						onChange: (e) => b({ angle: Math.max(0, Math.min(360, Number(e.target.value))) }),
						className: "w-14 px-1.5 py-0.5 text-[11px] outline-none",
						style: {
							background: o.surface,
							color: o.text,
							border: `1px solid ${o.border}`,
							borderRadius: 2
						}
					})
				]
			}),
			y && /* @__PURE__ */ v("div", {
				className: "flex flex-col gap-2 pt-2",
				style: { borderTop: `1px solid ${o.border}` },
				children: [/* @__PURE__ */ v("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ _(xi, {
							t: e,
							C: o,
							width: 32,
							height: 24,
							className: "flex-shrink-0",
							color: y.color,
							onChange: (e) => x(l.stops.indexOf(y), { color: e })
						}),
						/* @__PURE__ */ v("label", {
							className: "flex items-center gap-1 flex-1",
							children: [/* @__PURE__ */ _("span", {
								className: "text-[10px] uppercase",
								style: { color: o.textDim },
								children: s("gradient_position")
							}), /* @__PURE__ */ _("input", {
								type: "number",
								min: 0,
								max: 100,
								value: Math.round(y.position * 100),
								onChange: (e) => x(l.stops.indexOf(y), { position: Math.max(0, Math.min(1, Number(e.target.value) / 100)) }),
								className: "w-12 px-1.5 py-0.5 text-[11px] outline-none",
								style: {
									background: o.surface,
									color: o.text,
									border: `1px solid ${o.border}`,
									borderRadius: 2
								}
							})]
						}),
						l.stops.length > 2 && /* @__PURE__ */ _("button", {
							onClick: () => w(l.stops.indexOf(y)),
							title: "",
							style: { color: o.textDim },
							children: /* @__PURE__ */ _(ue, { size: 13 })
						})
					]
				}), /* @__PURE__ */ v("label", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ _("span", {
							className: "text-[10px] uppercase flex-shrink-0",
							style: {
								color: o.textDim,
								width: 48
							},
							children: s("gradient_opacity")
						}),
						/* @__PURE__ */ _(an, {
							min: 0,
							max: 100,
							className: "flex-1",
							value: y.opacity,
							onChange: (e) => x(l.stops.indexOf(y), { opacity: e }),
							accent: o.accent,
							trackColor: o.border,
							"aria-label": s("gradient_opacity")
						}),
						/* @__PURE__ */ _("input", {
							type: "number",
							min: 0,
							max: 100,
							value: Math.round(y.opacity),
							onChange: (e) => x(l.stops.indexOf(y), { opacity: Math.max(0, Math.min(100, Number(e.target.value))) }),
							className: "w-14 px-1.5 py-0.5 text-[11px] outline-none",
							style: {
								background: o.surface,
								color: o.text,
								border: `1px solid ${o.border}`,
								borderRadius: 2
							}
						})
					]
				})]
			}),
			/* @__PURE__ */ v("button", {
				onClick: () => C(),
				className: "flex items-center gap-1 px-1.5 py-1 mt-2 text-[10px] rounded",
				style: {
					background: o.surface,
					color: o.textDim
				},
				children: [
					/* @__PURE__ */ _(ie, { size: 11 }),
					" ",
					s("gradient_add_stop")
				]
			})
		]
	});
}
function Mi({ t: e, C: t, value: n, onChange: r, className: i, style: a, width: o = 32, height: s = 24 }) {
	let l = t ?? pi(), [u, f] = m(!1), h = p(null), y = p(null), [b, x] = m(null), S = () => {
		let e = h.current, t = y.current;
		if (!e || !t) return;
		let n = e.getBoundingClientRect(), r = t.offsetWidth || 264, i = t.offsetHeight || 360, a = window.innerWidth, o = window.innerHeight, s = n.left - r - 8;
		s < 8 && (s = n.right + 8), s + r > a - 8 && (s = a - r - 8), s < 8 && (s = 8);
		let c = n.top;
		c + i > o - 8 && (c = o - i - 8), c < 8 && (c = 8), x({
			left: s,
			top: c
		});
	};
	return d(() => {
		if (!u) {
			x(null);
			return;
		}
		S();
	}, [u]), c(() => {
		if (!u) return;
		let e = () => S();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [u]), /* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("button", {
		ref: h,
		type: "button",
		onClick: () => f((e) => !e),
		className: i,
		style: {
			width: o,
			height: s,
			backgroundImage: Di(n),
			backgroundColor: "#fff",
			border: `1px solid ${u ? l.accent : l.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...a
		}
	}), u && X(/* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => f(!1)
	}), /* @__PURE__ */ _("div", {
		ref: y,
		className: "fixed",
		style: {
			left: b?.left ?? 0,
			top: b?.top ?? 0,
			zIndex: 200,
			visibility: b ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ _(ji, {
			t: e,
			C: l,
			value: n,
			onChange: r,
			onClose: () => f(!1)
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/Card.tsx
function Ni({ title: e, icon: t, actions: n, subtitle: r, footer: i, dense: a = !1, flush: o = !1, className: s, bodyClassName: c, children: u }) {
	let d = l(), f = a ? "px-3 py-2.5" : "px-4 py-3", p = o ? "" : a ? "p-3" : "p-4", m = e != null || t != null || n != null;
	return /* @__PURE__ */ v("section", {
		"aria-labelledby": e == null ? void 0 : d,
		className: b(y("min-w-0 rounded-xl border border-border bg-surface-0", s)),
		children: [
			m && /* @__PURE__ */ v("div", {
				className: y("flex items-start gap-3 border-b border-border", f),
				children: [
					t && /* @__PURE__ */ _("span", {
						className: "mt-0.5 flex shrink-0 items-center text-text-secondary",
						"aria-hidden": !0,
						children: t
					}),
					/* @__PURE__ */ v("div", {
						className: "min-w-0 flex-1",
						children: [e != null && /* @__PURE__ */ _("h3", {
							id: d,
							className: "truncate font-medium text-text-primary",
							style: { fontSize: a ? "var(--kb-text-body)" : "var(--kb-text-heading)" },
							children: e
						}), r != null && /* @__PURE__ */ _("p", {
							className: "mt-0.5 text-text-secondary",
							style: { fontSize: "var(--kb-text-meta)" },
							children: r
						})]
					}),
					n && /* @__PURE__ */ _("div", {
						className: "flex shrink-0 items-center gap-1.5",
						children: n
					})
				]
			}),
			u != null && /* @__PURE__ */ _("div", {
				className: b(y("min-w-0", p), c),
				children: u
			}),
			i != null && /* @__PURE__ */ _("div", {
				className: y("border-t border-border bg-surface-1 rounded-b-xl", f),
				children: i
			})
		]
	});
}
//#endregion
//#region ../../src/ui/uiText.ts
var Pi = {
	"ui.close": "Close",
	"ui.cancel": "Cancel",
	"ui.retry": "Retry",
	"ui.learn_more": "Learn more",
	"ui.more_actions": "More actions",
	"ui.actions": "Actions",
	"ui.cb_search": "Search…",
	"ui.cb_select": "Select…",
	"ui.cb_no_results": "No match",
	"ui.cb_clear": "Clear selection",
	"ui.pb_progress": "Progress",
	"ui.st_step": "Step",
	"ui.st_of": "of",
	"ui.st_done": "Completed",
	"ui.st_error": "Needs attention",
	"ui.st_optional": "Optional",
	"ui.dt_select_all": "Select all rows",
	"ui.dt_select_row": "Select row",
	"ui.dt_selected": "selected",
	"ui.dt_clear_sel": "Clear selection",
	"ui.dt_columns": "Columns",
	"ui.dt_sort_asc": "Sort ascending",
	"ui.dt_sort_desc": "Sort descending",
	"ui.dt_prev_page": "Previous page",
	"ui.dt_next_page": "Next page",
	"ui.dt_page": "Page",
	"ui.dt_rows_per_page": "Rows per page",
	"ui.dt_loading": "Loading rows…",
	"ui.dt_empty_title": "Nothing here yet",
	"ui.dt_empty_desc": "Items you add will show up in this table.",
	"ui.dt_nores_title": "No result",
	"ui.dt_nores_desc": "No row matches the current filters.",
	"ui.dt_clear_filters": "Clear filters",
	"ui.dt_error_title": "Could not load the data",
	"ui.dt_error_desc": "The request failed. Check the connection and try again.",
	"ui.dt_copy_cell": "Copy this cell",
	"ui.dt_copy_row": "Copy this row",
	"ui.dt_copy_card": "Copy this card",
	"ui.dt_copy_column": "Copy the column “{{name}}”",
	"ui.dt_copy_selection": "Copy the selected text",
	"ui.dt_copied": "Copied",
	"ui.dt_resize_column": "Resize the column “{{name}}”"
};
function Fi(e) {
	return (t, n) => {
		if (e) {
			let r = e(t, {
				defaultValue: Pi[t] ?? t,
				...n
			});
			if (typeof r == "string") return r;
		}
		let r = Pi[t] ?? t;
		if (n) for (let [e, t] of Object.entries(n)) r = r.replace(`{{${e}}}`, String(t));
		return r;
	};
}
function Ii(e) {
	return e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
function Li(e, t) {
	return t ? Ii(e).includes(Ii(t)) : !0;
}
//#endregion
//#region ../../src/ui/EmptyState.tsx
var Ri = {
	"first-use": "bg-primary-light text-primary",
	"no-results": "bg-surface-2 text-text-secondary",
	error: "bg-danger-light text-danger",
	unavailable: "bg-surface-2 text-text-tertiary"
}, zi = {
	"first-use": "primary",
	"no-results": "secondary",
	error: "secondary",
	unavailable: "secondary"
};
function Bi({ icon: e, title: t, description: n, action: r, secondaryAction: i, docHref: a, docLabel: o, variant: s = "first-use", compact: c = !1, className: l, t: u }) {
	let d = Fi(u), f = r?.variant ?? zi[s];
	return /* @__PURE__ */ v("div", {
		role: "status",
		className: y("flex flex-col items-center justify-center text-center", c ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12", l),
		children: [
			/* @__PURE__ */ _("span", {
				"aria-hidden": !0,
				className: y("flex items-center justify-center rounded-full", c ? "h-11 w-11" : "h-14 w-14", Ri[s]),
				children: e
			}),
			/* @__PURE__ */ v("div", {
				className: "max-w-sm",
				children: [/* @__PURE__ */ _("p", {
					className: "font-medium text-text-primary",
					style: { fontSize: c ? "var(--kb-text-body)" : "var(--kb-text-heading)" },
					children: t
				}), n != null && /* @__PURE__ */ _("p", {
					className: "mt-1 leading-relaxed text-text-secondary",
					style: { fontSize: "var(--kb-text-body)" },
					children: n
				})]
			}),
			(r || i) && /* @__PURE__ */ v("div", {
				className: "mt-1 flex flex-wrap items-center justify-center gap-2",
				children: [r && /* @__PURE__ */ _($e, {
					variant: f,
					size: "sm",
					icon: r.icon,
					disabled: r.disabled,
					onClick: r.onClick,
					children: r.label
				}), i && /* @__PURE__ */ _($e, {
					variant: i.variant ?? "ghost",
					size: "sm",
					icon: i.icon,
					disabled: i.disabled,
					onClick: i.onClick,
					children: i.label
				})]
			}),
			a && /* @__PURE__ */ _("a", {
				href: a,
				target: "_blank",
				rel: "noreferrer",
				className: "rounded-sm text-primary underline-offset-2 hover:underline\n                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
				style: { fontSize: "var(--kb-text-meta)" },
				children: o ?? d("ui.learn_more")
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Callout.tsx
var Vi = {
	info: {
		box: "bg-primary-light",
		icon: "text-primary",
		Glyph: H,
		live: "polite"
	},
	success: {
		box: "bg-success-light",
		icon: "text-success",
		Glyph: O,
		live: "polite"
	},
	warning: {
		box: "bg-warning-light",
		icon: "text-warning",
		Glyph: S,
		live: "polite"
	},
	danger: {
		box: "bg-danger-light",
		icon: "text-danger",
		Glyph: x,
		live: "assertive"
	}
};
function Hi({ variant: e = "info", title: t, children: n, action: r, dismissible: i = !1, onDismiss: a, icon: o, className: s, t: c }) {
	let l = Fi(c), [u, d] = m(!1), f = Vi[e];
	if (u) return null;
	let p = f.Glyph, h = o === null ? null : o ?? /* @__PURE__ */ _(p, { size: 16 });
	return /* @__PURE__ */ v("div", {
		role: e === "danger" ? "alert" : "status",
		"aria-live": f.live,
		className: y("flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5", f.box, s),
		children: [
			h && /* @__PURE__ */ _("span", {
				className: y("mt-px shrink-0", f.icon),
				"aria-hidden": !0,
				children: h
			}),
			/* @__PURE__ */ v("div", {
				className: "min-w-0 flex-1",
				style: { fontSize: "var(--kb-text-body)" },
				children: [
					t != null && /* @__PURE__ */ _("p", {
						className: "font-medium text-text-primary",
						children: t
					}),
					n != null && /* @__PURE__ */ _("div", {
						className: y("text-text-primary leading-relaxed", t != null && "mt-0.5"),
						children: n
					}),
					r && /* @__PURE__ */ v("button", {
						type: "button",
						onClick: r.onClick,
						className: y("mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 transition-colors", "hover:bg-[var(--kb-black-08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary", f.icon),
						style: { fontSize: "var(--kb-text-body)" },
						children: [r.icon, r.label]
					})
				]
			}),
			i && /* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": l("ui.close"),
				onClick: () => {
					d(!0), a?.();
				},
				className: "-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-text-secondary transition-colors\n                     hover:bg-[var(--kb-black-08)] hover:text-text-primary\n                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
				children: /* @__PURE__ */ _(pe, { size: 14 })
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Breadcrumb.tsx
var Ui = "inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";
function Wi({ items: e, ariaLabel: t, maxVisible: n = 4, trailing: r, className: i = "", maxSegmentWidth: a = "14rem" }) {
	let [o, s] = m(null);
	if (e.length === 0) return null;
	let c = e.length > n, l = c ? e.slice(1, e.length - 2) : [], u = c ? [e[0], ...e.slice(e.length - 2)] : e, d = c ? 0 : -1, f = l.map((e) => ({
		type: "action",
		label: e.title ?? (typeof e.label == "string" ? e.label : ""),
		icon: e.icon,
		onClick: () => {
			s(null), e.onClick?.(), !e.onClick && e.href && window.location.assign(e.href);
		}
	})), p = (e, t) => {
		let n = /* @__PURE__ */ v(g, { children: [e.icon && /* @__PURE__ */ _("span", {
			className: "me-1.5 inline-flex shrink-0",
			children: e.icon
		}), /* @__PURE__ */ _("span", {
			className: "truncate",
			style: { maxWidth: a },
			children: e.label
		})] });
		return t ? /* @__PURE__ */ _("span", {
			className: "inline-flex items-center text-sm font-medium text-text-primary",
			title: e.title,
			children: n
		}) : e.href ? /* @__PURE__ */ _("a", {
			href: e.href,
			title: e.title,
			className: Ui,
			onClick: (t) => {
				e.onClick && (t.metaKey || t.ctrlKey || t.shiftKey || t.button !== 0 || (t.preventDefault(), e.onClick()));
			},
			children: n
		}) : /* @__PURE__ */ _("button", {
			type: "button",
			className: Ui,
			title: e.title,
			onClick: e.onClick,
			children: n
		});
	};
	return /* @__PURE__ */ v("nav", {
		className: `flex min-w-0 items-center ${i}`,
		"aria-label": t,
		children: [
			/* @__PURE__ */ _("ol", {
				className: "inline-flex min-w-0 items-center gap-1.5",
				children: u.map((e, t) => {
					let n = t === u.length - 1;
					return /* @__PURE__ */ v("li", {
						className: "inline-flex min-w-0 items-center gap-1.5",
						"aria-current": n ? "page" : void 0,
						children: [
							t > 0 && /* @__PURE__ */ _(j, {
								size: 14,
								"aria-hidden": "true",
								className: "shrink-0 text-text-tertiary"
							}),
							p(e, n),
							t === d && /* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _(j, {
								size: 14,
								"aria-hidden": "true",
								className: "shrink-0 text-text-tertiary"
							}), /* @__PURE__ */ _("button", {
								type: "button",
								"aria-label": `${l.length}`,
								title: l.map((e) => e.title ?? e.label).join(" › "),
								className: `${Ui} px-0.5`,
								onClick: (e) => {
									let t = e.currentTarget.getBoundingClientRect();
									s({
										x: t.left,
										y: t.bottom + 4
									});
								},
								children: /* @__PURE__ */ _(q, { size: 16 })
							})] })
						]
					}, t);
				})
			}),
			r,
			o && /* @__PURE__ */ _(Rr, {
				items: f,
				pos: {
					top: o.y,
					left: o.x
				},
				onClose: () => s(null)
			})
		]
	});
}
//#endregion
//#region ../../src/ui/ProgressBar.tsx
var Gi = {
	sm: "h-1.5",
	md: "h-2"
}, Ki = "@keyframes kb-progress-slide{\n  0%{transform:translateX(-100%)}100%{transform:translateX(300%)}\n}", qi = {
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
	danger: "bg-danger"
};
function Ji({ value: e, max: t = 100, variant: n = "auto", label: r, showValue: i = !1, formatValue: a, warnAt: o = .75, dangerAt: s = .9, size: c = "md", indeterminate: l = !1, className: u, t: d }) {
	let f = Fi(d), p = t > 0 ? t : 1, m = Math.min(Math.max(e, 0), p), h = m / p, b = h * 100, x = n === "auto" ? h >= s ? "danger" : h >= o ? "warning" : "primary" : n, S = a ? a(m, p) : `${Math.round(b)} %`, C = r != null || i;
	return /* @__PURE__ */ v("div", {
		className: y("min-w-0", u),
		children: [C && /* @__PURE__ */ v("div", {
			className: "mb-1 flex items-baseline justify-between gap-2",
			style: { fontSize: "var(--kb-text-body)" },
			children: [r == null ? /* @__PURE__ */ _("span", {}) : /* @__PURE__ */ _("span", {
				className: "min-w-0 truncate text-text-secondary",
				children: r
			}), i && /* @__PURE__ */ _("span", {
				className: "shrink-0 tabular-nums text-text-secondary",
				children: S
			})]
		}), /* @__PURE__ */ _("div", {
			role: "progressbar",
			"aria-label": r == null ? f("ui.pb_progress") : void 0,
			"aria-valuemin": l ? void 0 : 0,
			"aria-valuemax": l ? void 0 : p,
			"aria-valuenow": l ? void 0 : m,
			"aria-valuetext": l ? void 0 : S,
			className: y("w-full overflow-hidden rounded-full bg-surface-2", Gi[c]),
			children: l ? /* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("style", { children: Ki }), /* @__PURE__ */ _("div", {
				className: y("h-full w-1/3 rounded-full", qi[x]),
				style: { animation: "kb-progress-slide 1.3s ease-in-out infinite" }
			})] }) : /* @__PURE__ */ _("div", {
				className: y("h-full rounded-full transition-[width,background-color] duration-300", qi[x]),
				style: { width: `${b}%` }
			})
		})]
	});
}
//#endregion
//#region ../../src/ui/interaction.ts
function Yi() {
	return typeof window < "u" && typeof window.matchMedia == "function" && (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches);
}
var Xi = 1023;
function Zi() {
	let e = `(max-width: ${Xi}px)`, [t, n] = m(() => typeof window < "u" && typeof window.matchMedia == "function" ? window.matchMedia(e).matches : !1);
	return c(() => {
		if (typeof window > "u" || typeof window.matchMedia != "function") return;
		let t = window.matchMedia(e), r = (e) => n(e.matches);
		return n(t.matches), t.addEventListener("change", r), () => t.removeEventListener("change", r);
	}, [e]), t;
}
function Qi() {
	let e = "(orientation: landscape)", [t, n] = m(() => typeof window < "u" && typeof window.matchMedia == "function" ? window.matchMedia(e).matches : !0);
	return c(() => {
		if (typeof window > "u" || typeof window.matchMedia != "function") return;
		let t = window.matchMedia(e), r = (e) => n(e.matches);
		return n(t.matches), t.addEventListener("change", r), () => t.removeEventListener("change", r);
	}, []), t;
}
function $i(e) {
	return {
		onClick: (t) => {
			Yi() ? e.open(t) : e.select?.(t);
		},
		onDoubleClick: (t) => {
			Yi() || e.open(t);
		}
	};
}
function ea(e, t = {}) {
	let { ms: n = 500, moveTolerance: r = 12 } = t, i = p(null), a = p(null), s = o(() => {
		i.current &&= (clearTimeout(i.current), null), a.current = null;
	}, []);
	return {
		onTouchStart: o((t) => {
			if (t.touches.length !== 1) {
				s();
				return;
			}
			let r = t.touches[0];
			a.current = {
				x: r.clientX,
				y: r.clientY
			}, i.current = setTimeout(() => {
				i.current = null;
				let t = (e) => {
					e.stopPropagation(), e.preventDefault();
				};
				window.addEventListener("click", t, {
					capture: !0,
					once: !0
				}), setTimeout(() => window.removeEventListener("click", t, { capture: !0 }), 700), e({
					clientX: r.clientX,
					clientY: r.clientY,
					preventDefault() {},
					stopPropagation() {}
				});
			}, n);
		}, [
			e,
			n,
			s
		]),
		onTouchMove: o((e) => {
			if (!a.current) return;
			let t = e.touches[0];
			(Math.abs(t.clientX - a.current.x) > r || Math.abs(t.clientY - a.current.y) > r) && s();
		}, [s, r]),
		onTouchEnd: s,
		onTouchCancel: s
	};
}
//#endregion
//#region ../../src/ui/MobileSheet.tsx
function ta({ open: e, onClose: t, title: n, children: r }) {
	return c(() => {
		if (!e) return;
		let n = (e) => {
			e.key === "Escape" && t();
		};
		document.addEventListener("keydown", n);
		let r = document.body.style.overflow;
		return document.body.style.overflow = "hidden", () => {
			document.removeEventListener("keydown", n), document.body.style.overflow = r;
		};
	}, [e, t]), e ? X(/* @__PURE__ */ v("div", {
		className: "fixed inset-0 z-[9997] lg:hidden",
		role: "dialog",
		"aria-modal": "true",
		children: [/* @__PURE__ */ _("div", {
			className: "absolute inset-0 bg-black/40 animate-[kb-sheet-fade_.15s_ease-out]",
			onClick: t
		}), /* @__PURE__ */ v("div", {
			className: "absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white\n                   shadow-[0_-8px_30px_rgba(0,0,0,0.18)] animate-[kb-sheet-up_.2s_ease-out]",
			style: { paddingBottom: "calc(12px + env(safe-area-inset-bottom))" },
			children: [
				/* @__PURE__ */ _("div", {
					className: "flex justify-center pt-2.5 pb-1",
					children: /* @__PURE__ */ _("div", { className: "h-1 w-10 rounded-full bg-border-strong" })
				}),
				n && /* @__PURE__ */ _("div", {
					className: "px-4 pb-2 pt-1 text-sm font-medium text-text-primary truncate",
					children: n
				}),
				/* @__PURE__ */ _("div", {
					className: "py-1",
					children: r
				})
			]
		})]
	}), document.body) : null;
}
function na({ icon: e, label: t, trailing: n, danger: r, selected: i, onClick: a }) {
	return /* @__PURE__ */ v("button", {
		onClick: a,
		className: `w-full flex items-center gap-3.5 px-4 h-[52px] text-left text-[15px] active:bg-surface-2 transition-colors
                  ${r ? "text-danger" : "text-text-primary"} ${i ? "bg-primary-light" : ""}`,
		children: [
			e && /* @__PURE__ */ _("span", {
				className: `w-5 flex justify-center shrink-0 ${r ? "text-danger" : "text-text-secondary"}`,
				children: e
			}),
			/* @__PURE__ */ _("span", {
				className: "flex-1 min-w-0 truncate",
				children: t
			}),
			n
		]
	});
}
function ra() {
	return /* @__PURE__ */ _("div", { className: "my-1 h-px bg-border" });
}
//#endregion
//#region ../../src/ui/Combobox.tsx
function ia({ value: e, onChange: t, options: n, placeholder: r, searchPlaceholder: i, emptyLabel: a, disabled: s = !1, clearable: u = !1, onClear: h, width: g, maxHeight: y = 280, name: b, id: x, className: S, t: C, "aria-label": w }) {
	let T = Fi(C), E = l(), O = `${E}-list`, A = (e) => `${E}-opt-${e}`, j = Zi(), { host: M, scoped: N } = Ye(), [P, F] = m(!1), [I, ee] = m(""), [L, R] = m(0), [z, B] = m(null), V = p(null), H = p(null), U = p(null), W = p(null), G = f(() => n.find((t) => t.value === e) ?? null, [n, e]), K = f(() => I.trim() ? n.filter((e) => Li(e.label, I) || (e.description ? Li(e.description, I) : !1) || (e.keywords ? Li(e.keywords, I) : !1)) : n, [n, I]), te = o((e, t) => {
		if (K.length === 0) return -1;
		let n = e;
		for (let e = 0; e < K.length; e++) {
			if (n < 0 && (n = K.length - 1), n >= K.length && (n = 0), !K[n].disabled) return n;
			n += t;
		}
		return -1;
	}, [K]);
	c(() => {
		if (!P) return;
		let t = K.findIndex((t) => t.value === e);
		R(te(t >= 0 ? t : 0, 1));
	}, [
		P,
		K,
		e,
		te
	]);
	let q = o(() => {
		let e = V.current, t = U.current;
		if (!e) return;
		let n = e.getBoundingClientRect(), r = N && M ? M.getBoundingClientRect() : null, i = r ? r.left : 0, a = r ? r.top : 0, o = r ? r.width : window.innerWidth, s = r ? r.height : window.innerHeight, c = n.width, l = t?.offsetHeight ?? Math.min(y + 52, 340), u = n.bottom - a + 4;
		u + l > s - 8 && (u = Math.max(8, n.top - a - l - 4));
		let d = n.left - i;
		d + c > o - 8 && (d = Math.max(8, o - 8 - c)), d < 8 && (d = 8), B({
			left: d,
			top: u,
			width: c
		});
	}, [
		N,
		M,
		y
	]);
	d(() => {
		P && !j && q();
	}, [
		P,
		j,
		q,
		K.length
	]), c(() => {
		if (!P || j) return;
		let e = () => q();
		return window.addEventListener("scroll", e, !0), window.addEventListener("resize", e), () => {
			window.removeEventListener("scroll", e, !0), window.removeEventListener("resize", e);
		};
	}, [
		P,
		j,
		q
	]), c(() => {
		if (!P) return;
		let e = (e) => {
			let t = e.target;
			V.current?.contains(t) || U.current?.contains(t) || F(!1);
		};
		return document.addEventListener("pointerdown", e, !0), () => document.removeEventListener("pointerdown", e, !0);
	}, [P]), c(() => {
		P && H.current?.focus();
	}, [P, j]), c(() => {
		!P || L < 0 || W.current?.querySelector(`#${CSS.escape(A(L))}`)?.scrollIntoView({ block: "nearest" });
	}, [P, L]);
	let ne = () => {
		s || (ee(""), F(!0));
	}, re = (e) => {
		e.disabled || (t(e.value), F(!1), V.current?.focus());
	}, ie = (e) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault(), R((e) => te(e + 1, 1));
				break;
			case "ArrowUp":
				e.preventDefault(), R((e) => te(e - 1, -1));
				break;
			case "Home":
				e.preventDefault(), R(te(0, 1));
				break;
			case "End":
				e.preventDefault(), R(te(K.length - 1, -1));
				break;
			case "Enter":
				L >= 0 && K[L] && (e.preventDefault(), re(K[L]));
				break;
			case "Escape":
				e.preventDefault(), e.stopPropagation(), F(!1), V.current?.focus();
				break;
			case "Tab":
				F(!1);
				break;
		}
	}, ae = G?.label ?? r ?? T("ui.cb_select"), se = /* @__PURE__ */ v("button", {
		ref: V,
		type: "button",
		id: x,
		role: "combobox",
		"aria-expanded": P,
		"aria-controls": P ? O : void 0,
		"aria-haspopup": "listbox",
		"aria-label": w,
		disabled: s,
		onClick: () => P ? F(!1) : ne(),
		onKeyDown: (e) => {
			(e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") && (e.preventDefault(), ne());
		},
		className: [
			"flex h-9 w-full items-center gap-2 rounded-md border px-3 text-left transition-colors",
			"bg-white text-text-primary",
			"focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
			"disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60",
			P ? "border-primary ring-2 ring-primary" : "border-border hover:bg-surface-1"
		].join(" "),
		style: { fontSize: "var(--kb-text-body)" },
		children: [
			G?.icon && /* @__PURE__ */ _("span", {
				className: "flex shrink-0 items-center text-text-secondary",
				children: G.icon
			}),
			/* @__PURE__ */ _("span", {
				className: `min-w-0 flex-1 truncate ${G ? "" : "text-text-tertiary"}`,
				children: ae
			}),
			u && G && /* @__PURE__ */ _("span", {
				role: "button",
				tabIndex: -1,
				"aria-label": T("ui.cb_clear"),
				onClick: (e) => {
					e.stopPropagation(), h?.(), t("");
				},
				className: "shrink-0 rounded-sm p-0.5 text-text-tertiary hover:bg-surface-2 hover:text-text-primary",
				children: /* @__PURE__ */ _(pe, { size: 13 })
			}),
			/* @__PURE__ */ _(k, {
				size: 15,
				className: "shrink-0 text-text-secondary",
				"aria-hidden": !0
			})
		]
	}), J = /* @__PURE__ */ _("div", {
		className: "border-b border-border p-2",
		children: /* @__PURE__ */ v("div", {
			className: "relative flex items-center",
			children: [/* @__PURE__ */ _(oe, {
				size: 14,
				className: "pointer-events-none absolute left-2.5 text-text-tertiary",
				"aria-hidden": !0
			}), /* @__PURE__ */ _("input", {
				ref: H,
				type: "text",
				value: I,
				onChange: (e) => ee(e.target.value),
				onKeyDown: ie,
				role: "combobox",
				"aria-expanded": !0,
				"aria-controls": O,
				"aria-autocomplete": "list",
				"aria-activedescendant": L >= 0 && K.length ? A(L) : void 0,
				"aria-label": i ?? T("ui.cb_search"),
				placeholder: i ?? T("ui.cb_search"),
				className: "h-8 w-full rounded-md border border-border bg-white pl-8 pr-2 text-text-primary\n                     placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary",
				style: { fontSize: "var(--kb-text-body)" }
			})]
		})
	}), ce = /* @__PURE__ */ _("div", {
		ref: W,
		id: O,
		role: "listbox",
		"aria-label": w ?? r,
		className: "overflow-y-auto overscroll-contain p-1",
		style: { maxHeight: y },
		children: K.length === 0 ? /* @__PURE__ */ _("p", {
			className: "px-3 py-6 text-center text-text-tertiary",
			style: { fontSize: "var(--kb-text-body)" },
			children: a ?? T("ui.cb_no_results")
		}) : K.map((t, n) => {
			let r = t.value === e, i = n === L;
			return /* @__PURE__ */ v("div", { children: [t.group && (n === 0 || K[n - 1].group !== t.group) && /* @__PURE__ */ _("p", {
				className: "px-2 pb-1 pt-2 font-medium uppercase tracking-wide text-text-tertiary",
				style: { fontSize: "var(--kb-text-micro)" },
				children: t.group
			}), /* @__PURE__ */ v("div", {
				id: A(n),
				role: "option",
				"aria-selected": r,
				"aria-disabled": t.disabled || void 0,
				onPointerDown: (e) => e.preventDefault(),
				onClick: () => re(t),
				onMouseEnter: () => !t.disabled && R(n),
				className: [
					"flex cursor-pointer items-center gap-2 rounded-md px-2",
					j ? "min-h-[44px] py-2" : "py-1.5",
					t.disabled ? "cursor-not-allowed opacity-50" : "",
					i ? "bg-surface-2" : "",
					r ? "text-primary" : "text-text-primary"
				].join(" "),
				style: { fontSize: "var(--kb-text-body)" },
				children: [
					/* @__PURE__ */ _("span", {
						className: "flex w-4 shrink-0 justify-center text-primary",
						"aria-hidden": !0,
						children: r && /* @__PURE__ */ _(D, { size: 14 })
					}),
					t.icon && /* @__PURE__ */ _("span", {
						className: "flex shrink-0 items-center text-text-secondary",
						children: t.icon
					}),
					/* @__PURE__ */ v("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ _("span", {
							className: "block truncate",
							children: t.label
						}), t.description && /* @__PURE__ */ _("span", {
							className: "block truncate text-text-tertiary",
							style: { fontSize: "var(--kb-text-meta)" },
							children: t.description
						})]
					})
				]
			})] }, t.value);
		})
	});
	return /* @__PURE__ */ v("div", {
		className: `relative min-w-0 ${S ?? ""}`,
		style: g === void 0 ? void 0 : { width: g },
		children: [
			b && /* @__PURE__ */ _("input", {
				type: "hidden",
				name: b,
				value: e ?? ""
			}),
			se,
			P && j && /* @__PURE__ */ _(ta, {
				open: !0,
				onClose: () => F(!1),
				title: r ?? w,
				children: /* @__PURE__ */ v("div", {
					ref: U,
					children: [J, ce]
				})
			}),
			P && !j && M && X(/* @__PURE__ */ v("div", {
				ref: U,
				className: `${N ? "absolute" : "fixed"} overflow-hidden rounded-lg border border-border bg-white`,
				style: {
					left: z?.left ?? 0,
					top: z?.top ?? 0,
					width: z?.width,
					minWidth: 200,
					zIndex: 9999,
					boxShadow: "var(--kb-shadow-float)",
					visibility: z ? "visible" : "hidden"
				},
				children: [J, ce]
			}), M)
		]
	});
}
//#endregion
//#region ../../src/ui/Stepper.tsx
var aa = 560;
function oa(e, t) {
	let [n, r] = m(!1);
	return c(() => {
		let n = e.current;
		if (!n || (r(n.clientWidth < t), typeof ResizeObserver > "u")) return;
		let i = new ResizeObserver((e) => {
			r((e[0]?.contentRect.width ?? n.clientWidth) < t);
		});
		return i.observe(n), () => i.disconnect();
	}, [e, t]), n;
}
function sa(e, t, n) {
	return e.status ? e.status : t < n ? "complete" : t === n ? "current" : "pending";
}
var ca = {
	complete: "bg-primary text-white border-primary",
	current: "bg-white text-primary border-primary",
	error: "bg-danger text-white border-danger",
	pending: "bg-white text-text-tertiary border-border",
	disabled: "bg-surface-2 text-text-tertiary border-border"
}, la = {
	complete: "text-text-primary",
	current: "text-primary font-medium",
	error: "text-danger font-medium",
	pending: "text-text-secondary",
	disabled: "text-text-tertiary"
};
function ua({ steps: e, current: t, onStepChange: n, orientation: r = "horizontal", allowForward: i = !1, children: a, className: s, t: c }) {
	let l = Fi(c), u = p(null), d = oa(u, aa), m = f(() => {
		if (typeof t == "number") return Math.min(Math.max(t, 0), e.length - 1);
		let n = e.findIndex((e) => e.id === t);
		return n >= 0 ? n : 0;
	}, [t, e]), h = (e, t) => !!n && t !== "disabled" && (i || e <= m), g = o((e) => e === "complete" ? l("ui.st_done") : e === "error" ? l("ui.st_error") : "", [l]), b = r === "vertical" && !d, x = /* @__PURE__ */ v("div", { children: [
		/* @__PURE__ */ v("div", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ _("p", {
				className: "min-w-0 truncate font-medium text-text-primary",
				style: { fontSize: "var(--kb-text-body)" },
				children: e[m]?.label
			}), /* @__PURE__ */ v("p", {
				className: "shrink-0 tabular-nums text-text-secondary",
				style: { fontSize: "var(--kb-text-meta)" },
				children: [
					l("ui.st_step"),
					" ",
					m + 1,
					" ",
					l("ui.st_of"),
					" ",
					e.length
				]
			})]
		}),
		e[m]?.description && /* @__PURE__ */ _("p", {
			className: "mt-0.5 text-text-secondary",
			style: { fontSize: "var(--kb-text-meta)" },
			children: e[m].description
		}),
		/* @__PURE__ */ _("div", {
			className: "mt-2 flex gap-1",
			"aria-hidden": !0,
			children: e.map((e, t) => /* @__PURE__ */ _("span", { className: y("h-1 flex-1 rounded-full transition-colors", sa(e, t, m) === "error" ? "bg-danger" : t <= m ? "bg-primary" : "bg-surface-3") }, e.id))
		})
	] }), C = /* @__PURE__ */ _("ol", {
		className: y("flex min-w-0", b ? "flex-col gap-3" : "items-start gap-1"),
		children: e.map((t, r) => {
			let i = sa(t, r, m), a = h(r, i), o = g(i), s = /* @__PURE__ */ _("span", {
				className: y("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors", ca[i]),
				style: { fontSize: "var(--kb-text-meta)" },
				children: i === "complete" ? /* @__PURE__ */ _(D, { size: 14 }) : i === "error" ? /* @__PURE__ */ _(S, { size: 13 }) : r + 1
			}), c = /* @__PURE__ */ v("span", {
				className: y("min-w-0", "text-left"),
				children: [/* @__PURE__ */ v("span", {
					className: y("block truncate", la[i]),
					style: { fontSize: "var(--kb-text-body)" },
					children: [t.label, t.optional && /* @__PURE__ */ v("span", {
						className: "ml-1 font-normal text-text-tertiary",
						style: { fontSize: "var(--kb-text-meta)" },
						children: [
							"(",
							l("ui.st_optional"),
							")"
						]
					})]
				}), t.description && /* @__PURE__ */ _("span", {
					className: "block truncate text-text-tertiary",
					style: { fontSize: "var(--kb-text-meta)" },
					children: t.description
				})]
			}), u = /* @__PURE__ */ v("span", {
				className: y("flex min-w-0 items-center gap-2.5", b ? "" : "flex-1"),
				children: [s, c]
			});
			return /* @__PURE__ */ v("li", {
				"aria-current": i === "current" ? "step" : void 0,
				className: y("flex min-w-0", b ? "flex-col" : "flex-1 items-center gap-1"),
				children: [a ? /* @__PURE__ */ _("button", {
					type: "button",
					onClick: () => n?.(t.id, r),
					"aria-label": o ? `${t.label} — ${o}` : t.label,
					className: "flex min-w-0 flex-1 items-center rounded-md px-1 py-1 text-left transition-colors\n                           hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
					children: u
				}) : /* @__PURE__ */ _("span", {
					className: "flex min-w-0 flex-1 items-center px-1 py-1",
					"aria-label": o || void 0,
					children: u
				}), r < e.length - 1 && (b ? /* @__PURE__ */ _("span", {
					"aria-hidden": !0,
					className: y("ml-4 h-4 w-px", r < m ? "bg-primary" : "bg-border")
				}) : /* @__PURE__ */ _("span", {
					"aria-hidden": !0,
					className: y("h-px min-w-4 flex-1", r < m ? "bg-primary" : "bg-border")
				}))]
			}, t.id);
		})
	});
	return /* @__PURE__ */ v("div", {
		ref: u,
		className: y("min-w-0", s),
		children: [d ? x : C, a != null && /* @__PURE__ */ _("div", {
			className: "mt-4 min-w-0",
			children: a
		})]
	});
}
function da(e, t) {
	let [n, r] = m(() => {
		let n = t ? e.findIndex((e) => e.id === t) : 0;
		return n >= 0 ? n : 0;
	}), [i, a] = m({}), s = o((t) => Math.min(Math.max(t, 0), e.length - 1), [e.length]), c = f(() => {
		let t = {};
		return e.forEach((e, r) => {
			t[e.id] = i[e.id] ? "error" : r < n ? "complete" : r === n ? "current" : "pending";
		}), t;
	}, [
		e,
		n,
		i
	]), l = f(() => e.map((e) => ({
		...e,
		status: e.status ?? c[e.id]
	})), [e, c]);
	return {
		id: e[n]?.id ?? "",
		index: n,
		isFirst: n === 0,
		isLast: n === e.length - 1,
		next: () => r((e) => s(e + 1)),
		prev: () => r((e) => s(e - 1)),
		goTo: (t) => {
			let n = e.findIndex((e) => e.id === t);
			n >= 0 && r(n);
		},
		setError: (e, t) => a((n) => ({
			...n,
			[e]: t
		})),
		statuses: c,
		resolved: l
	};
}
//#endregion
//#region ../../src/ui/data-table/copy.ts
function fa(e) {
	return e.innerText.replace(/\s+/g, " ").trim();
}
function pa(e) {
	return [...e.querySelectorAll("[data-col]")].map(fa).join("	");
}
function ma(e, t) {
	let n = `[data-col="${CSS.escape(t)}"]`;
	return [...e.querySelectorAll(`tbody ${n}`)].map(fa).join("\n");
}
function ha() {
	return (window.getSelection?.()?.toString() ?? "").trim();
}
async function ga(e) {
	if (!e) return !1;
	if (navigator.clipboard?.writeText) try {
		return await navigator.clipboard.writeText(e), !0;
	} catch {}
	let t = document.createElement("textarea");
	t.value = e, t.style.cssText = "position:fixed;top:0;left:0;opacity:0", document.body.appendChild(t), t.focus(), t.select();
	let n = !1;
	try {
		n = document.execCommand("copy");
	} catch {
		n = !1;
	}
	return document.body.removeChild(t), n;
}
//#endregion
//#region ../../src/ui/data-table/helpers.ts
function _a(e) {
	let [t, n] = m(null);
	return d(() => {
		let t = e.current;
		if (!t || (n(t.clientWidth), typeof ResizeObserver > "u")) return;
		let r = new ResizeObserver((e) => n(e[0]?.contentRect.width ?? t.clientWidth));
		return r.observe(t), () => r.disconnect();
	}, [e]), t;
}
function va(e) {
	return e.headerText ? e.headerText : typeof e.header == "string" ? e.header : e.id;
}
function ya(e, t) {
	let n = e == null || e === "", r = t == null || t === "";
	return n && r ? 0 : n ? 1 : r ? -1 : e instanceof Date || t instanceof Date ? Number(e instanceof Date ? e.getTime() : e) - Number(t instanceof Date ? t.getTime() : t) : typeof e == "number" && typeof t == "number" ? e - t : typeof e == "boolean" && typeof t == "boolean" ? Number(e) - Number(t) : String(e).localeCompare(String(t), void 0, {
		numeric: !0,
		sensitivity: "base"
	});
}
function ba(e, t, n) {
	if (!n) return e;
	let r = t.find((e) => e.id === n.columnId);
	if (!r?.sortValue) return e;
	let i = r.sortValue, a = n.direction === "asc" ? 1 : -1;
	return e.map((e, t) => ({
		row: e,
		index: t,
		key: i(e)
	})).sort((e, t) => {
		let n = ya(e.key, t.key);
		return n === 0 ? e.index - t.index : n * a;
	}).map((e) => e.row);
}
function xa(e, t) {
	return e?.columnId === t ? e.direction === "asc" ? {
		columnId: t,
		direction: "desc"
	} : null : {
		columnId: t,
		direction: "asc"
	};
}
//#endregion
//#region ../../src/ui/data-table/Cards.tsx
function Sa({ rows: e, columns: t, rowKey: n, selectable: r, selected: i, onToggle: a, rowActions: o, onRowClick: s, touch: c, t: l }) {
	let u = Fi(l), [d, f] = m(null), [h, y] = m(null), [b, x] = m({
		row: "",
		sel: ""
	}), S = p(/* @__PURE__ */ new Map()), C = t.filter((e) => !e.hideOnCards), w = C.find((e) => e.primary) ?? C[0], T = C.filter((e) => e !== w), E = (e) => (o ?? []).filter((t) => !t.hidden?.(e));
	return /* @__PURE__ */ v(g, { children: [
		/* @__PURE__ */ _("ul", {
			className: "flex flex-col gap-2 p-2",
			children: e.map((e) => {
				let t = n(e), o = i.has(t);
				return /* @__PURE__ */ v("li", {
					"data-row-card": "",
					className: `rounded-lg border p-3 transition-colors ${o ? "border-primary bg-primary-light" : "border-border bg-surface-0"}`,
					children: [/* @__PURE__ */ v("div", {
						className: "flex items-start gap-2.5",
						children: [
							r && /* @__PURE__ */ _(Rt, {
								checked: o,
								onChange: () => a(t),
								className: "mt-0.5",
								labelClassName: "sr-only",
								label: u("ui.dt_select_row")
							}),
							/* @__PURE__ */ _("div", {
								className: `min-w-0 flex-1 ${s ? "cursor-pointer" : ""}`,
								onClick: s ? () => s(e) : void 0,
								children: /* @__PURE__ */ _("div", {
									"data-col": w?.id,
									className: "truncate font-medium text-text-primary",
									style: { fontSize: "var(--kb-text-body)" },
									children: w?.cell(e)
								})
							}),
							/* @__PURE__ */ _("button", {
								ref: (e) => {
									e ? S.current.set(t, e) : S.current.delete(t);
								},
								type: "button",
								"aria-haspopup": "menu",
								"aria-label": u("ui.more_actions"),
								onClick: (n) => {
									let r = n.currentTarget.closest("[data-row-card]");
									if (x({
										row: r ? pa(r) : "",
										sel: ha()
									}), c) {
										y(e);
										return;
									}
									let i = S.current.get(t)?.getBoundingClientRect();
									i && f({
										row: e,
										top: i.bottom + 4,
										left: Math.max(8, i.right - 200)
									});
								},
								className: "-mr-1.5 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md\n                               text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary\n                               focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
								children: /* @__PURE__ */ _(ne, { size: 16 })
							})
						]
					}), T.length > 0 && /* @__PURE__ */ _("dl", {
						className: "mt-2 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1",
						children: T.map((t) => /* @__PURE__ */ v("div", {
							className: "contents",
							children: [/* @__PURE__ */ _("dt", {
								className: "truncate text-text-tertiary",
								style: { fontSize: "var(--kb-text-meta)" },
								children: va(t)
							}), /* @__PURE__ */ _("dd", {
								"data-col": t.id,
								className: "min-w-0 text-text-primary",
								style: { fontSize: "var(--kb-text-meta)" },
								children: t.cell(e)
							})]
						}, t.id))
					})]
				}, t);
			})
		}),
		d && /* @__PURE__ */ _(Rr, {
			pos: {
				top: d.top,
				left: d.left
			},
			onClose: () => f(null),
			items: [
				...E(d.row).map((e) => ({
					type: "action",
					label: e.label,
					icon: e.icon,
					danger: e.danger,
					onClick: () => {
						e.onClick(d.row), f(null);
					}
				})),
				...E(d.row).length ? [{ type: "separator" }] : [],
				{
					type: "action",
					label: u("ui.dt_copy_card"),
					icon: /* @__PURE__ */ _(R, { size: 14 }),
					onClick: () => {
						ga(b.row), f(null);
					}
				},
				...b.sel ? [{
					type: "action",
					label: u("ui.dt_copy_selection"),
					icon: /* @__PURE__ */ _(le, { size: 14 }),
					onClick: () => {
						ga(b.sel), f(null);
					}
				}] : []
			]
		}),
		/* @__PURE__ */ v(ta, {
			open: h !== null,
			onClose: () => y(null),
			title: u("ui.actions"),
			children: [
				h !== null && E(h).map((e) => /* @__PURE__ */ _(na, {
					icon: e.icon,
					label: e.label,
					danger: e.danger,
					onClick: () => {
						let t = h;
						y(null), e.onClick(t);
					}
				}, e.id)),
				/* @__PURE__ */ _(na, {
					icon: /* @__PURE__ */ _(R, { size: 16 }),
					label: u("ui.dt_copy_card"),
					onClick: () => {
						y(null), ga(b.row);
					}
				}),
				b.sel && /* @__PURE__ */ _(na, {
					icon: /* @__PURE__ */ _(le, { size: 16 }),
					label: u("ui.dt_copy_selection"),
					onClick: () => {
						y(null), ga(b.sel);
					}
				})
			]
		})
	] });
}
//#endregion
//#region ../../src/ui/data-table/Pagination.tsx
var Ca = "flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40";
function wa({ page: e, pageCount: t, total: n, pageSize: r, pageSizeOptions: i, onPageChange: a, onPageSizeChange: o, compact: s = !1, t: c }) {
	let l = Fi(c), u = n === 0 ? 0 : e * r + 1, d = Math.min((e + 1) * r, n);
	return /* @__PURE__ */ v("div", {
		className: "flex flex-wrap items-center justify-between gap-x-4 gap-y-2",
		style: { fontSize: "var(--kb-text-body)" },
		children: [/* @__PURE__ */ v("div", {
			className: "flex items-center gap-3 text-text-secondary",
			children: [!s && o && i && i.length > 1 && /* @__PURE__ */ v("span", {
				className: "flex items-center gap-1.5",
				role: "radiogroup",
				"aria-label": l("ui.dt_rows_per_page"),
				children: [/* @__PURE__ */ _("span", { children: l("ui.dt_rows_per_page") }), /* @__PURE__ */ _("span", {
					className: "flex items-center gap-0.5 rounded-md bg-surface-2 p-0.5",
					children: i.map((e) => /* @__PURE__ */ _("button", {
						type: "button",
						role: "radio",
						"aria-checked": e === r,
						onClick: () => o(e),
						className: `rounded-sm px-1.5 py-0.5 tabular-nums transition-colors
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${e === r ? "bg-surface-0 text-primary" : "text-text-secondary hover:text-text-primary"}`,
						children: e
					}, e))
				})]
			}), /* @__PURE__ */ v("span", {
				className: "tabular-nums",
				children: [
					u,
					"–",
					d,
					" / ",
					n
				]
			})]
		}), /* @__PURE__ */ v("div", {
			className: "flex items-center gap-0.5",
			children: [
				!s && /* @__PURE__ */ _("button", {
					type: "button",
					className: Ca,
					disabled: e <= 0,
					"aria-label": `${l("ui.dt_page")} 1`,
					onClick: () => a(0),
					children: /* @__PURE__ */ _(N, { size: 15 })
				}),
				/* @__PURE__ */ _("button", {
					type: "button",
					className: Ca,
					disabled: e <= 0,
					"aria-label": l("ui.dt_prev_page"),
					onClick: () => a(e - 1),
					children: /* @__PURE__ */ _(A, { size: 15 })
				}),
				/* @__PURE__ */ v("span", {
					className: "px-2 tabular-nums text-text-secondary",
					children: [
						e + 1,
						" / ",
						Math.max(1, t)
					]
				}),
				/* @__PURE__ */ _("button", {
					type: "button",
					className: Ca,
					disabled: e >= t - 1,
					"aria-label": l("ui.dt_next_page"),
					onClick: () => a(e + 1),
					children: /* @__PURE__ */ _(j, { size: 15 })
				}),
				!s && /* @__PURE__ */ _("button", {
					type: "button",
					className: Ca,
					disabled: e >= t - 1,
					"aria-label": `${l("ui.dt_page")} ${Math.max(1, t)}`,
					onClick: () => a(t - 1),
					children: /* @__PURE__ */ _(P, { size: 15 })
				})
			]
		})]
	});
}
//#endregion
//#region ../../src/ui/data-table/Skeleton.tsx
function Ta({ columns: e, rows: t = 5, selectable: n = !1, t: r }) {
	let i = Fi(r), a = (e, t) => 45 + (e * 7 + t * 23) % 5 * 11;
	return /* @__PURE__ */ v("div", { children: [/* @__PURE__ */ _("span", {
		role: "status",
		className: "sr-only",
		children: i("ui.dt_loading")
	}), /* @__PURE__ */ _("div", {
		"aria-hidden": !0,
		className: "divide-y divide-border",
		children: Array.from({ length: t }, (t, r) => /* @__PURE__ */ v("div", {
			className: "flex items-center gap-4 px-4 py-3",
			children: [n && /* @__PURE__ */ _("span", { className: "h-[18px] w-[18px] shrink-0 rounded-sm bg-surface-2 animate-pulse" }), Array.from({ length: e }, (e, t) => /* @__PURE__ */ _("span", {
				className: "h-3.5 flex-1 rounded-sm bg-surface-2 animate-pulse",
				style: { maxWidth: `${a(r, t)}%` }
			}, t))]
		}, r))
	})] });
}
//#endregion
//#region ../../src/ui/data-table/Toolbar.tsx
var Ea = 3, Da = 1;
function Oa({ title: e, toolbar: t, columns: n, hidden: r, onHiddenChange: i, configurableColumns: a, selectedRows: o, bulkActions: s, onClearSelection: c, compact: l, touch: u, t: d }) {
	let f = Fi(d), h = p(null), b = p(null), [x, S] = m(null), [C, w] = m(null), [T, E] = m(!1), D = o.length > 0 && !!s?.length, O = (e, t) => {
		let n = e.current?.getBoundingClientRect();
		n && t({
			top: n.bottom + 4,
			left: n.left
		});
	};
	if (D) {
		let e = l ? Da : Ea, t = s.slice(0, e), n = s.slice(e);
		return /* @__PURE__ */ v("div", {
			className: "flex min-w-0 items-center gap-2 rounded-lg bg-primary-light px-2.5 py-2",
			children: [
				/* @__PURE__ */ _("button", {
					type: "button",
					onClick: c,
					"aria-label": f("ui.dt_clear_sel"),
					className: "shrink-0 rounded-md p-1 text-primary transition-colors hover:bg-[var(--kb-black-08)]\n                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
					children: /* @__PURE__ */ _(pe, { size: 15 })
				}),
				/* @__PURE__ */ v("span", {
					className: "min-w-0 flex-1 truncate text-primary",
					style: { fontSize: "var(--kb-text-body)" },
					children: [
						o.length,
						" ",
						f("ui.dt_selected")
					]
				}),
				t.map((e) => /* @__PURE__ */ _($e, {
					size: "sm",
					variant: e.danger ? "danger" : "secondary",
					icon: e.icon,
					onClick: () => e.onClick(o),
					className: "shrink-0",
					children: l ? null : e.label
				}, e.id)),
				n.length > 0 && /* @__PURE__ */ v(g, { children: [
					/* @__PURE__ */ _("button", {
						ref: b,
						type: "button",
						"aria-label": f("ui.more_actions"),
						"aria-haspopup": "menu",
						onClick: () => u ? E(!0) : O(b, w),
						className: "shrink-0 rounded-md p-1.5 text-primary transition-colors hover:bg-[var(--kb-black-08)]\n                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
						children: /* @__PURE__ */ _(q, { size: 16 })
					}),
					C && /* @__PURE__ */ _(Rr, {
						pos: C,
						onClose: () => w(null),
						items: n.map((e) => ({
							type: "action",
							label: e.label,
							icon: e.icon,
							danger: e.danger,
							onClick: () => {
								e.onClick(o), w(null);
							}
						}))
					}),
					/* @__PURE__ */ v(ta, {
						open: T,
						onClose: () => E(!1),
						title: `${o.length} ${f("ui.dt_selected")}`,
						children: [
							n.map((e) => /* @__PURE__ */ _(na, {
								icon: e.icon,
								label: e.label,
								danger: e.danger,
								onClick: () => {
									E(!1), e.onClick(o);
								}
							}, e.id)),
							/* @__PURE__ */ _(ra, {}),
							/* @__PURE__ */ _(na, {
								label: f("ui.dt_clear_sel"),
								onClick: () => {
									E(!1), c();
								}
							})
						]
					})
				] })
			]
		});
	}
	return !e && !t && !a ? null : /* @__PURE__ */ v("div", {
		className: y("flex min-w-0 gap-2", l ? "flex-col items-stretch" : "items-center"),
		children: [
			e != null && /* @__PURE__ */ _("h3", {
				className: "min-w-0 flex-1 truncate font-medium text-text-primary",
				style: { fontSize: "var(--kb-text-heading)" },
				children: e
			}),
			t && /* @__PURE__ */ _("div", {
				className: y("min-w-0", l ? "" : "flex-1"),
				children: t
			}),
			a && /* @__PURE__ */ v("div", {
				className: y("shrink-0", l && "self-end"),
				children: [/* @__PURE__ */ v("button", {
					ref: h,
					type: "button",
					"aria-haspopup": "menu",
					"aria-label": f("ui.dt_columns"),
					onClick: () => O(h, S),
					className: "flex h-8 items-center gap-1.5 rounded-md border border-border bg-white px-2.5\n                       text-text-secondary transition-colors hover:bg-surface-1 hover:text-text-primary\n                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
					style: { fontSize: "var(--kb-text-body)" },
					children: [/* @__PURE__ */ _(J, { size: 14 }), !l && f("ui.dt_columns")]
				}), x && /* @__PURE__ */ _(Rr, {
					pos: x,
					minWidth: 220,
					onClose: () => S(null),
					items: [{
						type: "label",
						text: f("ui.dt_columns")
					}, ...n.map((e) => ({
						type: "custom",
						render: () => /* @__PURE__ */ _("div", {
							className: "px-2.5 py-1.5",
							children: /* @__PURE__ */ _(Rt, {
								checked: !r.includes(e.id),
								disabled: e.required,
								label: va(e),
								onChange: (t) => i(t ? r.filter((t) => t !== e.id) : [...r, e.id])
							})
						})
					}))]
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/data-table/useColumnResize.ts
var ka = 56;
function Aa() {
	let [e, t] = m({}), n = p(null), r = Object.keys(e).length > 0, i = (e) => {
		let t = e.closest("tr");
		if (!t) return {};
		let n = {};
		return t.querySelectorAll("th[data-col]").forEach((e) => {
			n[e.getAttribute("data-col") ?? ""] = Math.round(e.getBoundingClientRect().width);
		}), n;
	};
	return {
		widths: e,
		pinned: r,
		begin: o((e, r) => {
			e.preventDefault(), e.stopPropagation();
			let a = e.currentTarget, o = i(a), s = o[r] ?? ka;
			n.current = {
				id: r,
				startX: e.clientX,
				startW: s
			}, t((e) => ({
				...o,
				...e,
				[r]: s
			})), a.setPointerCapture(e.pointerId);
		}, []),
		move: o((e) => {
			let r = n.current;
			if (!r) return;
			let i = Math.max(ka, r.startW + (e.clientX - r.startX));
			t((e) => e[r.id] === i ? e : {
				...e,
				[r.id]: i
			});
		}, []),
		end: o((e) => {
			n.current && e.currentTarget.releasePointerCapture(e.pointerId), n.current = null;
		}, []),
		nudge: o((e, n, r) => {
			t((t) => {
				let a = Object.keys(t).length ? t : i(r);
				return {
					...a,
					[e]: Math.max(ka, (a[e] ?? ka) + n)
				};
			});
		}, []),
		reset: o((e) => {
			t((t) => {
				let { [e]: n, ...r } = t;
				return r;
			});
		}, [])
	};
}
//#endregion
//#region ../../src/ui/data-table/DataTable.tsx
var ja = {
	left: "text-left",
	right: "text-right",
	center: "text-center"
}, Ma = {
	left: "-mx-1",
	right: "-mr-1 ml-auto",
	center: "mx-auto"
};
function Na({ rows: e, columns: t, rowKey: n, loading: r = !1, skeletonRows: i = 5, error: a, onRetry: o, filtered: s = !1, onClearFilters: l, emptyState: u, noResultsState: d, defaultSort: h = null, sort: g, onSortChange: b, manualSort: S = !1, pageSize: T = 25, pageSizeOptions: E = [
	10,
	25,
	50,
	100
], onPageSizeChange: D, page: O, onPageChange: k, totalRows: A, manualPagination: j = !1, selectable: M = !1, selectedIds: N, onSelectionChange: P, bulkActions: I, rowActions: ee, onRowClick: z, configurableColumns: B = !1, hiddenColumns: H, onHiddenColumnsChange: U, resizableColumns: W = !0, title: G, toolbar: K, layout: te = "auto", cardsBelow: q = 700, minTableWidth: re = 640, className: ie, t: oe }) {
	let J = Fi(oe), ce = p(null), Y = _a(ce), ue = te === "cards" || te === "auto" && Y !== null && Y < q, de = Yi(), [fe, pe] = m(h), X = g === void 0 ? fe : g, me = (e) => {
		g === void 0 && pe(e), b?.(e);
	}, [he, ge] = m(0), [_e, Z] = m(T), ve = O === void 0 ? he : O, Q = D ? T : _e, ye = Q > 0, be = (e) => {
		O === void 0 && ge(e), k?.(e);
	}, xe = (e) => {
		D ? D(e) : Z(e), be(0);
	}, [Se, Ce] = m(() => t.filter((e) => e.defaultHidden).map((e) => e.id)), we = H ?? Se, Te = (e) => {
		H === void 0 && Ce(e), U?.(e);
	}, Ee = f(() => t.filter((e) => !we.includes(e.id)), [t, we]), [De, Oe] = m([]), ke = N ?? De, Ae = f(() => new Set(ke), [ke]), je = (e) => {
		N === void 0 && Oe(e), P?.(e);
	}, Me = (e) => je(Ae.has(e) ? ke.filter((t) => t !== e) : [...ke, e]), Ne = f(() => S ? e : ba(e, t, X), [
		e,
		t,
		X,
		S
	]), Pe = j ? A ?? e.length : Ne.length, Fe = ye ? Math.max(1, Math.ceil(Pe / Q)) : 1, Ie = f(() => !ye || j ? Ne : Ne.slice(ve * Q, ve * Q + Q), [
		Ne,
		ye,
		j,
		ve,
		Q
	]);
	c(() => {
		ye && ve > 0 && ve >= Fe && be(Fe - 1);
	}, [Fe]);
	let Le = f(() => Ne.filter((e) => Ae.has(n(e))), [
		Ne,
		Ae,
		n
	]), Re = Ie.map(n), ze = Re.length > 0 && Re.every((e) => Ae.has(e)), Be = Re.some((e) => Ae.has(e)), Ve = p(null);
	c(() => {
		let e = Ve.current?.querySelector("input");
		e && (e.indeterminate = Be && !ze);
	}, [Be, ze]);
	let He = () => je(ze ? ke.filter((e) => !Re.includes(e)) : [...new Set([...ke, ...Re])]), [Ue, We] = m(null), [Ge, Ke] = m(null), qe = Aa(), $ = W && !ue && !de, [Je, Ye] = m(null), Xe = (e) => {
		let t = e.target.closest?.("[data-col]"), n = e.currentTarget;
		if (!t || !n.contains(t)) return;
		e.preventDefault();
		let r = t.getAttribute("data-col") ?? "", i = Ee.find((e) => e.id === r);
		Ye({
			top: e.clientY,
			left: e.clientX,
			cell: fa(t),
			row: pa(n),
			colId: r,
			colLabel: i ? va(i) : r,
			sel: ha()
		});
	}, Ze = () => {
		if (!Je) return [];
		let e = (e) => () => {
			ga(e), Ye(null);
		}, t = [
			{
				type: "action",
				label: J("ui.dt_copy_cell"),
				icon: /* @__PURE__ */ _(R, { size: 14 }),
				onClick: e(Je.cell)
			},
			{
				type: "action",
				label: J("ui.dt_copy_row"),
				icon: /* @__PURE__ */ _(ae, { size: 14 }),
				onClick: e(Je.row)
			},
			{
				type: "action",
				label: J("ui.dt_copy_column", { name: Je.colLabel }),
				icon: /* @__PURE__ */ _(L, { size: 14 }),
				onClick: () => {
					ce.current && ga(ma(ce.current, Je.colId)), Ye(null);
				}
			}
		];
		return Je.sel && (t.push({ type: "separator" }), t.push({
			type: "action",
			label: J("ui.dt_copy_selection"),
			icon: /* @__PURE__ */ _(le, { size: 14 }),
			onClick: e(Je.sel)
		})), t;
	}, Qe = (e) => (ee ?? []).filter((t) => !t.hidden?.(e)), $e = !!ee?.length, et = a == null ? s ? d ?? /* @__PURE__ */ _(Bi, {
		t: oe,
		variant: "no-results",
		icon: /* @__PURE__ */ _(se, { size: 24 }),
		title: J("ui.dt_nores_title"),
		description: J("ui.dt_nores_desc"),
		action: l ? {
			label: J("ui.dt_clear_filters"),
			onClick: l
		} : void 0
	}) : u ?? /* @__PURE__ */ _(Bi, {
		t: oe,
		variant: "first-use",
		icon: /* @__PURE__ */ _(V, { size: 24 }),
		title: J("ui.dt_empty_title"),
		description: J("ui.dt_empty_desc")
	}) : /* @__PURE__ */ _(Bi, {
		t: oe,
		variant: "error",
		icon: /* @__PURE__ */ _(x, { size: 24 }),
		title: J("ui.dt_error_title"),
		description: typeof a == "boolean" ? J("ui.dt_error_desc") : a,
		action: o ? {
			label: J("ui.retry"),
			onClick: o
		} : void 0
	}), tt = !r && (a != null || Ie.length === 0), nt = (e) => {
		let t = X?.columnId === e.id, n = t ? X.direction : void 0;
		return /* @__PURE__ */ v("button", {
			type: "button",
			onClick: () => me(xa(X, e.id)),
			"aria-label": `${va(e)} — ${J(n === "asc" ? "ui.dt_sort_desc" : "ui.dt_sort_asc")}`,
			className: y("group flex items-center gap-1 rounded-sm px-1 py-0.5 transition-colors", "hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary", Ma[e.align ?? "left"]),
			children: [/* @__PURE__ */ _("span", {
				className: "truncate",
				children: e.header
			}), t ? _(n === "asc" ? w : C, {
				size: 12,
				className: "shrink-0 text-primary"
			}) : /* @__PURE__ */ _(F, {
				size: 12,
				className: "shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
			})]
		});
	};
	return /* @__PURE__ */ v("div", {
		ref: ce,
		className: y("flex w-full min-w-0 flex-col gap-2", ie),
		children: [
			/* @__PURE__ */ _(Oa, {
				title: G,
				toolbar: K,
				columns: t,
				hidden: we,
				onHiddenChange: Te,
				configurableColumns: B,
				selectedRows: Le,
				bulkActions: I,
				onClearSelection: () => je([]),
				compact: ue,
				touch: de,
				t: oe
			}),
			/* @__PURE__ */ v("div", {
				className: "min-w-0 overflow-hidden rounded-xl border border-border bg-surface-0",
				children: [r ? /* @__PURE__ */ _(Ta, {
					columns: Math.max(1, Ee.length),
					rows: i,
					selectable: M,
					t: oe
				}) : tt ? et : ue ? /* @__PURE__ */ _(Sa, {
					rows: Ie,
					columns: Ee,
					rowKey: n,
					selectable: M,
					selected: Ae,
					onToggle: Me,
					rowActions: ee,
					onRowClick: z,
					touch: de,
					t: oe
				}) : /* @__PURE__ */ _("div", {
					className: "min-w-0 overflow-x-auto",
					children: /* @__PURE__ */ v("table", {
						className: "w-full border-collapse",
						style: {
							minWidth: re,
							tableLayout: qe.pinned ? "fixed" : "auto"
						},
						children: [/* @__PURE__ */ _("thead", { children: /* @__PURE__ */ v("tr", {
							className: "border-b border-border bg-surface-1",
							children: [
								M && /* @__PURE__ */ _("th", {
									scope: "col",
									className: "w-10 px-3 py-2.5",
									children: /* @__PURE__ */ _("span", {
										ref: Ve,
										className: "flex",
										children: /* @__PURE__ */ _(Rt, {
											checked: ze,
											onChange: He,
											label: J("ui.dt_select_all"),
											labelClassName: "sr-only"
										})
									})
								}),
								Ee.map((e) => {
									let t = X?.columnId === e.id;
									return /* @__PURE__ */ v("th", {
										scope: "col",
										"data-col": e.id,
										"aria-sort": t ? X.direction === "asc" ? "ascending" : "descending" : "none",
										className: y("relative px-4 py-2.5 font-medium text-text-secondary", ja[e.align ?? "left"]),
										style: {
											width: qe.widths[e.id] ?? e.width,
											minWidth: qe.widths[e.id] ? void 0 : e.minWidth,
											fontSize: "var(--kb-text-body)"
										},
										children: [e.sortValue ? nt(e) : /* @__PURE__ */ _("span", {
											className: "truncate",
											children: e.header
										}), $ && /* @__PURE__ */ _("span", {
											role: "separator",
											"aria-orientation": "vertical",
											"aria-label": J("ui.dt_resize_column", { name: va(e) }),
											tabIndex: 0,
											onPointerDown: (t) => qe.begin(t, e.id),
											onPointerMove: qe.move,
											onPointerUp: qe.end,
											onDoubleClick: () => qe.reset(e.id),
											onKeyDown: (t) => {
												let n = t.shiftKey ? 24 : 8;
												t.key === "ArrowRight" && (t.preventDefault(), qe.nudge(e.id, n, t.currentTarget)), t.key === "ArrowLeft" && (t.preventDefault(), qe.nudge(e.id, -n, t.currentTarget));
											},
											className: "absolute right-0 top-0 z-10 h-full w-2 translate-x-1/2 cursor-col-resize touch-none\n                                       select-none after:absolute after:inset-y-1 after:left-1/2 after:w-px\n                                       after:bg-transparent hover:after:bg-border-strong focus:outline-none\n                                       focus-visible:after:bg-primary"
										})]
									}, e.id);
								}),
								$e && /* @__PURE__ */ _("th", {
									scope: "col",
									className: "w-12 px-2 py-2.5",
									children: /* @__PURE__ */ _("span", {
										className: "sr-only",
										children: J("ui.actions")
									})
								})
							]
						}) }), /* @__PURE__ */ _("tbody", { children: Ie.map((e, t) => {
							let r = n(e), i = Ae.has(r), a = Qe(e);
							return /* @__PURE__ */ v("tr", {
								"aria-selected": M ? i : void 0,
								onClick: z ? () => z(e) : void 0,
								onContextMenu: Xe,
								className: y("border-b border-border transition-colors last:border-0", i ? "bg-primary-light" : y(t % 2 == 1 && "bg-surface-1", "hover:bg-surface-2"), z && "cursor-pointer"),
								children: [
									M && /* @__PURE__ */ _("td", {
										className: "px-3 py-2.5",
										onClick: (e) => e.stopPropagation(),
										children: /* @__PURE__ */ _(Rt, {
											checked: i,
											onChange: () => Me(r),
											label: J("ui.dt_select_row"),
											labelClassName: "sr-only"
										})
									}),
									Ee.map((t) => /* @__PURE__ */ _("td", {
										"data-col": t.id,
										className: y("px-4 py-2.5 text-text-primary", ja[t.align ?? "left"]),
										style: { fontSize: "var(--kb-text-body)" },
										children: t.cell(e)
									}, t.id)),
									$e && /* @__PURE__ */ _("td", {
										className: "px-2 py-2.5",
										onClick: (e) => e.stopPropagation(),
										children: a.length > 0 && /* @__PURE__ */ _("button", {
											type: "button",
											"aria-haspopup": "menu",
											"aria-label": J("ui.more_actions"),
											onClick: (t) => {
												if (de) {
													Ke(e);
													return;
												}
												let n = t.currentTarget.getBoundingClientRect();
												We({
													row: e,
													top: n.bottom + 4,
													left: Math.max(8, n.right - 200)
												});
											},
											className: "flex h-7 w-7 items-center justify-center rounded-md text-text-secondary\n                                         transition-colors hover:bg-surface-2 hover:text-text-primary\n                                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
											children: /* @__PURE__ */ _(ne, { size: 15 })
										})
									})
								]
							}, r);
						}) })]
					})
				}), ye && !r && !tt && Pe > 0 && /* @__PURE__ */ _("div", {
					className: "border-t border-border bg-surface-1 px-3 py-2",
					children: /* @__PURE__ */ _(wa, {
						page: ve,
						pageCount: Fe,
						total: Pe,
						pageSize: Q,
						pageSizeOptions: E,
						onPageChange: be,
						onPageSizeChange: xe,
						compact: ue,
						t: oe
					})
				})]
			}),
			Je && /* @__PURE__ */ _(Rr, {
				pos: {
					top: Je.top,
					left: Je.left
				},
				onClose: () => Ye(null),
				items: Ze()
			}),
			Ue && /* @__PURE__ */ _(Rr, {
				pos: {
					top: Ue.top,
					left: Ue.left
				},
				onClose: () => We(null),
				items: Qe(Ue.row).map((e) => ({
					type: "action",
					label: e.label,
					icon: e.icon,
					danger: e.danger,
					onClick: () => {
						e.onClick(Ue.row), We(null);
					}
				}))
			}),
			/* @__PURE__ */ _(ta, {
				open: Ge !== null,
				onClose: () => Ke(null),
				title: J("ui.actions"),
				children: Ge !== null && Qe(Ge).map((e) => /* @__PURE__ */ _(na, {
					icon: e.icon,
					label: e.label,
					danger: e.danger,
					onClick: () => {
						let t = Ge;
						Ke(null), e.onClick(t);
					}
				}, e.id))
			})
		]
	});
}
//#endregion
//#region ../../src/ui/AnchoredPopover.tsx
function Pa({ anchorRef: e, open: t, onClose: n, children: r, gap: i = 4, align: a = "left" }) {
	let o = p(null), [s, l] = m(null), { host: u, scoped: f } = Ye(), h = f ? "absolute" : "fixed", y = () => {
		let t = e.current, n = o.current;
		if (!t || !n) return;
		let r = t.getBoundingClientRect(), s = n.offsetWidth || 232, c = n.offsetHeight || 300, d = f && u ? u.getBoundingClientRect() : null, p = d ? d.left : 0, m = d ? d.top : 0, h = d ? d.width : window.innerWidth, g = d ? d.height : window.innerHeight, _ = r.bottom - m + i;
		_ + c > g - 8 && (_ = r.top - m - c - i), _ < 8 && (_ = 8);
		let v = a === "right" ? r.right - p - s : r.left - p;
		v + s > h - 8 && (v = h - s - 8), v < 8 && (v = 8), l({
			left: v,
			top: _
		});
	};
	return d(() => {
		if (!t) {
			l(null);
			return;
		}
		y();
	}, [t]), c(() => {
		if (!t) return;
		let e = () => y();
		return window.addEventListener("resize", e), window.addEventListener("scroll", e, !0), () => {
			window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0);
		};
	}, [t]), t ? X(/* @__PURE__ */ v(g, { children: [/* @__PURE__ */ _("div", {
		className: `${h} inset-0`,
		style: { zIndex: 199 },
		onMouseDown: n
	}), /* @__PURE__ */ _("div", {
		ref: o,
		className: h,
		style: {
			left: s?.left ?? 0,
			top: s?.top ?? 0,
			zIndex: 200,
			visibility: s ? "visible" : "hidden"
		},
		children: r
	})] }), u ?? document.body) : null;
}
//#endregion
//#region ../../src/ui/windowZStore.ts
var Fa = 1e3, Ia = Ae((e, t) => ({
	counter: Fa,
	next: () => {
		let n = t().counter + 1;
		return e({ counter: n }), n;
	}
}));
//#endregion
//#region ../../src/ui/FloatingWindow.tsx
function La({ title: e, icon: t, children: n, titleActions: r, popout: i, onClose: a, defaultWidth: l = 560, defaultHeight: u, minWidth: d = 280, minHeight: h = 120, resizable: y = !1, backdrop: b = !1, className: x = "", padding: S, actions: C, t: w }) {
	let T = p(null), [E, D] = m(() => Ia.getState().next()), [O, k] = m(0), { host: A, scoped: j } = Ye(), M = j ? "absolute" : "fixed", N = s(He), P = f(() => {
		if (typeof document > "u") return {};
		let e = N ?? window.location.pathname.split("/").filter(Boolean)[0] ?? "";
		if (!e) return {};
		let t = document.querySelector(`[data-module="${CSS.escape(e)}"]`);
		if (!t) return {};
		let n = { "data-module": e };
		for (let e of [
			"data-kb-appearance",
			"data-kb-density",
			"data-kb-scheme"
		]) {
			let r = t.getAttribute(e);
			r && (n[e] = r);
		}
		return n;
	}, [N]), F = p(!1), I = p({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0
	}), ee = p(!1), L = p(!1), R = p(""), z = p({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0,
		ww: 0,
		wh: 0
	}), B = o(() => {
		D(Ia.getState().next());
	}, []), V = o(() => {
		let e = T.current;
		if (!e || ee.current) return;
		let t = e.getBoundingClientRect();
		e.style.transform = "none", e.style.left = `${t.left}px`, e.style.top = `${t.top}px`, ee.current = !0;
	}, []), H = o((e) => {
		if (j || e.target.closest("button,a,input,select,textarea")) return;
		let t = T.current;
		if (!t) return;
		B(), V();
		let n = t.getBoundingClientRect();
		F.current = !0, I.current = {
			mx: e.clientX,
			my: e.clientY,
			wx: n.left,
			wy: n.top
		}, e.preventDefault();
	}, [
		B,
		V,
		j
	]), U = o((e) => {
		if (j) return;
		let t = T.current;
		if (!t) return;
		B(), V();
		let n = t.getBoundingClientRect();
		L.current = !0, R.current = e.currentTarget.dataset.edge ?? "", z.current = {
			mx: e.clientX,
			my: e.clientY,
			wx: n.left,
			wy: n.top,
			ww: n.width,
			wh: n.height
		}, e.preventDefault(), e.stopPropagation();
	}, [
		B,
		V,
		j
	]);
	c(() => {
		let e = (e) => {
			let t = T.current;
			if (t) {
				if (F.current) {
					let { mx: n, my: r, wx: i, wy: a } = I.current, o = i + e.clientX - n, s = a + e.clientY - r, c = window.innerWidth - 100, l = window.innerHeight - 40;
					t.style.left = `${Math.max(-t.offsetWidth + 100, Math.min(c, o))}px`, t.style.top = `${Math.max(0, Math.min(l, s))}px`;
					return;
				}
				if (L.current) {
					let { mx: n, my: r, wx: i, wy: a, ww: o, wh: s } = z.current, c = e.clientX - n, l = e.clientY - r, u = R.current, f = o, p = s, m = i, g = a;
					u.includes("e") && (f = Math.max(d, o + c)), u.includes("s") && (p = Math.max(h, s + l)), u.includes("w") && (f = Math.max(d, o - c), m = i + (o - f)), u.includes("n") && (p = Math.max(h, s - l), g = a + (s - p)), t.style.width = `${f}px`, t.style.height = `${p}px`, t.style.left = `${m}px`, t.style.top = `${g}px`;
				}
			}
		}, t = () => {
			F.current = !1, L.current = !1;
		};
		return window.addEventListener("mousemove", e), window.addEventListener("mouseup", t), () => {
			window.removeEventListener("mousemove", e), window.removeEventListener("mouseup", t);
		};
	}, [d, h]), c(() => {
		let e = (e) => {
			if (e.key === "Escape") {
				if (i && !j && window.location.pathname + window.location.search === i.route) try {
					window.close();
				} catch {}
				a();
			}
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [
		a,
		i,
		j
	]), c(() => {
		let e = T.current;
		if (!e || j || u !== void 0) return;
		let t = 0, n = () => {
			if (!e.querySelector("[role=\"tablist\"],[data-fw-tabs]")) return;
			let n = window.innerHeight - 16, r = Math.min(e.offsetHeight, n);
			r > t + .5 && (t = r, k(r));
		};
		n();
		let r = new ResizeObserver(n);
		return r.observe(e), () => r.disconnect();
	}, [j, u]);
	let W = !!(i && i.auto !== !1 && typeof window < "u" && window.kubunoDesktop && window.location.pathname + window.location.search !== i.route), G = p(!1);
	if (c(() => {
		if (W && !G.current && i) {
			G.current = !0;
			let t = i.label ?? (typeof e == "string" ? e : void 0), n = i.width || i.height ? {
				width: i.width,
				height: i.height
			} : void 0;
			window.kubunoDesktop?.openWindow(i.route, t, n), a();
		}
	}, [W]), W) return null;
	let K = !!(i && typeof window < "u" && !j && window.location.pathname + window.location.search === i.route), te = Zi(), q = K || te && !j, ne = () => {
		if (K && typeof window < "u") try {
			window.close();
		} catch {}
		a();
	}, re = Fi(w), ie = C?.cancel === !1 ? null : {
		label: C?.cancel?.label ?? re("ui.cancel"),
		onClick: C?.cancel?.onClick ?? ne,
		disabled: C?.cancel?.disabled
	}, ae = C ? /* @__PURE__ */ v("div", {
		className: "kb-window-footer flex items-center gap-2 px-4 py-3 flex-shrink-0",
		children: [C.extra && /* @__PURE__ */ _("div", {
			className: "min-w-0 flex-1",
			children: C.extra
		}), /* @__PURE__ */ v("div", {
			className: "ms-auto flex items-center gap-2",
			children: [C.confirm && /* @__PURE__ */ _($e, {
				variant: C.confirm.danger ? "textDanger" : "text",
				className: "min-w-[96px]",
				disabled: C.confirm.disabled,
				loading: C.confirm.loading,
				autoFocus: C.confirm.autoFocus,
				onClick: C.confirm.onClick,
				children: C.confirm.label
			}), ie && /* @__PURE__ */ _($e, {
				variant: "ghost",
				className: "min-w-[96px]",
				disabled: ie.disabled,
				onClick: ie.onClick,
				children: ie.label
			})]
		})]
	}) : null, oe = y ? /* @__PURE__ */ v(g, { children: [
		/* @__PURE__ */ _("div", {
			"data-edge": "n",
			onMouseDown: U,
			className: "absolute top-0    left-2  right-2  h-[5px] cursor-n-resize  z-10"
		}),
		/* @__PURE__ */ _("div", {
			"data-edge": "s",
			onMouseDown: U,
			className: "absolute bottom-0 left-2  right-2  h-[5px] cursor-s-resize  z-10"
		}),
		/* @__PURE__ */ _("div", {
			"data-edge": "w",
			onMouseDown: U,
			className: "absolute top-2   left-0  bottom-2  w-[5px] cursor-w-resize  z-10"
		}),
		/* @__PURE__ */ _("div", {
			"data-edge": "e",
			onMouseDown: U,
			className: "absolute top-2   right-0 bottom-2  w-[5px] cursor-e-resize  z-10"
		}),
		/* @__PURE__ */ _("div", {
			"data-edge": "nw",
			onMouseDown: U,
			className: "absolute top-0    left-0  w-3 h-3  cursor-nw-resize z-20"
		}),
		/* @__PURE__ */ _("div", {
			"data-edge": "ne",
			onMouseDown: U,
			className: "absolute top-0    right-0 w-3 h-3  cursor-ne-resize z-20"
		}),
		/* @__PURE__ */ _("div", {
			"data-edge": "sw",
			onMouseDown: U,
			className: "absolute bottom-0 left-0  w-3 h-3  cursor-sw-resize z-20"
		}),
		/* @__PURE__ */ _("div", {
			"data-edge": "se",
			onMouseDown: U,
			className: "kb-window-grip absolute bottom-[2px] right-[2px] w-[18px] h-[18px] rounded cursor-nwse-resize z-20"
		})
	] }) : null;
	return X(/* @__PURE__ */ v(g, { children: [b && !K && /* @__PURE__ */ _("div", {
		className: `${M} inset-0 ${j ? "bg-black/15" : "bg-black/30"} backdrop-blur-[1px] no-print`,
		style: { zIndex: E - 1 },
		onClick: a
	}), /* @__PURE__ */ v("div", {
		ref: T,
		...P,
		role: "dialog",
		"aria-modal": b && !K,
		className: `${M} flex flex-col overflow-hidden no-print ${x} ${q ? "inset-0 bg-white" : "kb-window"}`,
		style: q ? {
			width: "100vw",
			height: "100dvh",
			left: 0,
			top: 0,
			zIndex: E
		} : {
			width: l,
			height: u,
			minWidth: j ? `min(${d}px, calc(100% - 16px))` : `min(${d}px, calc(100vw - 16px))`,
			minHeight: O ? `${O}px` : j ? `min(${h}px, calc(100% - 16px))` : `min(${h}px, calc(100vh - 16px))`,
			maxWidth: j ? "calc(100% - 16px)" : "calc(100vw - 16px)",
			maxHeight: j ? "calc(100% - 16px)" : "calc(100vh - 16px)",
			zIndex: E,
			left: "50%",
			top: "33%",
			transform: "translate(-50%, -33%)"
		},
		onMouseDown: q ? void 0 : B,
		children: [
			!q && oe,
			/* @__PURE__ */ v("div", {
				className: `kb-window-titlebar flex items-center gap-2.5 px-4 py-2.5 min-h-11 flex-shrink-0 select-none ${q ? "" : "cursor-grab active:cursor-grabbing"}`,
				onMouseDown: q ? void 0 : H,
				children: [
					t && /* @__PURE__ */ _("div", {
						className: "flex-shrink-0",
						children: t
					}),
					/* @__PURE__ */ _("div", {
						className: "flex-1 min-w-0 font-medium",
						style: { fontSize: "var(--kb-text-heading)" },
						children: e
					}),
					r && /* @__PURE__ */ _("div", {
						className: "kb-window-actions flex items-center gap-1 flex-shrink-0",
						onMouseDown: (e) => e.stopPropagation(),
						children: r
					}),
					i && typeof window < "u" && window.kubunoDesktop && window.location.pathname + window.location.search !== i.route && /* @__PURE__ */ _("button", {
						onClick: () => {
							let t = i.label ?? (typeof e == "string" ? e : void 0), n = i.width || i.height ? {
								width: i.width,
								height: i.height
							} : void 0;
							window.kubunoDesktop?.openWindow(i.route, t, n), a();
						},
						onMouseDown: (e) => e.stopPropagation(),
						title: "Détacher dans une fenêtre",
						className: "flex-shrink-0 p-1.5 rounded-lg text-current opacity-80\n                         hover:opacity-100 hover:bg-white/20 transition-colors",
						children: /* @__PURE__ */ _(Y, { size: 14 })
					}),
					/* @__PURE__ */ _("button", {
						onClick: ne,
						onMouseDown: (e) => e.stopPropagation(),
						title: "Fermer (Échap)",
						className: "flex-shrink-0 grid place-items-center w-[30px] h-[30px] rounded-[5px]\n                       text-current opacity-80 transition-colors hover:opacity-100 hover:bg-white/20",
						children: /* @__PURE__ */ _(pe, {
							size: 15,
							strokeWidth: 2.2
						})
					})
				]
			}),
			/* @__PURE__ */ _("div", {
				className: `flex-1 flex flex-col min-h-0 overflow-auto ${q ? "bg-white" : "kb-window-content"}`,
				style: { padding: S ?? 0 },
				children: n
			}),
			ae
		]
	})] }), A ?? document.body);
}
//#endregion
//#region ../../src/ui/ConfirmDialog.tsx
function Ra({ title: e, message: t, confirmLabel: n = "Confirmer", cancelLabel: r = "Annuler", variant: i = "default", hideCancel: a = !1, onConfirm: o, onCancel: s }) {
	c(() => {
		let e = (e) => {
			e.key === "Enter" && o();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [o]);
	let l = i === "danger" ? "bg-red-100" : i === "warning" ? "bg-amber-100" : "bg-gray-100", u = i === "danger" ? "text-red-600" : i === "warning" ? "text-amber-600" : "text-gray-600";
	return /* @__PURE__ */ _(La, {
		title: e,
		onClose: s,
		defaultWidth: 380,
		backdrop: !0,
		actions: {
			confirm: {
				label: n,
				onClick: o,
				danger: i === "danger",
				autoFocus: !0
			},
			cancel: a ? !1 : {
				label: r,
				onClick: s
			}
		},
		children: /* @__PURE__ */ v("div", {
			className: "p-6 flex flex-col gap-4",
			children: [/* @__PURE__ */ _("div", {
				className: `w-12 h-12 rounded-full ${l} flex items-center justify-center flex-shrink-0`,
				children: _(i === "danger" ? ue : S, { className: `w-6 h-6 ${u}` })
			}), /* @__PURE__ */ _("p", {
				className: "text-sm text-gray-500 leading-relaxed whitespace-pre-line",
				children: t
			})]
		})
	});
}
//#endregion
//#region ../../src/ui/ConflictDialog.tsx
function za({ type: e, name: t, onChoice: n }) {
	let r = e === "folder";
	return /* @__PURE__ */ _(La, {
		title: "Conflit de nom",
		onClose: () => n("cancel"),
		defaultWidth: 400,
		backdrop: !0,
		children: /* @__PURE__ */ v("div", {
			className: "p-6 flex flex-col gap-5",
			children: [
				/* @__PURE__ */ v("p", {
					className: "text-sm text-text-secondary leading-relaxed",
					children: [
						"Un ",
						r ? "dossier" : "fichier",
						" nommé",
						" ",
						/* @__PURE__ */ v("span", {
							className: "font-medium text-text-primary",
							children: [
								"«\xA0",
								t,
								"\xA0»"
							]
						}),
						" ",
						"existe déjà à cet emplacement."
					]
				}),
				/* @__PURE__ */ v("button", {
					type: "button",
					onClick: () => n("overwrite"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ _("div", {
						className: "w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ _(W, {
							size: 15,
							className: "text-danger"
						})
					}), /* @__PURE__ */ v("div", { children: [/* @__PURE__ */ _("p", {
						className: "text-sm font-medium text-text-primary",
						children: r ? "Fusionner" : "Écraser"
					}), /* @__PURE__ */ _("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: r ? "Les deux dossiers seront fusionnés. Les fichiers en conflit seront remplacés." : "Le fichier existant sera remplacé par le nouveau."
					})] })]
				}),
				/* @__PURE__ */ v("button", {
					type: "button",
					onClick: () => n("keep_both"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ _("div", {
						className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ _(R, {
							size: 15,
							className: "text-primary"
						})
					}), /* @__PURE__ */ v("div", { children: [/* @__PURE__ */ _("p", {
						className: "text-sm font-medium text-text-primary",
						children: "Conserver les deux"
					}), /* @__PURE__ */ v("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: [
							"Le nouvel élément sera renommé automatiquement (ex.\xA0: «\xA0",
							t,
							" (2)\xA0»)."
						]
					})] })]
				}),
				/* @__PURE__ */ _("button", {
					type: "button",
					onClick: () => n("cancel"),
					className: "self-end text-sm text-text-secondary hover:text-text-primary transition-colors px-2 py-1",
					children: "Annuler"
				})
			]
		})
	});
}
var Ba = 8;
function Va(e, t, n, r = {
	width: window.innerWidth,
	height: window.innerHeight
}) {
	let i = t + 14 + n.height + Ba <= r.height, a = i ? t + 14 : t - 14 - n.height, o = e;
	return o + n.width + Ba > r.width && (o = r.width - n.width - Ba), o < Ba && (o = Ba), {
		left: o,
		top: Math.max(Ba, a),
		below: i
	};
}
//#endregion
//#region ../../src/ui/Tooltip.tsx
var Ha = {
	position: "fixed",
	background: "rgba(60, 64, 67, 0.95)",
	color: "#fff",
	fontSize: 12,
	lineHeight: "16px",
	fontWeight: 500,
	padding: "6px 10px",
	borderRadius: 4,
	boxShadow: "0 1px 3px rgba(0,0,0,.3), 0 4px 8px rgba(0,0,0,.15)",
	maxWidth: 280,
	whiteSpace: "pre-line",
	zIndex: 1e4,
	pointerEvents: "none",
	userSelect: "none"
};
function Ua({ label: e, children: t, delay: r = 400, disabled: i }) {
	let [a, s] = m(null), l = p(null), u = p(null), f = p({
		x: 0,
		y: 0
	}), h = o(() => {
		u.current &&= (clearTimeout(u.current), null), s(null);
	}, []);
	if (c(() => () => {
		u.current && clearTimeout(u.current);
	}, []), d(() => {
		if (!a || a.ready || !l.current) return;
		let e = l.current.getBoundingClientRect(), t = Va(f.current.x, f.current.y, {
			width: e.width,
			height: e.height
		});
		s({
			left: t.left,
			top: t.top,
			ready: !0
		});
	}, [a]), i || e == null || e === "") return t;
	let y = (e) => {
		f.current = {
			x: e.clientX,
			y: e.clientY
		}, u.current && clearTimeout(u.current), u.current = window.setTimeout(() => {
			let e = Va(f.current.x, f.current.y, {
				width: 0,
				height: 0
			});
			s({
				left: e.left,
				top: e.top,
				ready: !1
			});
		}, r);
	}, b = (e) => {
		f.current = {
			x: e.clientX,
			y: e.clientY
		};
	};
	return /* @__PURE__ */ v(g, { children: [n(t, {
		onMouseEnter: (e) => {
			y(e), t.props.onMouseEnter?.(e);
		},
		onMouseMove: (e) => {
			b(e), t.props.onMouseMove?.(e);
		},
		onMouseLeave: (e) => {
			h(), t.props.onMouseLeave?.(e);
		},
		onMouseDown: (e) => {
			h(), t.props.onMouseDown?.(e);
		}
	}), a && X(/* @__PURE__ */ _("div", {
		ref: l,
		role: "tooltip",
		"data-kb-tooltip": !0,
		style: {
			...Ha,
			left: a.left,
			top: a.top,
			visibility: a.ready ? "visible" : "hidden"
		},
		children: e
	}), document.body)] });
}
//#endregion
//#region ../../src/ui/useSaveShortcut.ts
var Wa = [], Ga = !1;
function Ka(e) {
	if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== "s") return;
	let t = Wa[Wa.length - 1];
	t && (e.preventDefault(), e.stopPropagation(), t());
}
function qa(e, t = !0) {
	let n = p(e);
	n.current = e, c(() => {
		if (!t) return;
		let e = () => n.current();
		return Wa.push(e), Ga ||= (document.addEventListener("keydown", Ka, !0), !0), () => {
			let t = Wa.lastIndexOf(e);
			t !== -1 && Wa.splice(t, 1);
		};
	}, [t]);
}
//#endregion
//#region ../../src/ui/Toast.tsx
var Ja = r(null), Ya = {
	info: {
		icon: "text-primary",
		Glyph: H
	},
	success: {
		icon: "text-success",
		Glyph: O
	},
	warning: {
		icon: "text-warning",
		Glyph: S
	},
	danger: {
		icon: "text-danger",
		Glyph: x
	}
}, Xa = 0, Za = () => `kb-toast-${++Xa}`, Qa = {
	"bottom-right": "bottom-4 right-4 items-end",
	"bottom-left": "bottom-4 left-4 items-start",
	"top-right": "top-4 right-4 items-end",
	"top-center": "top-4 left-1/2 -translate-x-1/2 items-center"
};
function $a({ children: e, max: t = 4, placement: n = "bottom-right", t: r }) {
	let i = Fi(r), [a, s] = m([]), l = Zi(), { host: u } = Ye(), d = p(!1), h = p(/* @__PURE__ */ new Map()), g = o((e) => {
		h.current.delete(e), s((t) => t.filter((t) => t.id !== e));
	}, []), b = o(() => {
		h.current.clear(), s([]);
	}, []), x = o((e) => {
		let n = e.variant ?? "info", r = e.duration ?? (n === "danger" ? 6e3 : 4e3), i = e.id ?? Za(), a = {
			...e,
			id: i,
			variant: n,
			duration: r
		};
		return r > 0 && h.current.set(i, r), s((e) => {
			let n = [...e.filter((e) => e.id !== i), a];
			return n.length > t ? n.slice(n.length - t) : n;
		}), i;
	}, [t]);
	c(() => {
		if (a.length === 0) return;
		let e = setInterval(() => {
			if (d.current) return;
			let e = [];
			for (let [t, n] of h.current) {
				let r = n - 100;
				r <= 0 ? e.push(t) : h.current.set(t, r);
			}
			if (e.length) {
				for (let t of e) h.current.delete(t);
				s((t) => t.filter((t) => !e.includes(t.id)));
			}
		}, 100);
		return () => clearInterval(e);
	}, [a.length]);
	let S = f(() => ({
		toast: x,
		info: (e, t) => x({
			...t,
			message: e,
			variant: "info"
		}),
		success: (e, t) => x({
			...t,
			message: e,
			variant: "success"
		}),
		warning: (e, t) => x({
			...t,
			message: e,
			variant: "warning"
		}),
		error: (e, t) => x({
			...t,
			message: e,
			variant: "danger"
		}),
		dismiss: g,
		dismissAll: b
	}), [
		x,
		g,
		b
	]), C = a.filter((e) => e.variant === "info" || e.variant === "success"), w = a.filter((e) => e.variant === "warning" || e.variant === "danger"), T = /* @__PURE__ */ v("div", {
		className: y("pointer-events-none z-[9998] flex flex-col gap-2", l ? "inset-x-3 bottom-3 items-stretch" : Qa[n]),
		style: {
			position: u === document.body ? "fixed" : "absolute",
			paddingBottom: l ? "env(safe-area-inset-bottom)" : void 0,
			maxWidth: l ? void 0 : "min(24rem, calc(100vw - 2rem))"
		},
		onMouseEnter: () => {
			d.current = !0;
		},
		onMouseLeave: () => {
			d.current = !1;
		},
		onFocusCapture: () => {
			d.current = !0;
		},
		onBlurCapture: () => {
			d.current = !1;
		},
		children: [/* @__PURE__ */ _("div", {
			"aria-live": "polite",
			"aria-relevant": "additions",
			className: "flex flex-col gap-2",
			children: C.map((e) => /* @__PURE__ */ _(eo, {
				item: e,
				onClose: () => g(e.id),
				closeLabel: i("ui.close")
			}, e.id))
		}), /* @__PURE__ */ _("div", {
			"aria-live": "assertive",
			"aria-relevant": "additions",
			className: "flex flex-col gap-2",
			children: w.map((e) => /* @__PURE__ */ _(eo, {
				item: e,
				onClose: () => g(e.id),
				closeLabel: i("ui.close")
			}, e.id))
		})]
	});
	return /* @__PURE__ */ v(Ja.Provider, {
		value: S,
		children: [e, u && X(T, u)]
	});
}
function eo({ item: e, onClose: t, closeLabel: n }) {
	let { Glyph: r, icon: i } = Ya[e.variant];
	return /* @__PURE__ */ v("div", {
		role: e.variant === "danger" || e.variant === "warning" ? "alert" : "status",
		className: "pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border bg-surface-0 px-3 py-2.5",
		style: {
			boxShadow: "var(--kb-shadow-float)",
			animation: "kb-toast-in .18s ease-out"
		},
		children: [
			/* @__PURE__ */ _("style", { children: "@keyframes kb-toast-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" }),
			/* @__PURE__ */ _("span", {
				className: y("mt-px shrink-0", i),
				"aria-hidden": !0,
				children: /* @__PURE__ */ _(r, { size: 16 })
			}),
			/* @__PURE__ */ v("div", {
				className: "min-w-0 flex-1",
				style: { fontSize: "var(--kb-text-body)" },
				children: [
					e.title != null && /* @__PURE__ */ _("p", {
						className: "font-medium text-text-primary",
						children: e.title
					}),
					/* @__PURE__ */ _("div", {
						className: y("text-text-secondary", e.title != null && "mt-0.5"),
						children: e.message
					}),
					e.action && /* @__PURE__ */ _("button", {
						type: "button",
						onClick: () => {
							e.action?.onClick(), t();
						},
						className: "mt-1.5 -ml-1.5 rounded-md px-1.5 py-0.5 text-primary transition-colors\n                       hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
						children: e.action.label
					})
				]
			}),
			/* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": n,
				onClick: t,
				className: "-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-text-tertiary transition-colors\n                   hover:bg-surface-2 hover:text-text-primary\n                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
				children: /* @__PURE__ */ _(pe, { size: 14 })
			})
		]
	});
}
function to() {
	let e = s(Ja), t = f(() => {
		let e = () => "";
		return {
			toast: e,
			info: e,
			success: e,
			warning: e,
			error: e,
			dismiss: () => {},
			dismissAll: () => {}
		};
	}, []);
	return e ?? t;
}
//#endregion
//#region ../../src/ui/index.ts
var no = $("ui.Button", $e), ro = $("ui.Badge", rt), io = $("ui.Input", vt), ao = $("ui.NumberInput", yt), oo = $("ui.Textarea", Mt), so = $("ui.Editable", Nt), co = $("ui.RichText", Pt), lo = $("ui.Checkbox", Rt), uo = $("ui.Radio", Ht), fo = $("ui.Toggle", Yt), po = $("ui.FloatCheckbox", Xt), mo = $("ui.Separator", Zt), ho = $("ui.Spinner", $t), go = $("ui.RangeSlider", an), _o = $("ui.Dropdown", dn), vo = $("ui.DatePicker", mr), yo = $("ui.FontPicker", Mr), bo = $("ui.FontSizeField", Fr), xo = $("ui.MenuDropdown", Rr), So = $("ui.Tabs", Hr), Co = $("ui.Accordion", Ur), wo = $("ui.StartPage", Xr), To = $("ui.KubunoLogo", Zr), Eo = $("ui.LabelIcon", $r), Do = $("ui.ColorPicker", bi), Oo = $("ui.ColorField", xi), ko = $("ui.ColorSwatchPicker", Ti), Ao = $("ui.GradientPicker", ji), jo = $("ui.GradientField", Mi), Mo = $("ui.Card", Ni), No = $("ui.EmptyState", Bi), Po = $("ui.Callout", Hi), Fo = $("ui.Breadcrumb", Wi), Io = $("ui.ProgressBar", Ji), Lo = $("ui.Combobox", ia), Ro = $("ui.Stepper", ua), zo = $("ui.DataTable", Na), Bo = $("ui.AnchoredPopover", Pa), Vo = $("ui.FloatingWindow", La), Ho = $("ui.ResizeHandle", Wr), Uo = $("ui.ConfirmDialog", Ra), Wo = $("ui.ConflictDialog", za);
//#endregion
export { Co as Accordion, Bo as AnchoredPopover, ro as Badge, Fo as Breadcrumb, no as Button, Po as Callout, Mo as Card, ln as CaretDown, lo as Checkbox, Oo as ColorField, Do as ColorPicker, ko as ColorSwatchPicker, Lo as Combobox, Ve as ComponentRegistry, Uo as ConfirmDialog, Wo as ConflictDialog, Oi as DEFAULT_GRADIENT, li as DEFAULT_PICKER_THEME, zo as DataTable, Ta as DataTableSkeleton, vo as DatePicker, _o as Dropdown, so as Editable, No as EmptyState, Sr as FONT_UI_THEME, po as FloatCheckbox, Vo as FloatingWindow, yo as FontPicker, bo as FontSizeField, jo as GradientField, Ao as GradientPicker, io as Input, To as KubunoLogo, ui as LIGHT_PICKER_THEME, Eo as LabelIcon, Ct as MENTION_REMOVE_ATTR, Xi as MOBILE_MAX_WIDTH, At as MentionEditable, _t as MentionInput, gt as MentionList, xo as MenuDropdown, ta as MobileSheet, na as MobileSheetItem, ra as MobileSheetSeparator, ao as NumberInput, wa as Pagination, Je as PortalHostContext, Io as ProgressBar, uo as Radio, go as RangeSlider, Ho as ResizeHandle, co as RichText, nn as RollingNumber, mo as Separator, ho as Spinner, en as SpinnerOverlay, wo as StartPage, Ro as Stepper, Ha as TOOLTIP_STYLE, So as Tabs, oo as Textarea, Ue as ThemePreviewContext, He as ThemeScopeContext, $a as ToastProvider, fo as Toggle, Ua as Tooltip, Pi as UI_FALLBACK, fi as appPickerTheme, Et as bindMentionChipRemoval, wt as buildMentionChipHtml, ci as cmykToRgb, xr as dedupeFontFamilies, dt as defaultMentionProviders, ct as detectMention, xt as ensureMentionStyles, Li as foldIncludes, Ii as foldText, Di as gradientToCss, hi as harmonyColors, ei as hexToRgb, st as highlightMatch, ii as hslToRgb, oi as hsvToRgb, Yi as isCoarsePointer, $i as openable, br as parseFontMeta, Tt as replaceMentionQueryWithChip, si as rgbToCmyk, ti as rgbToHex, ni as rgbToHsl, ai as rgbToHsv, Ei as rgbaFromHex, Dt as serializeMentions, ut as setMentionProviderSource, $ as themed, Fi as uiT, pi as useAppPickerTheme, kt as useContentEditableMention, Qi as useIsLandscape, Zi as useIsMobile, ea as useLongPress, ft as useMentionAutocomplete, Br as useMenuDropdown, Ye as usePortalHost, Gr as useResizableWidth, qa as useSaveShortcut, da as useStepper, We as useThemeVersion, to as useToast, Ia as useWindowZStore };
