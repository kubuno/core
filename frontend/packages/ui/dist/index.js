import e, { cloneElement as t, createContext as n, createElement as r, forwardRef as i, useCallback as a, useContext as o, useEffect as s, useId as c, useImperativeHandle as l, useLayoutEffect as u, useMemo as d, useRef as f, useState as p, useSyncExternalStore as m } from "react";
import { Fragment as h, jsx as g, jsxs as _ } from "react/jsx-runtime";
import { clsx as v } from "clsx";
import { twMerge as y } from "tailwind-merge";
import { AlertTriangle as b, Bold as x, Calendar as S, Check as C, ChevronDown as w, ChevronLeft as T, ChevronRight as E, ChevronUp as D, Circle as O, Clock as k, Copy as A, Eraser as j, GripVertical as M, Italic as N, Layers as P, Link2 as F, List as I, ListOrdered as ee, Pipette as L, Plus as R, Search as z, Square as B, SquareArrowOutUpRight as te, Trash2 as V, Triangle as H, Underline as U, X as ne } from "lucide-react";
import { createPortal as W } from "react-dom";
import { addMonths as G, eachDayOfInterval as K, endOfMonth as q, endOfWeek as re, format as J, getMonth as ie, getYear as Y, isAfter as ae, isBefore as oe, isSameDay as se, isSameMonth as ce, isToday as X, isValid as le, parseISO as ue, startOfMonth as de, startOfWeek as fe, subMonths as pe } from "date-fns";
import { fr as me } from "date-fns/locale";
import { create as he } from "zustand";
//#region ../../src/ui/themeRegistry.tsx
var ge = /* @__PURE__ */ new Map(), _e = /* @__PURE__ */ new Map(), ve = /* @__PURE__ */ new Map(), ye = 0, be = /* @__PURE__ */ new Set();
function xe() {
	ye += 1;
	for (let e of be) e();
}
var Se = {
	register(e, t, n) {
		if (n?.moduleId) {
			let r = _e.get(n.moduleId);
			r || (r = /* @__PURE__ */ new Map(), _e.set(n.moduleId, r)), r.set(e, t);
		} else ge.set(e, t);
		xe();
	},
	unregister(e, t) {
		t?.moduleId ? _e.get(t.moduleId)?.delete(e) : ge.delete(e), xe();
	},
	resolve(e, t) {
		if (t) {
			let n = _e.get(t)?.get(e);
			if (n) return n;
		}
		return ge.get(e);
	},
	clearModule(e) {
		_e.delete(e) && xe();
	},
	clearAll() {
		ge.clear(), _e.clear(), xe();
	},
	registerPreview(e, t) {
		ve.set(e, t), xe();
	},
	resolvePreview(e) {
		return ve.get(e);
	},
	clearPreview() {
		ve.size && (ve.clear(), xe());
	},
	subscribe(e) {
		return be.add(e), () => {
			be.delete(e);
		};
	},
	getVersion() {
		return ye;
	}
}, Ce = n(void 0), we = n(!1);
function Te() {
	return m(Se.subscribe, Se.getVersion, Se.getVersion);
}
var Ee = Symbol.for("react.forward_ref"), De = Symbol.for("react.memo");
function Oe(e) {
	if (typeof e == "string") return !0;
	let t = e?.$$typeof;
	return t === Ee || t === De;
}
function Z(e, t) {
	let n = i(function(n, i) {
		Te();
		let a = o(we), s = o(Ce), c = (a ? Se.resolvePreview(e) : Se.resolve(e, s)) ?? t;
		return r(c, i != null && Oe(c) ? {
			...n,
			ref: i
		} : n);
	});
	return n.displayName = `Themed(${e})`, n;
}
//#endregion
//#region ../../src/ui/portalHost.tsx
var ke = n(null);
function Ae() {
	let e = o(ke);
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
var je = [
	"inline-flex items-center justify-center select-none",
	"transition-colors rounded-md",
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
	"disabled:opacity-50 disabled:cursor-not-allowed"
].join(" "), Me = {
	primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
	secondary: "bg-white border border-border text-text-primary hover:bg-surface-1 active:bg-surface-2",
	ghost: "bg-transparent text-text-secondary hover:bg-surface-2 active:bg-surface-3",
	danger: "bg-danger text-white hover:opacity-90 active:opacity-80"
}, Ne = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-9 px-4 text-sm gap-2",
	lg: "h-11 px-5 text-sm gap-2"
};
function Pe({ variant: e = "primary", size: t = "md", icon: n, loading: r = !1, className: i, disabled: a, children: o, type: s = "button", ...c }) {
	return /* @__PURE__ */ g("button", {
		type: s,
		className: [
			je,
			Me[e],
			Ne[t],
			i
		].filter(Boolean).join(" "),
		disabled: a || r,
		...c,
		children: r ? /* @__PURE__ */ g("span", { className: "h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" }) : /* @__PURE__ */ _(h, { children: [n, o] })
	});
}
//#endregion
//#region ../../src/ui/Badge.tsx
var Fe = {
	default: "bg-surface-2 text-text-secondary",
	primary: "bg-primary-light text-primary",
	success: "bg-success-light text-success",
	warning: "bg-warning-light text-warning",
	danger: "bg-danger-light text-danger",
	neutral: "bg-surface-3 text-text-primary"
}, Ie = {
	default: "bg-text-tertiary",
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
	danger: "bg-danger",
	neutral: "bg-text-secondary"
}, Le = {
	sm: "text-[10px] px-1.5 py-0.5",
	md: "text-xs px-2 py-0.5"
};
function Re({ children: e, variant: t = "default", size: n = "md", className: r, dot: i = !1 }) {
	return /* @__PURE__ */ _("span", {
		className: v("inline-flex items-center gap-1 rounded-full font-medium", Fe[t], Le[n], r),
		children: [i && /* @__PURE__ */ g("span", { className: v("h-1.5 w-1.5 rounded-full flex-shrink-0", Ie[t]) }), e]
	});
}
//#endregion
//#region ../../src/ui/Input.tsx
var ze = e.forwardRef(function({ label: e, error: t, hint: n, leftIcon: r, rightIcon: i, className: a, id: o, ...s }, c) {
	let l = o ?? (typeof e == "string" ? e.toLowerCase().replace(/\s+/g, "-") : void 0);
	return /* @__PURE__ */ _("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ g("label", {
				htmlFor: l,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ _("div", {
				className: "relative flex items-center",
				children: [
					r && /* @__PURE__ */ g("span", {
						className: "absolute left-3 text-text-secondary pointer-events-none",
						children: r
					}),
					/* @__PURE__ */ g("input", {
						ref: c,
						id: l,
						className: y(v("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-9", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r && "pl-9", i && "pr-9", a)),
						...s
					}),
					i && /* @__PURE__ */ g("span", {
						className: "absolute right-3 text-text-secondary pointer-events-none",
						children: i
					})
				]
			}),
			t && /* @__PURE__ */ g("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ g("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
});
//#endregion
//#region ../../src/ui/NumberInput.tsx
function Be({ value: e, onChange: t, min: n, max: r, step: i = 1, disabled: o = !1, label: s, error: c, hint: l, className: u, id: d }) {
	let f = d ?? s?.toLowerCase().replace(/\s+/g, "-"), p = a((e) => n !== void 0 && e < n ? n : r !== void 0 && e > r ? r : e, [n, r]), m = () => t(p(e + i)), h = () => t(p(e - i)), y = (e) => {
		let n = parseFloat(e.target.value);
		isNaN(n) || t(p(n));
	}, b = n !== void 0 && e <= n, x = r !== void 0 && e >= r;
	return /* @__PURE__ */ _("div", {
		className: "flex flex-col gap-1",
		children: [
			s && /* @__PURE__ */ g("label", {
				htmlFor: f,
				className: "text-sm font-medium text-text-primary",
				children: s
			}),
			/* @__PURE__ */ _("div", {
				className: v("inline-flex items-stretch h-9 rounded-md border bg-white overflow-hidden", "focus-within:ring-2 focus-within:ring-primary focus-within:border-primary", c ? "border-danger focus-within:ring-danger" : "border-border", o && "opacity-50 cursor-not-allowed", u),
				children: [/* @__PURE__ */ g("input", {
					id: f,
					type: "number",
					value: e,
					onChange: y,
					min: n,
					max: r,
					step: i,
					disabled: o,
					className: v("flex-1 min-w-0 px-3 text-sm text-text-primary bg-transparent", "focus:outline-none", "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none")
				}), /* @__PURE__ */ _("div", {
					className: "flex flex-col border-l border-border w-6 flex-shrink-0",
					children: [/* @__PURE__ */ g("button", {
						type: "button",
						tabIndex: -1,
						onClick: m,
						disabled: o || x,
						className: v("flex-1 flex items-center justify-center border-b border-border", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ g(D, {
							size: 11,
							strokeWidth: 2.5
						})
					}), /* @__PURE__ */ g("button", {
						type: "button",
						tabIndex: -1,
						onClick: h,
						disabled: o || b,
						className: v("flex-1 flex items-center justify-center", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ g(w, {
							size: 11,
							strokeWidth: 2.5
						})
					})]
				})]
			}),
			c && /* @__PURE__ */ g("p", {
				className: "text-xs text-danger",
				children: c
			}),
			l && !c && /* @__PURE__ */ g("p", {
				className: "text-xs text-text-secondary",
				children: l
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Textarea.tsx
function Ve({ label: e, error: t, hint: n, className: r, id: i, ...a }) {
	let o = i ?? e?.toLowerCase().replace(/\s+/g, "-");
	return /* @__PURE__ */ _("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ g("label", {
				htmlFor: o,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ g("textarea", {
				id: o,
				className: y(v("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-36 min-h-36 resize-y", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r)),
				...a
			}),
			t && /* @__PURE__ */ g("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ g("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Editable.tsx
var He = i(function({ defaultValue: e = "", placeholder: t, disabled: n, spellCheck: r = !1, onTextChange: i, className: a, style: o, ...c }, u) {
	let d = f(null);
	return l(u, () => d.current, []), s(() => {
		d.current && !d.current.textContent && (d.current.textContent = e);
	}, []), /* @__PURE__ */ g("div", {
		ref: d,
		contentEditable: !n,
		suppressContentEditableWarning: !0,
		spellCheck: r,
		role: "textbox",
		"aria-multiline": "true",
		"data-placeholder": t,
		onInput: () => i?.(d.current?.textContent ?? ""),
		style: o,
		className: y(v("w-full rounded-md border border-border bg-white text-sm text-text-primary px-3 py-2", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "empty:before:content-[attr(data-placeholder)] empty:before:text-text-tertiary empty:before:pointer-events-none", n && "bg-surface-2 cursor-not-allowed opacity-60", a)),
		...c
	});
});
//#endregion
//#region ../../src/ui/RichText.tsx
function Ue({ value: e, onChange: t, placeholder: n, className: r, minHeight: i = 96, disabled: a }) {
	let o = f(null), [c, l] = p(!1), [u, d] = p(""), [m, h] = p(!e), v = f(null);
	s(() => {
		o.current && (o.current.innerHTML = e || ""), h(!o.current?.textContent?.trim() && !o.current?.querySelector("img,ul,ol"));
	}, []);
	let y = () => {
		let e = o.current?.innerHTML ?? "", n = !o.current?.textContent?.trim() && !o.current?.querySelector("img,ul,ol,li");
		h(n), t(n ? "" : e);
	}, b = (e, t) => {
		o.current?.focus(), document.execCommand(e, !1, t), y();
	}, S = () => {
		let e = window.getSelection();
		e && e.rangeCount && (v.current = e.getRangeAt(0).cloneRange());
	}, C = () => {
		let e = window.getSelection();
		e && v.current && (e.removeAllRanges(), e.addRange(v.current));
	}, w = () => {
		C();
		let e = u.trim();
		e && b("createLink", /^https?:\/\//i.test(e) ? e : `https://${e}`), l(!1), d("");
	}, T = ({ on: e, title: t, children: n }) => /* @__PURE__ */ g("button", {
		type: "button",
		title: t,
		"aria-label": t,
		onMouseDown: (e) => e.preventDefault(),
		onClick: e,
		className: "w-8 h-8 flex items-center justify-center rounded text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors",
		children: n
	});
	return /* @__PURE__ */ _("div", {
		className: `rounded-md border border-border bg-white overflow-hidden ${r ?? ""}`,
		children: [
			/* @__PURE__ */ _("div", {
				className: "flex items-center gap-0.5 px-1.5 py-1 border-b border-border",
				children: [
					/* @__PURE__ */ g(T, {
						title: "Gras",
						on: () => b("bold"),
						children: /* @__PURE__ */ g(x, { size: 15 })
					}),
					/* @__PURE__ */ g(T, {
						title: "Italique",
						on: () => b("italic"),
						children: /* @__PURE__ */ g(N, { size: 15 })
					}),
					/* @__PURE__ */ g(T, {
						title: "Souligné",
						on: () => b("underline"),
						children: /* @__PURE__ */ g(U, { size: 15 })
					}),
					/* @__PURE__ */ g("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ g(T, {
						title: "Liste numérotée",
						on: () => b("insertOrderedList"),
						children: /* @__PURE__ */ g(ee, { size: 15 })
					}),
					/* @__PURE__ */ g(T, {
						title: "Liste à puces",
						on: () => b("insertUnorderedList"),
						children: /* @__PURE__ */ g(I, { size: 15 })
					}),
					/* @__PURE__ */ g("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ g(T, {
						title: "Insérer un lien",
						on: () => {
							S(), l((e) => !e);
						},
						children: /* @__PURE__ */ g(F, { size: 15 })
					}),
					/* @__PURE__ */ g(T, {
						title: "Effacer la mise en forme",
						on: () => b("removeFormat"),
						children: /* @__PURE__ */ g(j, { size: 15 })
					})
				]
			}),
			c && /* @__PURE__ */ _("div", {
				className: "flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-surface-1",
				children: [/* @__PURE__ */ g("input", {
					autoFocus: !0,
					value: u,
					onChange: (e) => d(e.target.value),
					placeholder: "https://…",
					onKeyDown: (e) => {
						e.key === "Enter" && (e.preventDefault(), w()), e.key === "Escape" && l(!1);
					},
					className: "flex-1 text-sm px-2 py-1 rounded border border-border outline-none focus:border-primary"
				}), /* @__PURE__ */ g("button", {
					type: "button",
					onClick: w,
					className: "text-sm font-medium text-primary px-2",
					children: "OK"
				})]
			}),
			/* @__PURE__ */ _("div", {
				className: "relative",
				children: [/* @__PURE__ */ g("div", {
					ref: o,
					contentEditable: !a,
					onInput: y,
					suppressContentEditableWarning: !0,
					className: "px-3 py-2 text-sm text-text-primary outline-none leading-relaxed\n                     [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-5 [&_ol]:ml-5",
					style: { minHeight: i }
				}), m && n && /* @__PURE__ */ g("div", {
					className: "absolute top-2 left-3 text-sm text-text-tertiary pointer-events-none select-none",
					children: n
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Checkbox.tsx
var We = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-sm border-2 cursor-pointer transition-colors checked:bg-[var(--ck)] checked:border-[var(--ck)] before:content-[''] before:w-[11px] before:h-[11px] before:scale-0 before:origin-center before:transition-transform before:duration-100 checked:before:scale-100 before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)] before:shadow-[inset_1em_1em_#fff] disabled:cursor-not-allowed disabled:opacity-50", Ge = {
	default: "border-[#dadce0] hover:border-[#5f6368]",
	dark: "border-[#555] hover:border-[#808080] bg-[#3c3c3c]"
}, Ke = {
	default: {
		label: "text-sm text-[#202124]",
		desc: "text-sm text-[#5f6368]"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function qe({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: c }) {
	let l = a ?? (i === "dark" ? "#007acc" : "var(--color-primary)");
	return /* @__PURE__ */ _("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--ck": l
		},
		children: [/* @__PURE__ */ g("input", {
			type: "checkbox",
			checked: e,
			disabled: o,
			onChange: (e) => t(e.target.checked),
			className: v(We, Ge[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ _("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ g("span", {
				className: y("leading-snug", Ke[i].label, c),
				children: n
			}), r && /* @__PURE__ */ g("span", {
				className: y("leading-snug mt-0.5", Ke[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/Radio.tsx
var Je = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-full border-2 cursor-pointer transition-colors checked:border-[var(--rb)] before:content-[''] before:w-[10px] before:h-[10px] before:rounded-full before:bg-[var(--rb)] before:scale-0 before:transition-transform before:duration-100 checked:before:scale-100 disabled:cursor-not-allowed disabled:opacity-50", Ye = {
	default: "border-[#dadce0] hover:border-[#5f6368]",
	dark: "border-[#555] hover:border-[#808080]"
}, Xe = {
	default: {
		label: "text-sm text-[#202124]",
		desc: "text-sm text-[#5f6368]"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function Ze({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: c }) {
	let l = a ?? (i === "dark" ? "#007acc" : "var(--color-primary)");
	return /* @__PURE__ */ _("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--rb": l
		},
		children: [/* @__PURE__ */ g("input", {
			type: "radio",
			checked: e,
			disabled: o,
			onClick: () => {
				o || t(!e);
			},
			onChange: () => {},
			className: v(Je, Ye[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ _("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ g("span", {
				className: y("leading-snug", Xe[i].label, c),
				children: n
			}), r && /* @__PURE__ */ g("span", {
				className: y("leading-snug mt-0.5", Xe[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/toggleCanvas.ts
var Qe = {
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
function $e(e) {
	let t = getComputedStyle(e), n = (e, n) => t.getPropertyValue(e).trim() || n;
	return {
		off: n("--color-surface-3", "#e8eaed"),
		border: n("--color-border", "#e0e0e0"),
		on: n("--color-primary", "#1a73e8"),
		thumb: "#ffffff"
	};
}
function et(e, t) {
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
var tt = 150;
function nt({ label: e, description: t, size: n = "md", className: r, id: i, ...o }) {
	let c = i ?? e?.toLowerCase().replace(/\s+/g, "-"), l = Qe[n], u = f(null), d = f(null), p = f(o.checked ?? o.defaultChecked ?? !1 ? 1 : 0), m = f(0), h = f(!1), y = a(() => {
		let e = d.current;
		e && et(e, {
			geometry: l,
			palette: $e(e),
			progress: p.current
		});
	}, [l]), b = a((e, t) => {
		cancelAnimationFrame(m.current);
		let n = p.current;
		if (t || n === e || matchMedia("(prefers-reduced-motion: reduce)").matches) {
			p.current = e, y();
			return;
		}
		let r = performance.now(), i = (t) => {
			let a = Math.min(1, (t - r) / tt);
			p.current = n + (e - n) * (a * a * (3 - 2 * a)), y(), a < 1 && (m.current = requestAnimationFrame(i));
		};
		m.current = requestAnimationFrame(i);
	}, [y]), x = a((e = !1) => {
		b(+!!u.current?.checked, e);
	}, [b]);
	return s(() => {
		x(!h.current), h.current = !0;
	}, [
		o.checked,
		n,
		x
	]), s(() => {
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
		let c = new MutationObserver(() => y());
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
	}, [y, x]), /* @__PURE__ */ _("label", {
		htmlFor: c,
		className: v("inline-flex items-start gap-2.5 cursor-pointer select-none", o.disabled && "cursor-not-allowed opacity-50", r),
		children: [/* @__PURE__ */ _("div", {
			className: v("relative flex-shrink-0", (e || t) && "mt-0.5"),
			children: [/* @__PURE__ */ g("input", {
				ref: u,
				type: "checkbox",
				id: c,
				className: "peer sr-only",
				...o
			}), /* @__PURE__ */ g("canvas", {
				ref: d,
				"aria-hidden": !0,
				className: "block peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1",
				style: {
					width: l.width,
					height: l.height,
					borderRadius: l.trackRadius
				}
			})]
		}), (e || t) && /* @__PURE__ */ _("div", {
			className: "flex flex-col gap-0.5",
			children: [e && /* @__PURE__ */ g("span", {
				className: "text-sm text-text-primary leading-5",
				children: e
			}), t && /* @__PURE__ */ g("span", {
				className: "text-xs text-text-secondary",
				children: t
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/FloatCheckbox.tsx
function rt({ selected: e, onToggle: t, className: n }) {
	return /* @__PURE__ */ g("div", {
		role: "checkbox",
		"aria-checked": e,
		onClick: (e) => {
			e.stopPropagation(), t();
		},
		className: v("transition-opacity cursor-pointer", e ? "opacity-100" : "opacity-0 group-hover:opacity-100", n),
		children: /* @__PURE__ */ g("div", {
			className: v("w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors", e ? "bg-primary border-primary" : "bg-black/30 border-white"),
			children: e && /* @__PURE__ */ g("span", {
				className: "text-white text-[10px] font-bold leading-none",
				children: "✓"
			})
		})
	});
}
//#endregion
//#region ../../src/ui/Separator.tsx
function it({ orientation: e = "horizontal", className: t }) {
	return /* @__PURE__ */ g("div", {
		role: "separator",
		"aria-orientation": e,
		className: v("bg-border flex-shrink-0", e === "horizontal" ? "h-px w-full" : "w-px self-stretch", t)
	});
}
//#endregion
//#region ../../src/ui/Spinner.tsx
var at = {
	xs: "h-3 w-3 border",
	sm: "h-4 w-4 border-2",
	md: "h-6 w-6 border-2",
	lg: "h-8 w-8 border-[3px]"
};
function ot({ size: e = "md", className: t, label: n = "Chargement…" }) {
	return /* @__PURE__ */ g("span", {
		role: "status",
		"aria-label": n,
		className: v("inline-block rounded-full border-border border-t-primary animate-spin", at[e], t)
	});
}
function st({ label: e = "Chargement…" }) {
	return /* @__PURE__ */ g("div", {
		className: "absolute inset-0 flex items-center justify-center bg-white/70 z-10",
		children: /* @__PURE__ */ g(ot, {
			size: "lg",
			label: e
		})
	});
}
//#endregion
//#region ../../src/ui/RangeSlider.tsx
function ct({ d: e, animate: t }) {
	return /* @__PURE__ */ g("span", {
		className: "inline-block overflow-hidden align-baseline",
		style: { height: "1em" },
		children: /* @__PURE__ */ g("span", {
			className: "flex flex-col",
			style: {
				transform: `translateY(-${e}em)`,
				transition: t ? "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)" : "none"
			},
			children: Array.from({ length: 10 }, (e, t) => /* @__PURE__ */ g("span", {
				style: {
					height: "1em",
					lineHeight: "1em"
				},
				children: t
			}, t))
		})
	});
}
function lt({ text: e, className: t }) {
	let n = f(!1);
	return s(() => {
		n.current = !0;
	}, []), /* @__PURE__ */ g("span", {
		className: `inline-flex items-baseline tabular-nums leading-none ${t ?? ""}`,
		children: [...e].map((e, t) => /\d/.test(e) ? /* @__PURE__ */ g(ct, {
			d: Number(e),
			animate: n.current
		}, t) : /* @__PURE__ */ g("span", { children: e }, t))
	});
}
var ut = (e, t, n) => n <= t ? 0 : Math.max(0, Math.min(100, (e - t) / (n - t) * 100));
function dt({ value: e, onChange: t, min: n = 0, max: r = 100, step: i = 1, variant: a = "bubble", orientation: o = "horizontal", format: s, minLabel: l, maxLabel: u, showValue: d = !1, accent: f, trackColor: m, disabled: h, className: v, style: b, id: x, ...S }) {
	let C = c(), [w, T] = p(!1), E = x ?? C, D = s ?? ((e) => String(e)), O = ut(e, n, r), k = f ?? "var(--color-primary, #1a73e8)", A = m ?? "rgba(0,0,0,0.10)", j = (e) => {
		let i = Number(e);
		Number.isFinite(i) && t(Math.max(n, Math.min(r, i)));
	}, M = /* @__PURE__ */ g("input", {
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
	}), N = (e = 12) => /* @__PURE__ */ g("span", {
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
	if (a === "boxed") return /* @__PURE__ */ _("div", {
		className: y("select-none", h && "opacity-60", v),
		style: b,
		children: [/* @__PURE__ */ _("div", {
			className: "relative rounded-xl border-2 bg-surface-0 px-4 pt-3 pb-5 transition-colors focus-within:border-primary",
			style: { borderColor: "var(--color-border, #dadce0)" },
			children: [/* @__PURE__ */ g("input", {
				type: "text",
				inputMode: "numeric",
				value: D(e),
				disabled: h,
				onChange: (e) => j(e.target.value.replace(/[^\d.-]/g, "")),
				className: "w-full bg-transparent text-2xl font-medium text-text-primary tabular-nums\n                       focus:outline-none disabled:cursor-not-allowed",
				"aria-label": S["aria-label"]
			}), /* @__PURE__ */ g("div", {
				className: "absolute left-3 right-3 bottom-0 h-0 translate-y-1/2",
				children: /* @__PURE__ */ _("div", {
					className: "relative h-1.5 rounded-full",
					style: { background: A },
					children: [
						/* @__PURE__ */ g("div", {
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
		}), /* @__PURE__ */ _("div", {
			className: "mt-1.5 flex items-center justify-between text-xs text-text-tertiary",
			children: [/* @__PURE__ */ g("span", { children: l ?? D(n) }), /* @__PURE__ */ g("span", { children: u ?? D(r) })]
		})]
	});
	if (o === "vertical") {
		let a = /* @__PURE__ */ g("input", {
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
		return /* @__PURE__ */ g("div", {
			className: y("relative h-full select-none", h && "opacity-60", v),
			style: b,
			children: /* @__PURE__ */ _("div", {
				className: "relative mx-auto h-full w-1.5 rounded-full",
				style: { background: A },
				children: [
					/* @__PURE__ */ g("div", {
						className: "absolute inset-x-0 bottom-0 rounded-full",
						style: {
							height: `${O}%`,
							background: k
						}
					}),
					/* @__PURE__ */ g("span", {
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
	return /* @__PURE__ */ _("div", {
		className: y("relative w-full select-none", h && "opacity-60", v),
		style: b,
		onPointerDown: () => !h && T(!0),
		onPointerUp: () => T(!1),
		onPointerLeave: () => T(!1),
		children: [/* @__PURE__ */ g("div", {
			"aria-hidden": !0,
			className: "pointer-events-none absolute -top-1 -translate-y-full transition-[opacity,transform] duration-150",
			style: {
				left: `${O}%`,
				transform: `translate(-50%, ${P ? "-100%" : "-80%"})`,
				opacity: +!!P
			},
			children: /* @__PURE__ */ g("span", {
				className: "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold text-white shadow",
				style: { background: k },
				children: /* @__PURE__ */ g(lt, { text: D(e) })
			})
		}), /* @__PURE__ */ _("div", {
			className: "relative h-1.5 rounded-full",
			style: { background: A },
			children: [
				/* @__PURE__ */ g("div", {
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
var ft = "data-kb-menu";
function pt(e) {
	return !!(e instanceof Element ? e : e?.parentElement ?? null)?.closest(`[${ft}]`);
}
function mt(e, t) {
	s(() => {
		if (!e) return;
		let n = (e) => {
			(e.key === "Escape" || !pt(e.target)) && t();
		}, r = () => t();
		return document.addEventListener("keydown", n, !0), window.addEventListener("blur", r), () => {
			document.removeEventListener("keydown", n, !0), window.removeEventListener("blur", r);
		};
	}, [e, t]);
}
//#endregion
//#region ../../src/ui/CaretDown.tsx
function ht({ color: e, size: t = 10, gap: n = 4, className: r }) {
	return /* @__PURE__ */ g("svg", {
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
		children: /* @__PURE__ */ g("path", { d: "M1 3.5h8L5 8.5z" })
	});
}
//#endregion
//#region ../../src/ui/Dropdown.tsx
var gt = {
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
function _t({ value: e, onChange: t, options: n, width: r, dropdownMinWidth: i, placeholder: o, disabled: c = !1, height: l = 36, fontSize: d = 14, className: m, variant: h = "default", buttonStyle: v, focusable: y = !1 }) {
	let [b, x] = p(!1);
	mt(b, a(() => x(!1), []));
	let [S, C] = p(!1), w = n.some((e) => !!e.icon), [T, E] = p(null), D = f(null), O = f(null), k = gt[h], A = n.find((t) => t.value === e)?.label ?? o ?? e, j = () => {
		if (!c) {
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
	}, M = a(() => {
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
	}, []), N = a(() => {
		let e = D.current, t = O.current;
		if (!e || !t) return;
		let n = e.getBoundingClientRect(), r = t.getBoundingClientRect(), i = window.innerWidth, a = window.innerHeight, o = n.left, s = n.bottom + 2;
		o + r.width > i - 8 && (o = i - 8 - r.width), s + r.height > a - 8 && (s = Math.max(8, n.top - 2 - r.height)), o < 8 && (o = 8), s < 8 && (s = 8), t.style.left = `${o}px`, t.style.top = `${s}px`;
	}, []);
	s(() => {
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
	]), u(() => {
		b && T && N();
	}, [
		b,
		T,
		N
	]);
	let P = {};
	r !== void 0 && (P.width = r);
	let F = "var(--color-primary, #1a73e8)", I = h === "default" && (b || S);
	return /* @__PURE__ */ _("div", {
		className: `relative ${m ?? ""}`,
		style: P,
		children: [/* @__PURE__ */ _("button", {
			type: "button",
			ref: D,
			onClick: j,
			onMouseDown: y ? void 0 : ((e) => e.preventDefault()),
			onFocus: y ? () => C(!0) : void 0,
			onBlur: y ? () => C(!1) : void 0,
			disabled: c,
			className: `w-full flex items-center justify-between gap-1 select-none${y ? " outline-none" : ""}`,
			style: {
				height: l,
				padding: "0 4px 0 8px",
				fontSize: d,
				fontFamily: "var(--font-family-sans)",
				color: k.text,
				background: b && !I ? k.activeBg : void 0,
				border: `1px solid ${I ? F : k.border}`,
				borderRadius: "var(--radius-md)",
				boxShadow: I ? `0 0 0 2px ${F}` : void 0,
				cursor: c ? "not-allowed" : "pointer",
				opacity: c ? .5 : 1,
				transition: "background 0.1s, box-shadow 0.1s, border-color 0.1s",
				...v
			},
			onMouseEnter: (e) => {
				!b && !c && !I && (e.currentTarget.style.background = k.hoverBg);
			},
			onMouseLeave: (e) => {
				b || (e.currentTarget.style.background = "");
			},
			children: [/* @__PURE__ */ g("span", {
				className: "truncate flex-1 text-left",
				children: A
			}), /* @__PURE__ */ g(ht, { color: k.chevron })]
		}), b && T && W(/* @__PURE__ */ _("div", {
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
			children: [/* @__PURE__ */ g("div", {
				className: "kb-frost-layer",
				"aria-hidden": !0
			}), /* @__PURE__ */ g("div", {
				style: {
					maxHeight: 280,
					overflowY: "auto",
					padding: 5
				},
				children: n.map((n) => /* @__PURE__ */ _("button", {
					type: "button",
					onClick: () => {
						t(n.value), x(!1);
					},
					className: "w-full text-left flex items-center gap-2",
					style: {
						padding: "5px 10px",
						borderRadius: 6,
						fontSize: d,
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
						/* @__PURE__ */ g("span", {
							style: {
								width: 14,
								flexShrink: 0,
								textAlign: "center",
								color: k.checkColor,
								fontSize: 14
							},
							children: n.value === e ? "✓" : ""
						}),
						w && /* @__PURE__ */ g("span", {
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
//#region ../../src/ui/DatePicker.tsx
var vt = [
	"L",
	"M",
	"M",
	"J",
	"V",
	"S",
	"D"
], yt = [
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
function bt(e, t) {
	if (!e) return null;
	try {
		if (t === "time") {
			let [t, n] = e.split(":").map(Number);
			if (isNaN(t) || isNaN(n)) return null;
			let r = /* @__PURE__ */ new Date();
			return r.setHours(t, n, 0, 0), r;
		}
		let n = ue(e);
		return le(n) ? n : null;
	} catch {
		return null;
	}
}
function xt(e, t) {
	return e ? t === "date" ? J(e, "dd/MM/yyyy") : t === "time" ? J(e, "HH:mm") : t === "datetime" ? J(e, "dd/MM/yyyy HH:mm") : "" : "";
}
function St(e, t) {
	return e ? t === "date" ? J(e, "yyyy-MM-dd") : t === "time" ? J(e, "HH:mm") : t === "datetime" ? J(e, "yyyy-MM-dd'T'HH:mm") : null : null;
}
function Ct(e) {
	return K({
		start: fe(de(e), { weekStartsOn: 1 }),
		end: re(q(e), { weekStartsOn: 1 })
	});
}
function wt(e) {
	let t = e - e % 12;
	return Array.from({ length: 12 }, (e, n) => t + n);
}
function Tt(e, t, n) {
	let r = e.getBoundingClientRect(), i = window.innerHeight - r.bottom - 8, a = r.top - 8;
	return {
		top: i >= t || i >= a ? r.bottom + window.scrollY + 4 : r.top + window.scrollY - t - 4,
		left: Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - n - 8))
	};
}
function Et({ values: e, selected: t, onSelect: n, label: r }) {
	let i = f(null), a = f(null);
	return s(() => {
		let e = a.current, t = i.current;
		!e || !t || (t.scrollTop = e.offsetTop - t.clientHeight / 2 + e.clientHeight / 2);
	}, [t, r]), /* @__PURE__ */ _("div", {
		className: "flex flex-col items-center w-14",
		children: [/* @__PURE__ */ g("span", {
			className: "text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1",
			children: r
		}), /* @__PURE__ */ g("div", {
			ref: i,
			className: "relative overflow-y-auto h-40",
			style: { scrollbarWidth: "none" },
			children: e.map((e) => /* @__PURE__ */ g("button", {
				ref: e === t ? a : void 0,
				type: "button",
				onClick: () => n(e),
				className: v("w-14 h-8 flex items-center justify-center text-sm rounded transition-colors", e === t ? "bg-primary/10 text-primary font-semibold" : "text-text-primary hover:bg-surface-2"),
				children: String(e).padStart(2, "0")
			}, e))
		})]
	});
}
function Dt({ viewDate: e, setViewDate: t, view: n, setView: r, selected: i, onSelect: o, rangeStart: s, rangeEnd: c, hoverDate: l, setHoverDate: u, isRange: f, minDate: p, maxDate: m, disabledDate: h }) {
	let y = p ? ue(p) : null, b = m ? ue(m) : null, x = a((e) => y && oe(e, y) || b && ae(e, b) ? !0 : h ? h(e) : !1, [
		y,
		b,
		h
	]), S = d(() => c || (s && !c && l ? l : null), [
		s,
		c,
		l
	]), C = a((e) => {
		if (!f || !s || !S) return !1;
		let [t, n] = oe(s, S) ? [s, S] : [S, s];
		return ae(e, t) && oe(e, n);
	}, [
		f,
		s,
		S
	]), w = a((e) => f ? s && se(e, s) || S && se(e, S) : !1, [
		f,
		s,
		S
	]), D = d(() => wt(Y(e)), [e]);
	if (n === "day") {
		let n = Ct(e), a = J(e, "MMMM", { locale: me }), s = a.charAt(0).toUpperCase() + a.slice(1);
		return /* @__PURE__ */ _("div", { children: [
			/* @__PURE__ */ _("div", {
				className: "flex items-center gap-1 mb-2",
				children: [
					/* @__PURE__ */ g("button", {
						type: "button",
						onClick: () => t(pe(e, 1)),
						className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
						children: /* @__PURE__ */ g(T, { size: 14 })
					}),
					/* @__PURE__ */ _("div", {
						className: "flex-1 flex items-center justify-center gap-1",
						children: [/* @__PURE__ */ g("button", {
							type: "button",
							onClick: () => r("month"),
							className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
							children: s
						}), /* @__PURE__ */ g("button", {
							type: "button",
							onClick: () => r("year"),
							className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
							children: Y(e)
						})]
					}),
					/* @__PURE__ */ g("button", {
						type: "button",
						onClick: () => t(G(e, 1)),
						className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
						children: /* @__PURE__ */ g(E, { size: 14 })
					})
				]
			}),
			/* @__PURE__ */ g("div", {
				className: "grid grid-cols-7 mb-0.5",
				children: vt.map((e, t) => /* @__PURE__ */ g("div", {
					className: "h-7 flex items-center justify-center text-[11px] font-medium text-text-tertiary",
					children: e
				}, t))
			}),
			/* @__PURE__ */ g("div", {
				className: "grid grid-cols-7",
				onMouseLeave: () => u?.(null),
				children: n.map((t, n) => {
					let r = ce(t, e), a = !f && i && se(t, i), s = w(t), c = C(t), l = x(t), d = X(t);
					return /* @__PURE__ */ g("button", {
						type: "button",
						disabled: l,
						onClick: () => !l && o(t),
						onMouseEnter: () => u?.(t),
						className: v("h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium transition-colors", a || s ? "rounded-full bg-primary text-white" : "", !a && !s && c ? "bg-primary/10 text-primary" : "", !a && !s && !c && !l && d ? "rounded-full border border-primary text-primary hover:bg-primary-light" : "", !a && !s && !c && !l && !d && r ? "rounded-full text-text-primary hover:bg-surface-2" : "", !a && !s && !c && !l && !d && !r ? "rounded-full text-text-tertiary hover:bg-surface-2" : "", l ? "opacity-30 cursor-not-allowed rounded-full" : ""),
						children: J(t, "d")
					}, n);
				})
			})
		] });
	}
	return n === "month" ? /* @__PURE__ */ _("div", { children: [/* @__PURE__ */ _("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ g("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(Y(e) - 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ g(T, { size: 14 })
			}),
			/* @__PURE__ */ g("button", {
				type: "button",
				onClick: () => r("year"),
				className: "flex-1 text-sm font-semibold text-center text-text-primary hover:text-primary transition-colors rounded hover:bg-surface-1 py-0.5",
				children: Y(e)
			}),
			/* @__PURE__ */ g("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(Y(e) + 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ g(E, { size: 14 })
			})
		]
	}), /* @__PURE__ */ g("div", {
		className: "grid grid-cols-3 gap-1",
		children: yt.map((n, a) => /* @__PURE__ */ g("button", {
			type: "button",
			onClick: () => {
				t((e) => {
					let t = new Date(e);
					return t.setMonth(a), t;
				}), r("day");
			},
			className: v("h-9 rounded-lg text-sm font-medium transition-colors", i && ie(i) === a && Y(i) === Y(e) ? "bg-primary text-white" : "text-text-primary hover:bg-surface-2"),
			children: n
		}, a))
	})] }) : /* @__PURE__ */ _("div", { children: [/* @__PURE__ */ _("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ g("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(Y(e) - 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ g(T, { size: 14 })
			}),
			/* @__PURE__ */ _("span", {
				className: "flex-1 text-sm font-semibold text-center text-text-primary",
				children: [
					D[0],
					" – ",
					D[D.length - 1]
				]
			}),
			/* @__PURE__ */ g("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(Y(e) + 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ g(E, { size: 14 })
			})
		]
	}), /* @__PURE__ */ g("div", {
		className: "grid grid-cols-3 gap-1",
		children: D.map((e) => {
			let n = i && Y(i) === e, a = Y(/* @__PURE__ */ new Date()) === e;
			return /* @__PURE__ */ g("button", {
				type: "button",
				onClick: () => {
					t((t) => {
						let n = new Date(t);
						return n.setFullYear(e), n;
					}), r("month");
				},
				className: v("h-9 rounded-lg text-sm font-medium transition-colors", n ? "bg-primary text-white" : a ? "border border-primary text-primary hover:bg-primary-light" : "text-text-primary hover:bg-surface-2"),
				children: e
			}, e);
		})
	})] });
}
function Ot({ mode: e = "date", value: t, onChange: n, startValue: r, endValue: i, onRangeChange: o, label: c, placeholder: l, disabled: u = !1, readOnly: m = !1, clearable: h = !1, required: y, error: b, hint: x, minDate: C, maxDate: w, disabledDate: T, minuteStep: E = 5, size: D = "md", className: O, id: A, name: j }) {
	let M = f(null), N = f(null), [P, F] = p(!1), [I, ee] = p("day"), [L, R] = p(/* @__PURE__ */ new Date()), z = d(() => bt(t, e), [t, e]), B = d(() => bt(r, "date"), [r]), te = d(() => bt(i, "date"), [i]), [V, H] = p(() => z?.getHours() ?? 0), [U, G] = p(() => z?.getMinutes() ?? 0), [K, q] = p("first"), [re, J] = p(null), [ie, Y] = p(null), [ae, se] = p({
		top: 0,
		left: 0
	}), ce = A ?? (typeof c == "string" ? c.toLowerCase().replace(/\s+/g, "-") : void 0), X = d(() => {
		if (e === "daterange") {
			let e = B, t = te;
			return e ? t ? `${xt(e, "date")} – ${xt(t, "date")}` : xt(e, "date") : "";
		}
		return xt(z, e);
	}, [
		e,
		z,
		B,
		te
	]), le = a(() => {
		if (u || m) return;
		let t = M.current;
		t && (se(Tt(t, e === "time" ? 230 : e === "datetime" ? 480 : 340, e === "time" ? 172 : 284)), R(e === "daterange" ? B ?? /* @__PURE__ */ new Date() : z ?? /* @__PURE__ */ new Date()), ee("day"), z && (e === "time" || e === "datetime") && (H(z.getHours()), G(z.getMinutes())), e === "daterange" && (q("first"), J(null), Y(null)), F(!0));
	}, [
		u,
		m,
		e,
		z,
		B
	]);
	s(() => {
		if (!P) return;
		let e = (e) => {
			N.current && !N.current.contains(e.target) && M.current && !M.current.contains(e.target) && F(!1);
		}, t = (e) => {
			e.key === "Escape" && F(!1);
		};
		return document.addEventListener("mousedown", e), document.addEventListener("keydown", t), () => {
			document.removeEventListener("mousedown", e), document.removeEventListener("keydown", t);
		};
	}, [P]);
	let ue = a((t) => {
		if (e === "daterange") {
			if (K === "first") J(t), q("second"), o?.(St(t, "date"), null);
			else {
				let e = re ?? t, [n, r] = oe(e, t) ? [e, t] : [t, e];
				o?.(St(n, "date"), St(r, "date")), F(!1);
			}
			return;
		}
		if (e === "date") {
			n?.(St(t, "date")), F(!1);
			return;
		}
		if (e === "datetime") {
			let e = new Date(t);
			e.setHours(V, U, 0, 0), n?.(St(e, "datetime"));
		}
	}, [
		e,
		K,
		re,
		V,
		U,
		n,
		o
	]), de = a((t, r) => {
		let i = e === "datetime" && z ? new Date(z) : /* @__PURE__ */ new Date();
		i.setHours(t, r, 0, 0), n?.(St(i, e));
	}, [
		e,
		z,
		n
	]), fe = a((e) => {
		H(e), de(e, U);
	}, [U, de]), pe = a((e) => {
		G(e), de(V, e);
	}, [V, de]), me = (t) => {
		t.stopPropagation(), e === "daterange" ? o?.(null, null) : n?.(null);
	}, he = h && (e === "daterange" ? !!(r || i) : !!t) && !u && !m, ge = D === "sm" ? "h-7 text-sm" : "h-9 text-sm", _e = g(e === "time" ? k : S, { size: 14 }), ve = {
		date: "jj/mm/aaaa",
		time: "hh:mm",
		datetime: "jj/mm/aaaa hh:mm",
		daterange: "jj/mm/aaaa – jj/mm/aaaa"
	}[e], ye = Array.from({ length: 24 }, (e, t) => t), be = Array.from({ length: Math.ceil(60 / E) }, (e, t) => t * E), xe = e !== "time", Se = e === "time" || e === "datetime", Ce = e === "time" ? 172 : 284, we = re ?? B, Te = re ? null : te;
	return /* @__PURE__ */ _("div", {
		className: v("flex flex-col gap-1", O),
		children: [
			c && /* @__PURE__ */ _("label", {
				htmlFor: ce,
				className: "text-sm font-medium text-text-primary",
				children: [c, y && /* @__PURE__ */ g("span", {
					className: "text-danger ml-0.5",
					children: "*"
				})]
			}),
			/* @__PURE__ */ _("div", {
				className: "relative",
				children: [j && /* @__PURE__ */ g("input", {
					type: "hidden",
					name: j,
					value: t ?? "",
					readOnly: !0
				}), /* @__PURE__ */ _("button", {
					ref: M,
					id: ce,
					type: "button",
					onClick: le,
					disabled: u,
					"aria-haspopup": "dialog",
					"aria-expanded": P,
					className: v("w-full flex items-center gap-2 px-3 rounded border bg-white text-left", "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", b ? "border-danger focus:ring-danger" : "border-border", u && "bg-surface-2 cursor-not-allowed opacity-60", m && "cursor-default", ge),
					children: [
						/* @__PURE__ */ g("span", {
							className: "text-text-tertiary shrink-0",
							children: _e
						}),
						/* @__PURE__ */ g("span", {
							className: v("flex-1 truncate", X ? "text-text-primary" : "text-text-tertiary"),
							children: X || (l ?? ve)
						}),
						he ? /* @__PURE__ */ g("button", {
							type: "button",
							onClick: me,
							className: "shrink-0 text-text-tertiary hover:text-text-primary transition-colors",
							tabIndex: -1,
							children: /* @__PURE__ */ g(ne, { size: 13 })
						}) : null
					]
				})]
			}),
			b && /* @__PURE__ */ g("p", {
				className: "text-xs text-danger",
				children: b
			}),
			x && !b && /* @__PURE__ */ g("p", {
				className: "text-xs text-text-secondary",
				children: x
			}),
			P && W(/* @__PURE__ */ g("div", {
				ref: N,
				role: "dialog",
				style: {
					position: "absolute",
					top: ae.top,
					left: ae.left,
					width: Ce,
					zIndex: 9999
				},
				className: "bg-white rounded-xl shadow-2xl border border-border",
				children: /* @__PURE__ */ _("div", {
					className: "p-3 select-none",
					children: [
						xe && /* @__PURE__ */ g(Dt, {
							viewDate: L,
							setViewDate: R,
							view: I,
							setView: ee,
							selected: z,
							onSelect: ue,
							rangeStart: we,
							rangeEnd: Te,
							hoverDate: ie,
							setHoverDate: Y,
							isRange: e === "daterange",
							minDate: C,
							maxDate: w,
							disabledDate: T
						}),
						xe && Se && /* @__PURE__ */ g("div", { className: "my-3 h-px bg-border" }),
						Se && /* @__PURE__ */ _("div", {
							className: "flex items-start justify-center gap-1",
							children: [
								/* @__PURE__ */ g(Et, {
									values: ye,
									selected: V,
									onSelect: fe,
									label: "Heure"
								}),
								/* @__PURE__ */ g("span", {
									className: "mt-8 text-text-tertiary text-base font-semibold",
									children: ":"
								}),
								/* @__PURE__ */ g(Et, {
									values: be,
									selected: be.includes(U) ? U : be.reduce((e, t) => Math.abs(t - U) < Math.abs(e - U) ? t : e),
									onSelect: pe,
									label: "Min"
								})
							]
						}),
						Se && /* @__PURE__ */ _("div", {
							className: "flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border",
							children: [he ? /* @__PURE__ */ g("button", {
								type: "button",
								onClick: (e) => {
									me(e), F(!1);
								},
								className: "text-xs text-text-secondary hover:text-danger transition-colors",
								children: "Effacer"
							}) : /* @__PURE__ */ g("span", {}), /* @__PURE__ */ g("button", {
								type: "button",
								onClick: () => {
									if (!t) {
										let t = e === "datetime" && z ? new Date(z) : /* @__PURE__ */ new Date();
										t.setHours(V, U, 0, 0), n?.(St(t, e));
									}
									F(!1);
								},
								className: "text-xs font-medium px-4 py-1.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors",
								children: "OK"
							})]
						})
					]
				})
			}), document.body)
		]
	});
}
//#endregion
//#region ../../src/ui/fontFamily.ts
var kt = (e) => e.charCodeAt(0) << 24 | e.charCodeAt(1) << 16 | e.charCodeAt(2) << 8 | e.charCodeAt(3), At = kt("name"), jt = kt("ttcf"), Mt = kt("OS/2");
function Nt(e) {
	let t = e.toLowerCase(), n = /italic|oblique/.test(t) ? "italic" : "normal", r = 400;
	return /thin|hairline/.test(t) ? r = 100 : /extra\s*light|ultra\s*light/.test(t) ? r = 200 : /semi\s*light|demi\s*light/.test(t) ? r = 350 : /light/.test(t) ? r = 300 : /medium/.test(t) ? r = 500 : /semi\s*bold|demi\s*bold/.test(t) ? r = 600 : /extra\s*bold|ultra\s*bold/.test(t) ? r = 800 : /black|heavy/.test(t) ? r = 900 : /bold/.test(t) && (r = 700), {
		weight: r,
		style: n
	};
}
function Pt(e) {
	try {
		let t = new DataView(e), n, r;
		if (t.getUint32(0) === jt) {
			let e = t.getUint32(12);
			n = t.getUint16(e + 4), r = e + 12;
		} else n = t.getUint16(4), r = 12;
		let i = -1, a = -1;
		for (let e = 0; e < n; e++) {
			let n = r + e * 16, o = t.getUint32(n);
			o === At ? i = t.getUint32(n + 8) : o === Mt && (a = t.getUint32(n + 8));
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
		let u = c(17) || c(2) || "Regular", d = Nt(u);
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
function Ft(e) {
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
var It = {
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
}, Lt = (e) => `"${e.replace(/"/g, "")}", "Segoe UI", system-ui, sans-serif`, Rt = [
	"sans",
	"serif",
	"mono",
	"script",
	"display"
], zt = {
	sans: "Sans Serif",
	serif: "Serif",
	mono: "Monospace",
	script: "Manuscrite",
	display: "Fantaisie"
}, Bt = /(mono|consol|courier|menlo|monaco|fixedsys|terminal|source code|fira ?code|jetbrains|inconsolata|space mono|ubuntu mono|cascadia|hack|iosevka|\bcode\b)/i, Vt = /(script|hand|brush|comic|cursive|calligr|pacifico|dancing|lobster|caveat|satisfy|sacramento|great vibes|shadows into|indie flower|kalam|marck|allura|tangerine|segoe script|bradley|lucida handwriting)/i, Ht = /(display|impact|bebas|oswald|anton|abril|playbill|stencil|bungee|black ops|fredoka|lilita|luckiest|righteous|permanent marker|creepster|monoton|bangers|poster|headline)/i, Ut = /(serif|times|georgia|garamond|book antiqua|palatino|cambria|constantia|didot|bodoni|minion|caslon|merriweather|playfair|lora|crimson|spectral|slab|rockwell|century|sylfaen|cardo|vollkorn)/i;
function Wt(e) {
	let t = e.toLowerCase();
	return Bt.test(t) ? "mono" : Vt.test(t) ? "script" : Ht.test(t) ? "display" : /\bsans\b/.test(t) ? "sans" : Ut.test(t) ? "serif" : "sans";
}
function Gt(e, t) {
	if (!t) return e;
	let n = e.toLowerCase().indexOf(t.toLowerCase());
	return n < 0 ? e : /* @__PURE__ */ _(h, { children: [
		e.slice(0, n),
		/* @__PURE__ */ g("span", {
			style: {
				color: "var(--color-primary)",
				fontWeight: 600
			},
			children: e.slice(n, n + t.length)
		}),
		e.slice(n + t.length)
	] });
}
function Kt({ value: e, onChange: t, fonts: n, recent: r = [], width: i = 150, height: a = 36, fontSize: o = 14, disabled: l = !1, className: m, variant: h = "default", placeholder: v = "", buttonStyle: y, sampleText: b = "AaBbCc", theme: x = "light" }) {
	let S = It[x], [w, T] = p(!1), [E, D] = p(null), [O, k] = p(""), [A, j] = p(0), M = f(null), N = f(null), P = f(null), F = f(null), I = c(), ee = d(() => Ft([...r, ...n]), [r, n]), L = d(() => new Set(r.map((e) => e.toLowerCase())), [r]), { rows: R, options: B } = d(() => {
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
			for (let e of Rt) n(t.filter((t) => Wt(t) === e).sort((e, t) => e.localeCompare(t)), zt[e]);
		}
		return {
			rows: e,
			options: t
		};
	}, [
		ee,
		L,
		O
	]), te = () => {
		if (l) return;
		let e = M.current?.getBoundingClientRect();
		e && D({
			top: e.bottom + 4,
			left: e.left,
			minWidth: Math.max(248, e.width)
		}), k(""), T((e) => !e);
	};
	s(() => {
		if (!w) return;
		let t = Math.max(0, B.indexOf(e));
		j(t);
		let n = (e) => {
			!M.current?.contains(e.target) && !N.current?.contains(e.target) && T(!1);
		};
		document.addEventListener("mousedown", n);
		let r = setTimeout(() => {
			F.current?.focus(), P.current?.querySelector(`[data-idx="${t}"]`)?.scrollIntoView({ block: "center" });
		}, 0);
		return () => {
			document.removeEventListener("mousedown", n), clearTimeout(r);
		};
	}, [w]), s(() => {
		w && P.current?.querySelector(`[data-idx="${A}"]`)?.scrollIntoView({ block: "nearest" });
	}, [A, w]), u(() => {
		let e = N.current;
		if (!e || !w || !E) return;
		let t = e.getBoundingClientRect(), n = E.left, r = E.top;
		t.right > window.innerWidth - 8 && (n = window.innerWidth - 8 - t.width), t.bottom > window.innerHeight - 8 && (r = Math.max(8, window.innerHeight - 8 - t.height)), n < 8 && (n = 8), e.style.left = `${n}px`, e.style.top = `${r}px`;
	}, [
		w,
		E,
		R.length
	]);
	let V = (e) => {
		t(e), T(!1);
	}, H = (e) => {
		let t = B.length - 1;
		e.key === "ArrowDown" ? (e.preventDefault(), j((e) => Math.min(t, e + 1))) : e.key === "ArrowUp" ? (e.preventDefault(), j((e) => Math.max(0, e - 1))) : e.key === "Home" ? (e.preventDefault(), j(0)) : e.key === "End" ? (e.preventDefault(), j(t)) : e.key === "PageDown" ? (e.preventDefault(), j((e) => Math.min(t, e + 8))) : e.key === "PageUp" ? (e.preventDefault(), j((e) => Math.max(0, e - 8))) : e.key === "Enter" ? (e.preventDefault(), B[A] && V(B[A])) : e.key === "Escape" && (e.preventDefault(), T(!1));
	}, U = h === "ghost", ne = O.trim();
	return /* @__PURE__ */ _("div", {
		className: `relative ${m ?? ""}`,
		style: { width: i },
		children: [/* @__PURE__ */ _("button", {
			type: "button",
			ref: M,
			onClick: te,
			onMouseDown: (e) => e.preventDefault(),
			disabled: l,
			role: "combobox",
			"aria-haspopup": "listbox",
			"aria-expanded": w,
			"aria-controls": I,
			"aria-label": "Police",
			className: "w-full flex items-center justify-between gap-1 select-none",
			style: {
				height: a,
				padding: "0 6px 0 10px",
				fontSize: o,
				color: S.text,
				fontFamily: Lt(e || "Arial"),
				background: w ? S.active : void 0,
				border: `1px solid ${U ? "transparent" : S.border}`,
				borderRadius: "var(--radius-md)",
				cursor: l ? "not-allowed" : "pointer",
				opacity: l ? .5 : 1,
				transition: "background 0.12s, border-color 0.12s",
				...y
			},
			onMouseEnter: (e) => {
				!w && !l && (e.currentTarget.style.background = S.hover);
			},
			onMouseLeave: (e) => {
				w || (e.currentTarget.style.background = "");
			},
			title: e || v,
			children: [/* @__PURE__ */ g("span", {
				className: "truncate flex-1 text-left",
				style: e ? void 0 : { color: S.ter },
				children: e || v
			}), /* @__PURE__ */ g(ht, {
				size: 11,
				color: S.sec
			})]
		}), w && E && W(/* @__PURE__ */ _("div", {
			ref: N,
			onMouseDown: (e) => e.stopPropagation(),
			style: {
				position: "fixed",
				top: E.top,
				left: E.left,
				minWidth: E.minWidth,
				width: "max-content",
				maxWidth: 360,
				zIndex: 9999,
				background: S.bg,
				borderRadius: 10,
				border: `1px solid ${S.border}`,
				boxShadow: "0 8px 24px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.10)",
				overflow: "hidden"
			},
			children: [/* @__PURE__ */ _("div", {
				className: "flex items-center gap-2 px-2.5",
				style: {
					height: 40,
					borderBottom: `1px solid ${S.border}`
				},
				children: [
					/* @__PURE__ */ g(z, {
						size: 15,
						style: {
							color: S.ter,
							flexShrink: 0
						}
					}),
					/* @__PURE__ */ g("input", {
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
					O && /* @__PURE__ */ g("button", {
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
			}), /* @__PURE__ */ _("div", {
				ref: P,
				id: I,
				role: "listbox",
				"aria-activedescendant": B[A] ? `${I}-opt-${A}` : void 0,
				style: {
					maxHeight: 340,
					overflowY: "auto",
					padding: "4px 0"
				},
				children: [B.length === 0 && /* @__PURE__ */ _("div", {
					className: "px-4 py-6 text-center",
					style: {
						color: S.ter,
						fontSize: 12
					},
					children: [
						"Aucune police pour « ",
						ne,
						" »"
					]
				}), R.map((t, n) => t.kind === "header" ? /* @__PURE__ */ g("div", {
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
				}, `h${n}`) : /* @__PURE__ */ _("button", {
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
						/* @__PURE__ */ g("span", {
							style: {
								width: 16,
								flexShrink: 0,
								color: S.accent,
								display: "inline-flex"
							},
							children: t.font === e && /* @__PURE__ */ g(C, { size: 15 })
						}),
						/* @__PURE__ */ g("span", {
							className: "truncate flex-1",
							style: {
								fontFamily: Lt(t.font),
								fontSize: 15
							},
							children: Gt(t.font, ne)
						}),
						b && /* @__PURE__ */ g("span", {
							className: "truncate",
							style: {
								flexShrink: 0,
								maxWidth: 96,
								marginLeft: 8,
								fontFamily: Lt(t.font),
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
var qt = "var(--radius-md)";
function Jt({ value: e, onChange: t, sizes: n, min: r, max: i, width: a, height: o, fontSize: c, disabled: l, boxStyle: d, theme: m = "light" }) {
	let h = It[m], [v, y] = p(!1), [b, x] = p(null), [S, C] = p(e), [w, T] = p(!1), E = f(null), D = f(null), O = f(null);
	s(() => {
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
	return s(() => {
		if (!v) return;
		let e = (e) => {
			!E.current?.contains(e.target) && !O.current?.contains(e.target) && y(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [v]), u(() => {
		let e = O.current;
		if (!e || !v || !b) return;
		let t = e.getBoundingClientRect(), n = b.left, r = b.top;
		t.bottom > window.innerHeight - 8 && (r = Math.max(8, b.top - t.height - o - 8)), t.right > window.innerWidth - 8 && (n = window.innerWidth - 8 - t.width), e.style.left = `${n}px`, e.style.top = `${r}px`;
	}, [
		v,
		b,
		o
	]), /* @__PURE__ */ _("div", {
		ref: E,
		className: "relative",
		style: { width: a },
		children: [/* @__PURE__ */ _("div", {
			className: "flex items-center select-none",
			style: {
				height: o,
				background: v ? h.active : void 0,
				border: `1px solid ${h.border}`,
				cursor: l ? "not-allowed" : "text",
				opacity: l ? .5 : 1,
				transition: "background 0.12s",
				...d
			},
			onMouseEnter: (e) => {
				!v && !l && (e.currentTarget.style.background = h.hover);
			},
			onMouseLeave: (e) => {
				v || (e.currentTarget.style.background = "");
			},
			children: [/* @__PURE__ */ g("input", {
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
					fontSize: c,
					color: h.text,
					fontFamily: "var(--font-family-sans)"
				},
				"aria-label": "Taille de police"
			}), /* @__PURE__ */ g("button", {
				type: "button",
				tabIndex: -1,
				disabled: l,
				onMouseDown: (e) => e.preventDefault(),
				onClick: j,
				"aria-label": "Choisir une taille",
				"aria-haspopup": "listbox",
				"aria-expanded": v,
				className: "flex items-center justify-center",
				style: {
					width: 18,
					height: "100%",
					flexShrink: 0,
					cursor: l ? "not-allowed" : "pointer"
				},
				children: /* @__PURE__ */ g(ht, {
					size: 10,
					color: h.sec
				})
			})]
		}), v && b && W(/* @__PURE__ */ g("div", {
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
				return /* @__PURE__ */ g("button", {
					type: "button",
					role: "option",
					"aria-selected": i,
					onClick: () => {
						t(r), C(r), y(!1);
					},
					className: "w-full text-left",
					style: {
						padding: "5px 12px",
						fontSize: c,
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
function Yt({ font: e, onFontChange: t, fonts: n, recentFonts: r, size: i, onSizeChange: a, sizes: o, minSize: s = 1, maxSize: c = 999, height: l = 30, fontWidth: u = 150, sizeWidth: d = 62, fontSize: f = 14, disabled: p = !1, className: m, theme: h = "light" }) {
	return /* @__PURE__ */ _("div", {
		className: `flex items-stretch ${m ?? ""}`,
		children: [/* @__PURE__ */ g(Kt, {
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
				borderTopLeftRadius: qt,
				borderBottomLeftRadius: qt
			}
		}), /* @__PURE__ */ g("div", {
			style: { marginLeft: -1 },
			children: /* @__PURE__ */ g(Jt, {
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
					borderTopRightRadius: qt,
					borderBottomRightRadius: qt
				}
			})
		})]
	});
}
//#endregion
//#region ../../src/ui/MenuDropdown.tsx
function Xt() {
	let [e, t] = p(() => typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(pointer: coarse)").matches);
	return s(() => {
		let e = window.matchMedia("(pointer: coarse)"), n = () => t(e.matches);
		return e.addEventListener("change", n), () => e.removeEventListener("change", n);
	}, []), e;
}
var Zt = {
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
function Qt({ items: t, pos: n, onClose: r, minWidth: i = 200, theme: a = "light" }) {
	let o = n.minWidth ?? i, c = Zt[a], l = f(null), d = f(null), m = Xt(), [v, y] = p(null), [b, x] = p(null);
	if (s(() => {
		let e = (e) => {
			let t = e.target;
			(t instanceof Element ? t : t?.parentElement ?? null)?.closest("[data-kb-menu]") || r();
		};
		return document.addEventListener("pointerdown", e, !0), () => document.removeEventListener("pointerdown", e, !0);
	}, [r]), mt(!0, r), u(() => {
		let e = l.current;
		if (!e || m) return;
		let t = () => {
			let t = window.innerWidth, r = window.innerHeight;
			d.current && (d.current.style.maxHeight = `${r - 16 - 2}px`), e.style.maxWidth = `${t - 16}px`, e.style.left = `${n.left}px`, e.style.top = `${n.top}px`;
			let i = e.getBoundingClientRect(), a = n.left, o = n.top;
			a + i.width > t - 8 && (a = t - 8 - i.width), o + i.height > r - 8 && (o = r - 8 - i.height), a < 8 && (a = 8), o < 8 && (o = 8), e.style.left = `${a}px`, e.style.top = `${o}px`;
		};
		return t(), window.addEventListener("resize", t), () => window.removeEventListener("resize", t);
	}, [n, m]), m) {
		let n = v ? v.items : t, i = {
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
		return W(/* @__PURE__ */ _(h, { children: [/* @__PURE__ */ g("div", {
			className: "fixed inset-0 z-[9998]",
			style: { background: "rgba(0,0,0,0.35)" },
			onClick: r
		}), /* @__PURE__ */ _("div", {
			ref: l,
			onMouseDown: (e) => e.stopPropagation(),
			[ft]: "",
			className: "fixed left-0 right-0 bottom-0 z-[9999]",
			style: {
				background: c.sheetBg,
				color: c.text,
				borderTopLeftRadius: 16,
				borderTopRightRadius: 16,
				maxHeight: "78vh",
				overflowY: "auto",
				paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
				boxShadow: "0 -8px 30px rgba(0,0,0,0.28)",
				animation: "kbnSheetUp 0.18s ease-out"
			},
			children: [
				/* @__PURE__ */ g("style", { children: "@keyframes kbnSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}" }),
				/* @__PURE__ */ g("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						padding: "8px 0 2px"
					},
					children: /* @__PURE__ */ g("div", { style: {
						width: 38,
						height: 4,
						borderRadius: 2,
						background: c.sep
					} })
				}),
				v && /* @__PURE__ */ _("button", {
					onClick: () => y(null),
					style: {
						...i,
						color: c.text,
						fontWeight: 600,
						borderBottom: `1px solid ${c.sep}`
					},
					children: [/* @__PURE__ */ g("span", {
						style: {
							width: 20,
							flexShrink: 0,
							color: c.accent,
							fontSize: 18,
							display: "inline-flex",
							alignItems: "center"
						},
						children: "‹"
					}), /* @__PURE__ */ g("span", {
						style: { flex: 1 },
						children: v.label
					})]
				}),
				n.map((t, n) => {
					if (t.type === "separator") return /* @__PURE__ */ g("div", { style: {
						background: c.sep,
						height: 1,
						margin: "4px 0"
					} }, n);
					if (t.type === "label") return /* @__PURE__ */ g("div", {
						style: {
							padding: "8px 20px 4px",
							fontSize: "var(--kb-text-body)",
							color: c.label,
							fontWeight: 600,
							textTransform: "uppercase",
							letterSpacing: "0.05em"
						},
						children: t.text
					}, n);
					if (t.type === "custom") return /* @__PURE__ */ g(e.Fragment, { children: t.render(r) }, n);
					if (t.type === "submenu") return /* @__PURE__ */ _("button", {
						disabled: t.disabled,
						onClick: () => y({
							label: t.label,
							items: t.items
						}),
						style: {
							...i,
							color: c.text,
							opacity: t.disabled ? .4 : 1
						},
						children: [
							/* @__PURE__ */ g("span", {
								style: {
									width: 20,
									flexShrink: 0,
									color: c.accent,
									fontSize: 16,
									display: "inline-flex",
									alignItems: "center"
								},
								children: t.icon ?? ""
							}),
							/* @__PURE__ */ g("span", {
								style: { flex: 1 },
								children: t.label
							}),
							/* @__PURE__ */ g("span", {
								style: {
									color: c.label,
									fontSize: 16,
									flexShrink: 0
								},
								children: "›"
							})
						]
					}, n);
					let a = t.danger ? c.danger : c.text;
					return /* @__PURE__ */ _("button", {
						disabled: t.disabled,
						onClick: () => {
							t.onClick(), r();
						},
						style: {
							...i,
							color: a,
							opacity: t.disabled ? .4 : 1
						},
						children: [/* @__PURE__ */ g("span", {
							style: {
								width: 20,
								flexShrink: 0,
								color: t.danger ? c.danger : c.accent,
								fontSize: 16,
								display: "inline-flex",
								alignItems: "center"
							},
							children: t.checked ? "✓" : t.icon ? t.icon : ""
						}), /* @__PURE__ */ g("span", {
							style: { flex: 1 },
							children: t.label
						})]
					}, n);
				})
			]
		})] }), document.body);
	}
	return W(/* @__PURE__ */ _("div", {
		ref: l,
		onMouseDown: (e) => {
			e.preventDefault(), e.stopPropagation();
		},
		[ft]: "",
		className: a === "dark" ? "kb-frosted kb-frosted-dark" : "kb-frosted",
		style: {
			position: "fixed",
			top: n.top,
			left: n.left,
			minWidth: o,
			zIndex: 9999
		},
		children: [/* @__PURE__ */ g("div", {
			className: "kb-frost-layer",
			"aria-hidden": !0
		}), /* @__PURE__ */ g("div", {
			ref: d,
			style: {
				padding: 5,
				overflowY: "auto",
				overflowX: "hidden"
			},
			children: t.map((t, n) => {
				if (t.type === "separator") return /* @__PURE__ */ g("div", { style: {
					background: c.sep,
					height: 1,
					margin: "5px 6px"
				} }, n);
				if (t.type === "label") return /* @__PURE__ */ g("div", {
					style: {
						padding: "4px 10px",
						fontSize: "var(--kb-text-meta)",
						color: c.label,
						fontWeight: 600,
						textTransform: "uppercase",
						letterSpacing: "0.05em"
					},
					children: t.text
				}, n);
				if (t.type === "submenu") return /* @__PURE__ */ g($t, {
					item: t,
					onClose: r,
					theme: a,
					index: n,
					hovered: b,
					setHovered: x
				}, n);
				if (t.type === "custom") return /* @__PURE__ */ g(e.Fragment, { children: t.render(r) }, n);
				let i = b === n && !t.disabled, o = i ? c.hoverText : t.danger ? c.danger : c.text;
				return /* @__PURE__ */ _("button", {
					disabled: t.disabled,
					onClick: () => {
						t.onClick(), r();
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
						background: i ? c.hover : "transparent"
					},
					children: [
						/* @__PURE__ */ g("span", {
							style: {
								width: 20,
								flexShrink: 0,
								color: i ? c.hoverText : t.danger ? c.danger : c.accent,
								fontSize: 14,
								display: "inline-flex",
								alignItems: "center"
							},
							children: t.checked ? "✓" : t.icon ? t.icon : ""
						}),
						/* @__PURE__ */ g("span", {
							className: "flex-1",
							children: t.label
						}),
						t.shortcut && /* @__PURE__ */ g("span", {
							style: {
								color: i ? c.hoverText : c.shortcut,
								fontSize: "var(--kb-text-body)",
								marginLeft: 24,
								flexShrink: 0,
								opacity: i ? .85 : 1
							},
							children: t.shortcut
						})
					]
				}, n);
			})
		})]
	}), document.body);
}
function $t({ item: t, onClose: n, theme: r, index: i, hovered: a, setHovered: o }) {
	let [s, c] = e.useState(null), l = Zt[r], u = f(null), d = f(void 0), p = () => {
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
	return /* @__PURE__ */ _("div", {
		onMouseEnter: () => {
			o(i), p();
		},
		onMouseLeave: () => {
			o((e) => e === i ? null : e), m();
		},
		style: { position: "relative" },
		children: [/* @__PURE__ */ _("button", {
			ref: u,
			disabled: t.disabled,
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
				/* @__PURE__ */ g("span", {
					style: {
						width: 20,
						flexShrink: 0,
						color: h ? l.hoverText : l.accent,
						fontSize: 14,
						display: "inline-flex",
						alignItems: "center"
					},
					children: t.icon ?? ""
				}),
				/* @__PURE__ */ g("span", {
					className: "flex-1",
					children: t.label
				}),
				/* @__PURE__ */ g("span", {
					style: {
						color: h ? l.hoverText : l.label,
						fontSize: "var(--kb-text-body)",
						marginLeft: 24,
						flexShrink: 0
					},
					children: "▸"
				})
			]
		}), s && /* @__PURE__ */ g("div", {
			onMouseEnter: p,
			onMouseLeave: m,
			children: /* @__PURE__ */ g(Qt, {
				items: t.items,
				pos: s,
				onClose: n,
				theme: r
			})
		})]
	});
}
function en() {
	let [t, n] = e.useState(null);
	return {
		pos: t,
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
		isOpen: t !== null
	};
}
//#endregion
//#region ../../src/ui/Tabs.tsx
var tn = {
	tabs_scroll_left: "Scroll tabs left",
	tabs_scroll_right: "Scroll tabs right"
};
function nn({ tabs: e, value: t, onChange: n, className: r, size: i = "md", variant: o = "underline", t: c }) {
	let l = (e) => e === t, u = i === "sm" ? 14 : 16, d = (e) => c ? c(e) : tn[e] ?? e, m = f(null), [h, y] = p({
		left: !1,
		right: !1
	}), b = a(() => {
		let e = m.current;
		if (!e) return;
		let t = e.scrollWidth - e.clientWidth;
		y((n) => {
			let r = {
				left: e.scrollLeft > 1,
				right: e.scrollLeft < t - 1
			};
			return n.left === r.left && n.right === r.right ? n : r;
		});
	}, []);
	s(() => {
		let e = m.current;
		if (!e || o !== "underline") return;
		b(), e.addEventListener("scroll", b, { passive: !0 });
		let t = new ResizeObserver(b);
		t.observe(e);
		for (let n of Array.from(e.children)) t.observe(n);
		return () => {
			e.removeEventListener("scroll", b), t.disconnect();
		};
	}, [
		b,
		o,
		e.length
	]);
	let x = (e) => {
		let t = m.current;
		t && t.scrollBy({
			left: e * Math.max(120, t.clientWidth * .75),
			behavior: "smooth"
		});
	}, S = v(o === "pills" && "flex gap-1", o === "stretched" && "flex border-b border-border", r), C = (e) => v("flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors", i === "sm" && "px-3 py-1.5", i === "md" && "px-4 py-2", (o === "underline" || o === "stretched") && "-mb-px border-b-[3px]", (o === "underline" || o === "stretched") && l(e) && "border-primary text-primary", (o === "underline" || o === "stretched") && !l(e) && "border-transparent text-text-secondary hover:text-text-primary", o === "stretched" && "flex-1 justify-center", o === "pills" && "rounded-full", o === "pills" && l(e) && "bg-primary-light text-primary", o === "pills" && !l(e) && "text-text-secondary hover:bg-surface-2"), w = "flex shrink-0 items-center px-0.5 text-text-secondary transition-colors hover:text-text-primary", D = e.map((e) => {
		let t = e.icon;
		return /* @__PURE__ */ _("button", {
			type: "button",
			role: "tab",
			"aria-selected": l(e.id),
			onClick: () => n(e.id),
			className: C(e.id),
			children: [
				t && /* @__PURE__ */ g(t, { size: u }),
				e.label,
				e.badge !== void 0 && /* @__PURE__ */ g("span", {
					className: v("rounded-full text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1", l(e.id) ? "bg-primary text-white" : "bg-surface-3 text-text-secondary"),
					children: e.badge
				})
			]
		}, e.id);
	});
	return o === "underline" ? /* @__PURE__ */ _("div", {
		className: v("flex items-stretch border-b border-border", r),
		children: [
			h.left && /* @__PURE__ */ g("button", {
				type: "button",
				"aria-label": d("tabs_scroll_left"),
				className: w,
				onClick: () => x(-1),
				children: /* @__PURE__ */ g(T, { size: u })
			}),
			/* @__PURE__ */ g("div", {
				ref: m,
				role: "tablist",
				className: "no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden",
				children: D
			}),
			h.right && /* @__PURE__ */ g("button", {
				type: "button",
				"aria-label": d("tabs_scroll_right"),
				className: w,
				onClick: () => x(1),
				children: /* @__PURE__ */ g(E, { size: u })
			})
		]
	}) : /* @__PURE__ */ g("div", {
		className: S,
		role: "tablist",
		children: D
	});
}
//#endregion
//#region ../../src/ui/Accordion.tsx
function rn({ items: t, defaultOpen: n = [], open: r, onOpenChange: i, single: a = !1, className: o, size: s = "md" }) {
	let c = r !== void 0, [l, u] = e.useState(n), d = c ? r : l, f = (e, t) => {
		let n = e.includes(t);
		return a ? n ? [] : [t] : n ? e.filter((e) => e !== t) : [...e, t];
	}, p = (e) => {
		c ? i?.(f(r, e)) : (u((t) => f(t, e)), i?.(f(d, e)));
	}, m = s === "sm" ? "px-3 py-2" : "px-4 py-3";
	return /* @__PURE__ */ g("div", {
		className: v("flex flex-col gap-2", o),
		children: t.map((e) => {
			let t = d.includes(e.id), n = e.icon;
			return /* @__PURE__ */ _("div", {
				className: "rounded-xl border border-border bg-surface-0 overflow-hidden",
				children: [/* @__PURE__ */ _("button", {
					type: "button",
					disabled: e.disabled,
					"aria-expanded": t,
					onClick: () => !e.disabled && p(e.id),
					className: v("flex w-full items-center gap-3 text-left transition-colors", m, e.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-surface-2"),
					children: [
						n && /* @__PURE__ */ g(n, {
							size: 16,
							className: "shrink-0 text-text-secondary"
						}),
						/* @__PURE__ */ g("span", {
							className: "flex-1 min-w-0 text-xs font-semibold uppercase tracking-wide text-text-secondary truncate",
							children: e.title
						}),
						e.badge !== void 0 && /* @__PURE__ */ g("span", {
							className: "rounded-full bg-surface-3 text-text-secondary text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1",
							children: e.badge
						}),
						/* @__PURE__ */ g(w, {
							size: 16,
							className: v("shrink-0 text-text-tertiary transition-transform duration-200", t && "rotate-180")
						})
					]
				}), /* @__PURE__ */ g("div", {
					className: "grid transition-[grid-template-rows] duration-200 ease-out",
					style: { gridTemplateRows: t ? "1fr" : "0fr" },
					children: /* @__PURE__ */ g("div", {
						className: "overflow-hidden",
						children: /* @__PURE__ */ g("div", {
							className: v(s === "sm" ? "px-3 pb-3" : "px-4 pb-4", "pt-1 border-t border-border"),
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
function an({ position: e, onResize: t, min: n = 160, max: r = 560, onReset: i, title: a }) {
	return /* @__PURE__ */ _("div", {
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
		children: [/* @__PURE__ */ g("div", { className: "absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/40 transition-colors" }), /* @__PURE__ */ g("div", {
			className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center\n                      h-9 w-3.5 rounded-full bg-surface-0 border border-border text-text-tertiary shadow-sm\n                      opacity-80 group-hover:opacity-100 group-hover:bg-primary-light group-hover:text-primary\n                      group-hover:border-primary/40 transition",
			children: /* @__PURE__ */ g(M, { size: 13 })
		})]
	});
}
function on(e, t, n = 160, r = 560) {
	let [i, a] = p(() => {
		let i = Number(localStorage.getItem(e));
		return i >= n && i <= r ? i : t;
	});
	return s(() => {
		try {
			localStorage.setItem(e, String(i));
		} catch {}
	}, [e, i]), [i, a];
}
//#endregion
//#region ../../src/ui/StartPage.tsx
var sn = "kubuno.startpage.recentW", cn = 180, ln = 520, un = 256;
function dn({ recentTitle: e = "Récents", recentIcon: t, recentItems: n, recentEmpty: r, tabs: i, defaultTab: a, activeTab: o, onTabChange: s }) {
	let [c, l] = p(a ?? i[0]?.id ?? ""), u = o ?? c, [d, f] = on(sn, un, cn, ln), m = (e) => {
		s?.(e), o === void 0 && l(e);
	}, v = i.map((e) => ({
		id: e.id,
		label: e.label
	})), y = i.find((e) => e.id === u) ?? i[0], [b, x] = p(null), S = (e, t) => {
		!t.actions || t.actions.length === 0 || (e.preventDefault(), x({
			x: Math.min(e.clientX, window.innerWidth - 200),
			y: Math.min(e.clientY, window.innerHeight - (t.actions.length * 36 + 16)),
			actions: t.actions
		}));
	};
	return /* @__PURE__ */ _("div", {
		className: "relative flex h-full overflow-hidden bg-white",
		children: [
			/* @__PURE__ */ _("aside", {
				className: "hidden lg:flex flex-shrink-0 bg-surface-1 flex-col overflow-hidden",
				style: { width: d },
				children: [/* @__PURE__ */ _("div", {
					className: "px-4 h-[57px] flex items-center gap-2 border-b border-border flex-shrink-0",
					children: [/* @__PURE__ */ g("span", {
						className: "text-text-tertiary flex-shrink-0",
						children: t ?? /* @__PURE__ */ g(k, { size: 15 })
					}), /* @__PURE__ */ g("span", {
						className: "text-sm font-medium text-text-primary",
						children: e
					})]
				}), n.length === 0 ? /* @__PURE__ */ g("div", {
					className: "flex-1 flex items-center justify-center px-4 text-center",
					children: r ?? /* @__PURE__ */ g("p", {
						className: "text-text-tertiary text-xs",
						children: "—"
					})
				}) : /* @__PURE__ */ g("div", {
					className: "flex-1 overflow-y-auto py-1",
					children: n.map((e) => /* @__PURE__ */ _("button", {
						onClick: e.onClick,
						onContextMenu: (t) => S(t, e),
						className: `w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${e.pendingTone ? "pointer-events-none" : "hover:bg-surface-2"}`,
						style: e.pendingTone ? { backgroundColor: e.pendingTone === "permanent" ? "#fee2e2" : "#f3e8ff" } : void 0,
						children: [e.icon && /* @__PURE__ */ g("span", {
							className: "flex-shrink-0",
							children: e.icon
						}), /* @__PURE__ */ _("span", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ g("span", {
								className: "block text-sm text-text-primary truncate",
								title: e.name,
								children: e.name
							}), e.subtitle && /* @__PURE__ */ g("span", {
								className: "block text-[11px] text-text-tertiary",
								children: e.subtitle
							})]
						})]
					}, e.id))
				})]
			}),
			/* @__PURE__ */ g("div", {
				className: "hidden lg:block",
				children: /* @__PURE__ */ g(an, {
					position: d,
					onResize: f,
					min: cn,
					max: ln,
					onReset: () => f(un),
					title: e
				})
			}),
			/* @__PURE__ */ _("div", {
				className: "flex-1 min-w-0 flex flex-col overflow-hidden",
				children: [/* @__PURE__ */ g("div", {
					className: "px-6 h-[57px] flex items-center flex-shrink-0 border-b border-border",
					children: /* @__PURE__ */ g(nn, {
						tabs: v,
						value: u,
						onChange: m
					})
				}), /* @__PURE__ */ g("div", {
					className: "flex-1 min-h-0 overflow-hidden flex flex-col",
					children: y?.content
				})]
			}),
			b && /* @__PURE__ */ _(h, { children: [/* @__PURE__ */ g("div", {
				className: "fixed inset-0 z-[9998]",
				onClick: () => x(null),
				onContextMenu: (e) => {
					e.preventDefault(), x(null);
				}
			}), /* @__PURE__ */ g("div", {
				className: "fixed z-[9999] min-w-[190px] bg-white border border-border rounded-lg shadow-lg py-1",
				style: {
					top: b.y,
					left: b.x
				},
				children: b.actions.map((e) => /* @__PURE__ */ _("button", {
					onClick: () => {
						x(null), e.onClick();
					},
					className: `w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                  ${e.danger ? "text-danger hover:bg-danger/10" : "text-text-primary hover:bg-surface-1"}`,
					children: [e.icon && /* @__PURE__ */ g("span", {
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
function fn({ size: e = 24, className: t, title: n = "Kubuno" }) {
	return /* @__PURE__ */ _("svg", {
		width: Math.round(e * 321 / 346),
		height: e,
		viewBox: "0 0 321 346",
		fill: "currentColor",
		role: "img",
		"aria-label": n,
		className: t,
		children: [/* @__PURE__ */ g("title", { children: n }), /* @__PURE__ */ _("g", {
			transform: "translate(0,346) scale(0.1,-0.1)",
			stroke: "none",
			children: [
				/* @__PURE__ */ g("path", { d: "M264 3307 c-3 -8 -3 -434 -1 -948 3 -913 3 -936 24 -1009 70 -249 198 -454 419 -672 125 -123 303 -268 328 -268 3 0 5 654 4 1452 l-3 1453 -383 3 c-313 2 -383 0 -388 -11z" }),
				/* @__PURE__ */ g("path", { d: "M1187 3313 c-4 -3 -7 -680 -7 -1504 l0 -1498 27 -19 c38 -27 279 -165 354 -202 l61 -31 61 32 c34 17 87 47 118 65 31 19 60 34 64 34 3 0 26 14 51 30 l44 31 0 729 c0 608 2 731 14 742 7 7 112 110 233 228 120 118 343 336 496 484 l277 269 -2 306 -3 306 -204 3 -203 2 -87 -83 c-47 -47 -151 -147 -231 -225 l-145 -140 -5 -299 -5 -299 -60 -62 c-32 -34 -63 -62 -67 -62 -4 0 -9 262 -10 583 l-3 582 -381 3 c-209 1 -383 -1 -387 -5z" }),
				/* @__PURE__ */ g("path", { d: "M2217 1782 l-118 -117 1 -265 2 -265 225 -225 224 -225 61 64 c133 140 264 349 319 508 l20 58 -143 138 c-294 284 -459 442 -466 444 -4 1 -60 -51 -125 -115z" })
			]
		})]
	});
}
//#endregion
//#region ../../src/ui/LabelIcon.tsx
var pn = 596.432 / 363.452;
function mn({ size: e = 24, className: t, style: n, title: r }) {
	return /* @__PURE__ */ _("svg", {
		width: Math.round(e * pn * 100) / 100,
		height: e,
		viewBox: "767.938 486.862 596.432 363.452",
		fill: "currentColor",
		fillRule: "evenodd",
		role: r ? "img" : "presentation",
		"aria-label": r,
		"aria-hidden": r ? void 0 : !0,
		className: t,
		style: n,
		children: [r ? /* @__PURE__ */ g("title", { children: r }) : null, /* @__PURE__ */ g("path", { d: "M 768.043 532.379 C 768.038 531.247 768.032 530.114 768.022 528.982 C 768.092 516.215 773.502 503.855 782.953 495.248 C 790.446 490.278 799.172 486.948 808.246 486.943 C 933.616 486.943 1058.987 487.154 1184.356 486.862 C 1204.994 486.939 1226 494.556 1239.253 510.908 C 1278.229 553.311 1313.462 599.023 1353.231 640.714 C 1362.194 650.714 1366.005 664.389 1363.723 677.601 C 1361.66 684.459 1358.251 690.999 1353.193 696.128 C 1316.095 738.242 1277.805 779.332 1242.223 822.758 C 1227.039 841.321 1203.692 850.288 1180.063 850.239 C 1057.966 850.239 935.868 850.03 813.771 850.315 C 799.369 850.259 784.332 845.812 775.393 833.828 C 771.05 826.781 768.313 818.676 768.303 810.349 C 767.818 717.693 767.914 625.036 768.043 532.379 Z M 1276.456 668.588 A 41.516 41.516 0 1 1 1193.425 668.588 A 41.516 41.516 0 1 1 1276.456 668.588 Z" })]
	});
}
//#endregion
//#region ../../src/ui/color.ts
function hn(e) {
	return [
		parseInt(e.slice(1, 3), 16),
		parseInt(e.slice(3, 5), 16),
		parseInt(e.slice(5, 7), 16)
	];
}
function gn(e, t, n) {
	return "#" + [
		e,
		t,
		n
	].map((e) => Math.max(0, Math.min(255, Math.round(e))).toString(16).padStart(2, "0")).join("");
}
function _n(e, t, n) {
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
function vn(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function yn(e, t, n) {
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
		vn(i, r, e + 1 / 3) * 255,
		vn(i, r, e) * 255,
		vn(i, r, e - 1 / 3) * 255
	];
}
function bn(e, t, n) {
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
function Q(e, t, n) {
	e = (e % 360 + 360) % 360;
	let r = n * t, i = r * (1 - Math.abs(e / 60 % 2 - 1)), a = n - r, o = 0, s = 0, c = 0;
	return e < 60 ? (o = r, s = i) : e < 120 ? (o = i, s = r) : e < 180 ? (s = r, c = i) : e < 240 ? (s = i, c = r) : e < 300 ? (o = i, c = r) : (o = r, c = i), [
		(o + a) * 255,
		(s + a) * 255,
		(c + a) * 255
	];
}
function xn(e, t, n) {
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
function $(e, t, n, r) {
	return e /= 100, t /= 100, n /= 100, r /= 100, [
		255 * (1 - e) * (1 - r),
		255 * (1 - t) * (1 - r),
		255 * (1 - n) * (1 - r)
	];
}
//#endregion
//#region ../../src/ui/ColorPicker.tsx
var Sn = {
	accent: "#5a9bdc",
	border: "#212121",
	text: "#d6d6d6",
	textDim: "#8e8e8e",
	toolbar: "#393939",
	surface: "#252525",
	title: "#c0c0c0"
}, Cn = {
	accent: "#1a73e8",
	border: "#dadce0",
	text: "#202124",
	textDim: "#5f6368",
	toolbar: "#ffffff",
	surface: "#f1f3f4",
	title: "#5f6368"
};
function wn(e, t) {
	return typeof window > "u" ? t : getComputedStyle(document.documentElement).getPropertyValue(e).trim() || t;
}
function Tn() {
	return {
		accent: wn("--color-primary", "#1a73e8"),
		border: wn("--color-border", "#dadce0"),
		text: wn("--color-text-primary", "#202124"),
		textDim: wn("--color-text-secondary", "#5f6368"),
		toolbar: wn("--color-surface-0", "#ffffff"),
		surface: wn("--color-surface-2", "#f1f3f4"),
		title: wn("--color-text-secondary", "#5f6368")
	};
}
function En() {
	let [e, t] = p(Tn);
	return s(() => {
		let e = new MutationObserver(() => t(Tn()));
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
var Dn = {
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
function On(e, t, n, r) {
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
var kn = {
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
function An({ scheme: e, size: t = 20, color: n = "currentColor" }) {
	let r = t / 2, i = t / 2 - 3, a = Math.max(1.6, t * .095), o = (e === "analog" ? [
		-48,
		0,
		48
	] : kn[e]).map((e) => [r + i * Math.sin(e * Math.PI / 180), r - i * Math.cos(e * Math.PI / 180)]), s = o.map(([e, t]) => `${e.toFixed(1)},${t.toFixed(1)}`).join(" ");
	return /* @__PURE__ */ _("svg", {
		width: t,
		height: t,
		viewBox: `0 0 ${t} ${t}`,
		fill: "none",
		strokeLinejoin: "round",
		strokeLinecap: "round",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ g("circle", {
			cx: r,
			cy: r,
			r: i,
			stroke: n,
			strokeOpacity: .3,
			strokeWidth: 1
		}), e === "mono" ? /* @__PURE__ */ _(h, { children: [/* @__PURE__ */ g("line", {
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
		].map((e, t) => /* @__PURE__ */ g("circle", {
			cx: r,
			cy: r - i * e,
			r: t === 3 ? a * 1.25 : a,
			fill: n,
			fillOpacity: .45 + .18 * (t + 1)
		}, t))] }) : /* @__PURE__ */ _(h, { children: [o.length === 2 ? /* @__PURE__ */ g("line", {
			x1: o[0][0],
			y1: o[0][1],
			x2: o[1][0],
			y2: o[1][1],
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2
		}) : e === "analog" ? /* @__PURE__ */ g("path", {
			d: `M${o[0][0].toFixed(1)},${o[0][1].toFixed(1)} A${i},${i} 0 0 1 ${o[2][0].toFixed(1)},${o[2][1].toFixed(1)}`,
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2,
			fill: "none"
		}) : /* @__PURE__ */ g("polygon", {
			points: s,
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2,
			fill: n,
			fillOpacity: .14
		}), o.map(([e, t], r) => /* @__PURE__ */ g("circle", {
			cx: e,
			cy: t,
			r: r === 0 ? a * 1.3 : a,
			fill: n
		}, r))] })]
	});
}
function jn({ size: e, h: t, s: n, v: r, shape: i, onChange: a }) {
	let o = f(null), c = f(!1), l = e / 2 - 1, u = e / 2, d = e / 2, p = .8660254, m = {
		w: [u, d - l],
		blk: [u - l * p, d + l * .5],
		hue: [u + l * p, d + l * .5]
	}, h = (e, t, n, r, i) => {
		let a = (r[1] - i[1]) * (n[0] - i[0]) + (i[0] - r[0]) * (n[1] - i[1]), o = ((r[1] - i[1]) * (e - i[0]) + (i[0] - r[0]) * (t - i[1])) / a, s = ((i[1] - n[1]) * (e - i[0]) + (n[0] - i[0]) * (t - i[1])) / a;
		return [
			o,
			s,
			1 - o - s
		];
	}, v = () => {
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
	s(() => {
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
			let [m, g, _] = Q(t, r, o);
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
	s(() => {
		let e = (e) => {
			c.current && y(e);
		}, t = () => {
			c.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let [b, x] = v();
	return /* @__PURE__ */ _("div", {
		className: "absolute",
		style: {
			left: (212 - e) / 2,
			top: (212 - e) / 2,
			width: e,
			height: e
		},
		children: [/* @__PURE__ */ g("canvas", {
			ref: o,
			tabIndex: 0,
			role: "slider",
			"aria-label": "Saturation / valeur",
			"aria-valuetext": `S ${Math.round(n * 100)}%, V ${Math.round(r * 100)}%`,
			onPointerDown: (e) => {
				c.current = !0, y(e);
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
		}), /* @__PURE__ */ g("div", {
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
function Mn({ label: e, value: t, max: n, track: r, onInput: i, C: a }) {
	let o = f(null), c = f(!1), l = (e) => {
		let t = o.current;
		if (!t) return;
		let r = t.getBoundingClientRect();
		i(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * n);
	};
	return s(() => {
		let e = (e) => {
			c.current && l(e);
		}, t = () => {
			c.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	}), /* @__PURE__ */ _("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ g("span", {
				className: "text-[10px] w-3 text-center",
				style: { color: a.textDim },
				children: e
			}),
			/* @__PURE__ */ g("div", {
				ref: o,
				tabIndex: 0,
				role: "slider",
				"aria-label": e,
				"aria-valuemin": 0,
				"aria-valuemax": Math.round(n),
				"aria-valuenow": Math.round(t),
				onPointerDown: (e) => {
					c.current = !0, l(e);
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
				children: /* @__PURE__ */ g("div", {
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
			/* @__PURE__ */ g("input", {
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
function Nn({ t: e, color: t, onChange: n, onClose: r, C: i = Sn, history: a = [], onPickHistory: o, onConfirm: c, onCancel: l, confirmLabel: u, cancelLabel: d, leftTools: m = [] }) {
	let h = {
		...Sn,
		...i
	}, v = (t) => e ? e(t) : Dn[t] ?? t, [y, b, x] = hn(t), [S, C, w] = bn(y, b, x), [T, E] = p(S), [D, k] = p(C), [A, j] = p(w), [M, N] = p("RGB"), [P, F] = p("square"), [I, ee] = p("comp");
	s(() => {
		let [e, n, r] = hn(t);
		if (gn(...Q(T, D, A)).toLowerCase() !== t.toLowerCase()) {
			let [t, i, a] = bn(e, n, r);
			E(t), k(i), j(a);
		}
	}, [t]);
	let R = (e, t, r) => {
		E(e), k(t), j(r), n(gn(...Q(e, t, r)));
	}, z = (e, t, n) => {
		let [r, i, a] = bn(e, t, n);
		R(r, i, a);
	}, te = typeof window < "u" && "EyeDropper" in window, V = async () => {
		let e = window.EyeDropper;
		if (e) try {
			let [t, n, r] = hn((await new e().open()).sRGBHex);
			z(t, n, r);
		} catch {}
	}, U = f(null), ne = f(!1), W = (e) => {
		let t = U.current;
		if (!t) return;
		let n = t.getBoundingClientRect(), r = e.clientX - n.left - n.width / 2, i = e.clientY - n.top - n.height / 2, a = Math.atan2(r, -i) * 180 / Math.PI;
		a = (a + 360) % 360, R(a, D, A);
	};
	s(() => {
		let e = (e) => {
			ne.current && W(e);
		}, t = () => {
			ne.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let [G, K, q] = Q(T, D, A).map(Math.round), re = gn(...Q(T, 1, 1)), J = gn(G, K, q), ie = T * Math.PI / 180, Y = 212 / 2 + 95 * Math.sin(ie), ae = 212 / 2 - 95 * Math.cos(ie), oe = Math.round(156 / Math.SQRT2), se = P === "square" ? oe : 162, ce = On(I, T, D, A), X = (e, t, n) => gn(Math.round(e), Math.round(t), Math.round(n)), le = [];
	if (M === "RGB") le = [
		{
			l: "R",
			val: G,
			max: 255,
			track: `linear-gradient(to right,${X(0, K, q)},${X(255, K, q)})`,
			set: (e) => z(e, K, q)
		},
		{
			l: "G",
			val: K,
			max: 255,
			track: `linear-gradient(to right,${X(G, 0, q)},${X(G, 255, q)})`,
			set: (e) => z(G, e, q)
		},
		{
			l: "B",
			val: q,
			max: 255,
			track: `linear-gradient(to right,${X(G, K, 0)},${X(G, K, 255)})`,
			set: (e) => z(G, K, e)
		}
	];
	else if (M === "HSV") le = [
		{
			l: "H",
			val: T,
			max: 360,
			track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
			set: (e) => R(e, D, A)
		},
		{
			l: "S",
			val: D * 100,
			max: 100,
			track: `linear-gradient(to right,${X(...Q(T, 0, A))},${X(...Q(T, 1, A))})`,
			set: (e) => R(T, e / 100, A)
		},
		{
			l: "V",
			val: A * 100,
			max: 100,
			track: `linear-gradient(to right,#000,${X(...Q(T, D, 1))})`,
			set: (e) => R(T, D, e / 100)
		}
	];
	else if (M === "HSL") {
		let [e, t, n] = _n(G, K, q);
		le = [
			{
				l: "H",
				val: e,
				max: 360,
				track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
				set: (e) => z(...yn(e, t, n))
			},
			{
				l: "S",
				val: t * 100,
				max: 100,
				track: `linear-gradient(to right,${X(...yn(e, 0, n))},${X(...yn(e, 1, n))})`,
				set: (t) => z(...yn(e, t / 100, n))
			},
			{
				l: "L",
				val: n * 100,
				max: 100,
				track: `linear-gradient(to right,#000,${X(...yn(e, t, .5))},#fff)`,
				set: (n) => z(...yn(e, t, n / 100))
			}
		];
	} else if (M === "CMYK") {
		let [e, t, n, r] = xn(G, K, q);
		le = [
			{
				l: "C",
				val: e,
				max: 100,
				track: `linear-gradient(to right,${X(...$(0, t, n, r))},${X(...$(100, t, n, r))})`,
				set: (e) => z(...$(e, t, n, r))
			},
			{
				l: "M",
				val: t,
				max: 100,
				track: `linear-gradient(to right,${X(...$(e, 0, n, r))},${X(...$(e, 100, n, r))})`,
				set: (t) => z(...$(e, t, n, r))
			},
			{
				l: "Y",
				val: n,
				max: 100,
				track: `linear-gradient(to right,${X(...$(e, t, 0, r))},${X(...$(e, t, 100, r))})`,
				set: (n) => z(...$(e, t, n, r))
			},
			{
				l: "K",
				val: r,
				max: 100,
				track: `linear-gradient(to right,${X(...$(e, t, n, 0))},#000)`,
				set: (r) => z(...$(e, t, n, r))
			}
		];
	} else le = [{
		l: "K",
		val: Math.round((G + K + q) / 3) / 255 * 100,
		max: 100,
		track: "linear-gradient(to right,#000,#fff)",
		set: (e) => {
			let t = Math.round(e / 100 * 255);
			z(t, t, t);
		}
	}];
	return /* @__PURE__ */ _("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 312,
			background: h.toolbar,
			border: `1px solid ${h.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ _("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ g("span", {
					className: "text-[10px] font-medium",
					style: { color: h.title },
					children: v("layer_color_picker")
				}), /* @__PURE__ */ g("button", {
					onClick: r,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: h.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ _("div", {
				className: "flex items-start gap-1.5 justify-center",
				children: [
					/* @__PURE__ */ _("div", {
						className: "flex flex-col gap-1",
						style: { height: 212 },
						children: [
							[
								"square",
								"triangle",
								"circle"
							].map((e) => {
								let t = P === e;
								return /* @__PURE__ */ g("button", {
									onClick: () => F(e),
									title: e,
									"aria-pressed": t,
									className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
									style: {
										background: t ? h.accent : h.surface,
										color: t ? "#fff" : h.textDim,
										border: `1px solid ${t ? h.accent : h.border}`
									},
									children: g(e === "square" ? B : e === "triangle" ? H : O, { size: 15 })
								}, e);
							}),
							te && /* @__PURE__ */ g("button", {
								onClick: V,
								title: v("layer_color_eyedropper"),
								"aria-label": v("layer_color_eyedropper"),
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
								children: /* @__PURE__ */ g(L, { size: 14 })
							}),
							m.map((e) => /* @__PURE__ */ g("button", {
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
					/* @__PURE__ */ _("div", {
						className: "relative",
						style: {
							width: 212,
							height: 212
						},
						children: [
							/* @__PURE__ */ g("div", {
								ref: U,
								tabIndex: 0,
								role: "slider",
								"aria-label": v("layer_color_picker"),
								"aria-valuemin": 0,
								"aria-valuemax": 360,
								"aria-valuenow": Math.round(T),
								onPointerDown: (e) => {
									ne.current = !0, W(e);
								},
								onKeyDown: (e) => {
									let t = e.shiftKey ? 10 : 1;
									if (e.key === "ArrowLeft" || e.key === "ArrowDown") R((T - t + 360) % 360, D, A);
									else if (e.key === "ArrowRight" || e.key === "ArrowUp") R((T + t) % 360, D, A);
									else return;
									e.preventDefault();
								},
								className: "absolute inset-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
								style: { background: "conic-gradient(#f00 0deg,#ff0 60deg,#0f0 120deg,#0ff 180deg,#00f 240deg,#f0f 300deg,#f00 360deg)" }
							}),
							/* @__PURE__ */ g("div", {
								className: "absolute rounded-full",
								style: {
									inset: 22,
									background: h.toolbar
								}
							}),
							/* @__PURE__ */ g("div", {
								className: "absolute rounded-full pointer-events-none",
								style: {
									width: 14,
									height: 14,
									border: "2px solid #fff",
									boxShadow: "0 0 0 1px rgba(0,0,0,.6)",
									background: re,
									left: Y - 7,
									top: ae - 7
								}
							}),
							ce.slice(1).map((e, t) => {
								let n = e[0] * Math.PI / 180, r = 212 / 2 + 95 * Math.sin(n), i = 212 / 2 - 95 * Math.cos(n);
								return /* @__PURE__ */ g("div", {
									className: "absolute rounded-full pointer-events-none",
									style: {
										width: 10,
										height: 10,
										border: "2px solid rgba(255,255,255,.85)",
										background: gn(...Q(e[0], e[1], e[2])),
										left: r - 5,
										top: i - 5
									}
								}, t);
							}),
							/* @__PURE__ */ g(jn, {
								size: se,
								h: T,
								s: D,
								v: A,
								shape: P,
								onChange: (e, t) => R(T, e, t)
							})
						]
					}),
					/* @__PURE__ */ g("div", {
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
							let t = I === e.key;
							return /* @__PURE__ */ g("button", {
								onClick: () => ee(e.key),
								title: v(e.label),
								"aria-label": v(e.label),
								"aria-pressed": t,
								className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
								style: {
									background: t ? h.accent : h.surface,
									color: t ? "#fff" : h.textDim,
									border: `1px solid ${t ? h.accent : h.border}`
								},
								children: /* @__PURE__ */ g(An, {
									scheme: e.key,
									size: 20
								})
							}, e.key);
						})
					})
				]
			}),
			/* @__PURE__ */ g("div", {
				className: "flex gap-1 mt-2.5",
				children: ce.map((e, t) => {
					let n = gn(...Q(e[0], e[1], e[2]));
					return /* @__PURE__ */ g("button", {
						onClick: () => R(e[0], e[1], e[2]),
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
			/* @__PURE__ */ _("div", {
				className: "flex items-center gap-2 mt-2",
				children: [
					/* @__PURE__ */ g("div", { style: {
						width: 28,
						height: 24,
						background: J,
						border: `1px solid ${h.border}`,
						borderRadius: 2,
						flexShrink: 0
					} }),
					/* @__PURE__ */ g("span", {
						className: "text-[10px]",
						style: { color: h.textDim },
						children: "#"
					}),
					/* @__PURE__ */ g("input", {
						value: J.replace("#", "").toUpperCase(),
						onChange: (e) => {
							let t = e.target.value.trim().replace(/^#/, "");
							if (/^[0-9a-fA-F]{3}$/.test(t) && (t = t.split("").map((e) => e + e).join("")), /^[0-9a-fA-F]{6}$/.test(t)) {
								let [e, n, r] = hn("#" + t);
								z(e, n, r);
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
			/* @__PURE__ */ g("div", {
				className: "flex mt-2.5 mb-1.5",
				style: { borderBottom: `1px solid ${h.border}` },
				children: [
					"RGB",
					"HSV",
					"HSL",
					"CMYK",
					"GRAY"
				].map((e) => /* @__PURE__ */ g("button", {
					onClick: () => N(e),
					className: "px-1.5 py-0.5 text-[10px] font-medium",
					style: {
						color: M === e ? h.accent : h.textDim,
						borderBottom: M === e ? `2px solid ${h.accent}` : "2px solid transparent"
					},
					children: e
				}, e))
			}),
			/* @__PURE__ */ g("div", {
				className: "space-y-1.5",
				children: le.map((e) => /* @__PURE__ */ g(Mn, {
					label: e.l,
					value: e.val,
					max: e.max,
					track: e.track,
					onInput: e.set,
					C: h
				}, e.l))
			}),
			/* @__PURE__ */ g("div", {
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
				].map((e) => /* @__PURE__ */ g("button", {
					onClick: () => {
						let [t, n, r] = hn(e);
						z(t, n, r);
					},
					title: e,
					style: {
						width: 16,
						height: 16,
						background: e,
						borderRadius: 2,
						border: `1px solid ${e.toLowerCase() === J.toLowerCase() ? h.accent : h.border}`
					}
				}, e))
			}),
			a.length > 0 && /* @__PURE__ */ _("div", {
				className: "mt-3 pt-2",
				style: { borderTop: `1px solid ${h.border}` },
				children: [/* @__PURE__ */ g("div", {
					className: "text-[10px] uppercase tracking-wide mb-1.5",
					style: { color: h.textDim },
					children: v("layer_color_recent")
				}), /* @__PURE__ */ g("div", {
					className: "grid gap-1",
					style: { gridTemplateColumns: "repeat(10, 1fr)" },
					children: a.slice(0, 30).map((e, t) => /* @__PURE__ */ g("button", {
						title: e,
						onClick: () => {
							let [t, n, r] = hn(e);
							z(t, n, r), o?.(e);
						},
						className: "aspect-square transition-transform hover:scale-110",
						style: {
							background: e,
							borderRadius: 3,
							border: `1px solid ${e.toLowerCase() === J.toLowerCase() ? h.accent : h.border}`,
							boxShadow: e.toLowerCase() === J.toLowerCase() ? `0 0 0 1px ${h.accent}` : "none"
						}
					}, e + t))
				})]
			}),
			(c || l) && /* @__PURE__ */ _("div", {
				className: "flex items-center justify-end gap-2 mt-3 pt-2.5",
				style: { borderTop: `1px solid ${h.border}` },
				children: [l && /* @__PURE__ */ g("button", {
					onClick: l,
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: h.text,
						background: "transparent",
						border: `1px solid ${h.border}`
					},
					children: d ?? v("layer_color_cancel")
				}), c && /* @__PURE__ */ g("button", {
					onClick: () => c(J),
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: "#fff",
						background: h.accent,
						border: `1px solid ${h.accent}`
					},
					children: u ?? v("layer_color_confirm")
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/ColorField.tsx
function Pn({ t: e, C: t, color: n, onChange: r, history: i, onPickHistory: a, className: o, style: c, width: l = 32, height: d = 24, leftTools: m }) {
	let v = En(), y = t ?? v, [b, x] = p(!1), S = f(null), C = f(null), [w, T] = p(null), E = () => {
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
	return u(() => {
		if (!b) {
			T(null);
			return;
		}
		E();
	}, [b]), s(() => {
		if (!b) return;
		let e = () => E();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [b]), /* @__PURE__ */ _(h, { children: [/* @__PURE__ */ g("button", {
		ref: S,
		type: "button",
		onClick: () => x((e) => !e),
		className: o,
		style: {
			width: l,
			height: d,
			background: n,
			border: `1px solid ${b ? y.accent : y.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...c
		}
	}), b && W(/* @__PURE__ */ _(h, { children: [/* @__PURE__ */ g("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => x(!1)
	}), /* @__PURE__ */ g("div", {
		ref: C,
		className: "fixed",
		style: {
			left: w?.left ?? 0,
			top: w?.top ?? 0,
			zIndex: 200,
			visibility: w ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ g(Nn, {
			t: e,
			C: y,
			color: n,
			onChange: r,
			onClose: () => x(!1),
			history: i,
			onPickHistory: a,
			leftTools: m
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/ColorSwatchPicker.tsx
var Fn = "kubuno:picker:custom-swatches";
function In() {
	if (typeof localStorage > "u") return [];
	try {
		let e = JSON.parse(localStorage.getItem(Fn) || "[]");
		return Array.isArray(e) ? e.slice(0, 20) : [];
	} catch {
		return [];
	}
}
var Ln = /* @__PURE__ */ "#000000.#434343.#666666.#999999.#b7b7b7.#cccccc.#d9d9d9.#efefef.#f3f3f3.#ffffff.#980000.#ff0000.#ff9900.#ffff00.#00ff00.#00ffff.#4a86e8.#0000ff.#9900ff.#ff00ff.#e6b8af.#f4cccc.#fce5cd.#fff2cc.#d9ead3.#d0e0e3.#c9daf8.#cfe2f3.#d9d2e9.#ead1dc.#dd7e6b.#ea9999.#f9cb9c.#ffe599.#b6d7a8.#a2c4c9.#a4c2f4.#9fc5e8.#b4a7d6.#d5a6bd.#cc4125.#e06666.#f6b26b.#ffd966.#93c47d.#76a5af.#6d9eeb.#6fa8dc.#8e7cc3.#c27ba0.#a61c00.#cc0000.#e69138.#f1c232.#6aa84f.#45818e.#3c78d8.#3d85c6.#674ea7.#a64d79.#85200c.#990000.#b45f06.#bf9000.#38761d.#134f5c.#1155cc.#0b5394.#351c75.#741b47.#5b0f00.#660000.#783f04.#7f6000.#274e13.#0c343d.#1c4587.#073763.#20124d.#4c1130".split(".");
function Rn({ color: e, onChange: t, onClose: n, t: r, theme: i, customLabel: a = "Personnalisé", confirmLabel: o, cancelLabel: s }) {
	let c = En(), l = i ?? c, [u, d] = p(!1), [f, m] = p(e), [h, v] = p(In), y = (e) => v((t) => {
		let n = [e, ...t.filter((t) => t.toLowerCase() !== e.toLowerCase())].slice(0, 20);
		try {
			localStorage.setItem(Fn, JSON.stringify(n));
		} catch {}
		return n;
	}), b = o ?? (r ? r("color_add", { defaultValue: "Ajouter" }) : "Ajouter"), x = s ?? (r ? r("color_cancel", { defaultValue: "Annuler" }) : "Annuler");
	if (u) return /* @__PURE__ */ g(Nn, {
		t: r,
		C: l,
		color: f,
		onChange: m,
		onClose: () => d(!1),
		confirmLabel: b,
		cancelLabel: x,
		onConfirm: (e) => {
			y(e), t(e), d(!1);
		},
		onCancel: () => d(!1)
	});
	let S = () => {
		m(e), d(!0);
	}, C = async () => {
		let e = window.EyeDropper;
		if (e) try {
			let r = await new e().open();
			y(r.sRGBHex), t(r.sRGBHex), n?.();
		} catch {}
	}, w = e.toLowerCase();
	return /* @__PURE__ */ _("div", {
		className: "p-3 rounded-lg shadow-lg border",
		style: {
			width: 232,
			background: l.toolbar,
			borderColor: l.border
		},
		children: [
			/* @__PURE__ */ g("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: Ln.map((e) => {
					let r = e.toLowerCase() === w;
					return /* @__PURE__ */ g("button", {
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
			/* @__PURE__ */ g("div", {
				className: "mt-3 mb-1 text-[11px] font-semibold uppercase tracking-wide",
				style: { color: l.title },
				children: a
			}),
			/* @__PURE__ */ _("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: [
					h.map((e) => /* @__PURE__ */ g("button", {
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
					/* @__PURE__ */ g("button", {
						onClick: S,
						title: a,
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: l.border,
							color: l.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = l.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ g(R, { size: 12 })
					}),
					typeof window < "u" && "EyeDropper" in window && /* @__PURE__ */ g("button", {
						onClick: C,
						title: "Pipette",
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: l.border,
							color: l.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = l.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ g(L, { size: 11 })
					})
				]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/gradient.ts
function zn(e, t = 100) {
	let [n, r, i] = hn(e);
	return `rgba(${n}, ${r}, ${i}, ${Math.max(0, Math.min(100, t)) / 100})`;
}
function Bn(e) {
	let t = [...e.stops].sort((e, t) => e.position - t.position).map((e) => `${zn(e.color, e.opacity ?? 100)} ${Math.round(e.position * 100)}%`).join(", ");
	return e.type === "radial" ? `radial-gradient(circle, ${t})` : `linear-gradient(${Math.round(e.angle)}deg, ${t})`;
}
var Vn = {
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
}, Hn = {
	gradient_linear: "Linéaire",
	gradient_radial: "Radial",
	gradient_angle: "Angle",
	gradient_position: "Position",
	gradient_opacity: "Opacité",
	gradient_add_stop: "Ajouter un arrêt"
};
function Un(e, t) {
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
	let i = n[r], a = n[r + 1], o = (t - i.position) / (a.position - i.position || 1), [s, c, l] = hn(i.color), [u, d, f] = hn(a.color);
	return {
		color: gn(s + (u - s) * o, c + (d - c) * o, l + (f - l) * o),
		position: t,
		opacity: Math.round(i.opacity + (a.opacity - i.opacity) * o)
	};
}
function Wn({ t: e, value: t, onChange: n, onClose: r, C: i }) {
	let a = En(), o = i ?? a, c = (t) => e ? e(t) : Hn[t] ?? t, l = t ?? Vn, [u, d] = p(0), m = f(null), h = f(null), v = [...l.stops].map((e, t) => ({
		s: e,
		i: t
	})).sort((e, t) => e.s.position - t.s.position), y = l.stops[Math.min(u, l.stops.length - 1)] ?? l.stops[0], b = (e) => n({
		...l,
		...e
	}), x = (e, t) => b({ stops: l.stops.map((n, r) => r === e ? {
		...n,
		...t
	} : n) }), S = (e) => {
		let t = m.current;
		if (!t) return 0;
		let n = t.getBoundingClientRect();
		return Math.max(0, Math.min(1, (e - n.left) / n.width));
	};
	s(() => {
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
		let t = Un(l.stops, e), r = [...l.stops, t];
		n({
			...l,
			stops: r
		}), d(r.length - 1);
	}, w = (e) => {
		l.stops.length <= 2 || (b({ stops: l.stops.filter((t, n) => n !== e) }), d(0));
	}, T = Bn(l);
	return /* @__PURE__ */ _("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 260,
			background: o.toolbar,
			border: `1px solid ${o.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ _("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ g("div", {
					className: "flex gap-1",
					children: ["linear", "radial"].map((e) => /* @__PURE__ */ g("button", {
						onClick: () => b({ type: e }),
						className: "px-2 py-0.5 text-[10px] font-medium",
						style: {
							borderRadius: 3,
							background: l.type === e ? o.accent : o.surface ?? "#2c2c2c",
							color: l.type === e ? "#fff" : o.textDim,
							border: `1px solid ${o.border}`
						},
						children: c(e === "linear" ? "gradient_linear" : "gradient_radial")
					}, e))
				}), r && /* @__PURE__ */ g("button", {
					onClick: r,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: o.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ _("div", {
				className: "relative mb-3",
				style: { height: 22 },
				children: [/* @__PURE__ */ g("div", {
					ref: m,
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
				}), v.map(({ s: e, i: t }) => /* @__PURE__ */ g("div", {
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
			l.type === "linear" && /* @__PURE__ */ _("label", {
				className: "flex items-center gap-2 mb-2",
				children: [
					/* @__PURE__ */ g("span", {
						className: "text-[10px] uppercase flex-shrink-0",
						style: {
							color: o.textDim,
							width: 48
						},
						children: c("gradient_angle")
					}),
					/* @__PURE__ */ g(dt, {
						min: 0,
						max: 360,
						className: "flex-1",
						value: l.angle,
						onChange: (e) => b({ angle: e }),
						accent: o.accent,
						trackColor: o.border,
						"aria-label": c("gradient_angle")
					}),
					/* @__PURE__ */ g("input", {
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
			y && /* @__PURE__ */ _("div", {
				className: "flex flex-col gap-2 pt-2",
				style: { borderTop: `1px solid ${o.border}` },
				children: [/* @__PURE__ */ _("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ g(Pn, {
							t: e,
							C: o,
							width: 32,
							height: 24,
							className: "flex-shrink-0",
							color: y.color,
							onChange: (e) => x(l.stops.indexOf(y), { color: e })
						}),
						/* @__PURE__ */ _("label", {
							className: "flex items-center gap-1 flex-1",
							children: [/* @__PURE__ */ g("span", {
								className: "text-[10px] uppercase",
								style: { color: o.textDim },
								children: c("gradient_position")
							}), /* @__PURE__ */ g("input", {
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
						l.stops.length > 2 && /* @__PURE__ */ g("button", {
							onClick: () => w(l.stops.indexOf(y)),
							title: "",
							style: { color: o.textDim },
							children: /* @__PURE__ */ g(V, { size: 13 })
						})
					]
				}), /* @__PURE__ */ _("label", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ g("span", {
							className: "text-[10px] uppercase flex-shrink-0",
							style: {
								color: o.textDim,
								width: 48
							},
							children: c("gradient_opacity")
						}),
						/* @__PURE__ */ g(dt, {
							min: 0,
							max: 100,
							className: "flex-1",
							value: y.opacity,
							onChange: (e) => x(l.stops.indexOf(y), { opacity: e }),
							accent: o.accent,
							trackColor: o.border,
							"aria-label": c("gradient_opacity")
						}),
						/* @__PURE__ */ g("input", {
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
			/* @__PURE__ */ _("button", {
				onClick: () => C(),
				className: "flex items-center gap-1 px-1.5 py-1 mt-2 text-[10px] rounded",
				style: {
					background: o.surface,
					color: o.textDim
				},
				children: [
					/* @__PURE__ */ g(R, { size: 11 }),
					" ",
					c("gradient_add_stop")
				]
			})
		]
	});
}
function Gn({ t: e, C: t, value: n, onChange: r, className: i, style: a, width: o = 32, height: c = 24 }) {
	let l = t ?? En(), [d, m] = p(!1), v = f(null), y = f(null), [b, x] = p(null), S = () => {
		let e = v.current, t = y.current;
		if (!e || !t) return;
		let n = e.getBoundingClientRect(), r = t.offsetWidth || 264, i = t.offsetHeight || 360, a = window.innerWidth, o = window.innerHeight, s = n.left - r - 8;
		s < 8 && (s = n.right + 8), s + r > a - 8 && (s = a - r - 8), s < 8 && (s = 8);
		let c = n.top;
		c + i > o - 8 && (c = o - i - 8), c < 8 && (c = 8), x({
			left: s,
			top: c
		});
	};
	return u(() => {
		if (!d) {
			x(null);
			return;
		}
		S();
	}, [d]), s(() => {
		if (!d) return;
		let e = () => S();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [d]), /* @__PURE__ */ _(h, { children: [/* @__PURE__ */ g("button", {
		ref: v,
		type: "button",
		onClick: () => m((e) => !e),
		className: i,
		style: {
			width: o,
			height: c,
			backgroundImage: Bn(n),
			backgroundColor: "#fff",
			border: `1px solid ${d ? l.accent : l.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...a
		}
	}), d && W(/* @__PURE__ */ _(h, { children: [/* @__PURE__ */ g("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => m(!1)
	}), /* @__PURE__ */ g("div", {
		ref: y,
		className: "fixed",
		style: {
			left: b?.left ?? 0,
			top: b?.top ?? 0,
			zIndex: 200,
			visibility: b ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ g(Wn, {
			t: e,
			C: l,
			value: n,
			onChange: r,
			onClose: () => m(!1)
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/AnchoredPopover.tsx
function Kn({ anchorRef: e, open: t, onClose: n, children: r, gap: i = 4, align: a = "left" }) {
	let o = f(null), [c, l] = p(null), { host: d, scoped: m } = Ae(), v = m ? "absolute" : "fixed", y = () => {
		let t = e.current, n = o.current;
		if (!t || !n) return;
		let r = t.getBoundingClientRect(), s = n.offsetWidth || 232, c = n.offsetHeight || 300, u = m && d ? d.getBoundingClientRect() : null, f = u ? u.left : 0, p = u ? u.top : 0, h = u ? u.width : window.innerWidth, g = u ? u.height : window.innerHeight, _ = r.bottom - p + i;
		_ + c > g - 8 && (_ = r.top - p - c - i), _ < 8 && (_ = 8);
		let v = a === "right" ? r.right - f - s : r.left - f;
		v + s > h - 8 && (v = h - s - 8), v < 8 && (v = 8), l({
			left: v,
			top: _
		});
	};
	return u(() => {
		if (!t) {
			l(null);
			return;
		}
		y();
	}, [t]), s(() => {
		if (!t) return;
		let e = () => y();
		return window.addEventListener("resize", e), window.addEventListener("scroll", e, !0), () => {
			window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0);
		};
	}, [t]), t ? W(/* @__PURE__ */ _(h, { children: [/* @__PURE__ */ g("div", {
		className: `${v} inset-0`,
		style: { zIndex: 199 },
		onMouseDown: n
	}), /* @__PURE__ */ g("div", {
		ref: o,
		className: v,
		style: {
			left: c?.left ?? 0,
			top: c?.top ?? 0,
			zIndex: 200,
			visibility: c ? "visible" : "hidden"
		},
		children: r
	})] }), d ?? document.body) : null;
}
//#endregion
//#region ../../src/ui/windowZStore.ts
var qn = 1e3, Jn = he((e, t) => ({
	counter: qn,
	next: () => {
		let n = t().counter + 1;
		return e({ counter: n }), n;
	}
}));
//#endregion
//#region ../../src/ui/interaction.ts
function Yn() {
	return typeof window < "u" && typeof window.matchMedia == "function" && (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches);
}
var Xn = 1023;
function Zn() {
	let e = `(max-width: ${Xn}px)`, [t, n] = p(() => typeof window < "u" && typeof window.matchMedia == "function" ? window.matchMedia(e).matches : !1);
	return s(() => {
		if (typeof window > "u" || typeof window.matchMedia != "function") return;
		let t = window.matchMedia(e), r = (e) => n(e.matches);
		return n(t.matches), t.addEventListener("change", r), () => t.removeEventListener("change", r);
	}, [e]), t;
}
function Qn() {
	let e = "(orientation: landscape)", [t, n] = p(() => typeof window < "u" && typeof window.matchMedia == "function" ? window.matchMedia(e).matches : !0);
	return s(() => {
		if (typeof window > "u" || typeof window.matchMedia != "function") return;
		let t = window.matchMedia(e), r = (e) => n(e.matches);
		return n(t.matches), t.addEventListener("change", r), () => t.removeEventListener("change", r);
	}, []), t;
}
function $n(e) {
	return {
		onClick: (t) => {
			Yn() ? e.open(t) : e.select?.(t);
		},
		onDoubleClick: (t) => {
			Yn() || e.open(t);
		}
	};
}
function er(e, t = {}) {
	let { ms: n = 500, moveTolerance: r = 12 } = t, i = f(null), o = f(null), s = a(() => {
		i.current &&= (clearTimeout(i.current), null), o.current = null;
	}, []);
	return {
		onTouchStart: a((t) => {
			if (t.touches.length !== 1) {
				s();
				return;
			}
			let r = t.touches[0];
			o.current = {
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
		onTouchMove: a((e) => {
			if (!o.current) return;
			let t = e.touches[0];
			(Math.abs(t.clientX - o.current.x) > r || Math.abs(t.clientY - o.current.y) > r) && s();
		}, [s, r]),
		onTouchEnd: s,
		onTouchCancel: s
	};
}
function tr({ title: e, icon: t, children: n, titleActions: r, popout: i, onClose: o, defaultWidth: c = 560, defaultHeight: l, minWidth: u = 280, minHeight: d = 120, resizable: m = !1, backdrop: v = !1, className: y = "", padding: b }) {
	let x = f(null), [S, C] = p(() => Jn.getState().next()), [w, T] = p(0), { host: E, scoped: D } = Ae(), O = D ? "absolute" : "fixed", k = f(!1), A = f({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0
	}), j = f(!1), M = f(!1), N = f(""), P = f({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0,
		ww: 0,
		wh: 0
	}), F = a(() => {
		C(Jn.getState().next());
	}, []), I = a(() => {
		let e = x.current;
		if (!e || j.current) return;
		let t = e.getBoundingClientRect();
		e.style.transform = "none", e.style.left = `${t.left}px`, e.style.top = `${t.top}px`, j.current = !0;
	}, []), ee = a((e) => {
		if (D || e.target.closest("button,a,input,select,textarea")) return;
		let t = x.current;
		if (!t) return;
		F(), I();
		let n = t.getBoundingClientRect();
		k.current = !0, A.current = {
			mx: e.clientX,
			my: e.clientY,
			wx: n.left,
			wy: n.top
		}, e.preventDefault();
	}, [
		F,
		I,
		D
	]), L = a((e) => {
		if (D) return;
		let t = x.current;
		if (!t) return;
		F(), I();
		let n = t.getBoundingClientRect();
		M.current = !0, N.current = e.currentTarget.dataset.edge ?? "", P.current = {
			mx: e.clientX,
			my: e.clientY,
			wx: n.left,
			wy: n.top,
			ww: n.width,
			wh: n.height
		}, e.preventDefault(), e.stopPropagation();
	}, [
		F,
		I,
		D
	]);
	s(() => {
		let e = (e) => {
			let t = x.current;
			if (t) {
				if (k.current) {
					let { mx: n, my: r, wx: i, wy: a } = A.current, o = i + e.clientX - n, s = a + e.clientY - r, c = window.innerWidth - 100, l = window.innerHeight - 40;
					t.style.left = `${Math.max(-t.offsetWidth + 100, Math.min(c, o))}px`, t.style.top = `${Math.max(0, Math.min(l, s))}px`;
					return;
				}
				if (M.current) {
					let { mx: n, my: r, wx: i, wy: a, ww: o, wh: s } = P.current, c = e.clientX - n, l = e.clientY - r, f = N.current, p = o, m = s, h = i, g = a;
					f.includes("e") && (p = Math.max(u, o + c)), f.includes("s") && (m = Math.max(d, s + l)), f.includes("w") && (p = Math.max(u, o - c), h = i + (o - p)), f.includes("n") && (m = Math.max(d, s - l), g = a + (s - m)), t.style.width = `${p}px`, t.style.height = `${m}px`, t.style.left = `${h}px`, t.style.top = `${g}px`;
				}
			}
		}, t = () => {
			k.current = !1, M.current = !1;
		};
		return window.addEventListener("mousemove", e), window.addEventListener("mouseup", t), () => {
			window.removeEventListener("mousemove", e), window.removeEventListener("mouseup", t);
		};
	}, [u, d]), s(() => {
		let e = (e) => {
			if (e.key === "Escape") {
				if (i && !D && window.location.pathname + window.location.search === i.route) try {
					window.close();
				} catch {}
				o();
			}
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [
		o,
		i,
		D
	]), s(() => {
		let e = x.current;
		if (!e || D || l !== void 0) return;
		let t = 0, n = () => {
			if (!e.querySelector("[role=\"tablist\"],[data-fw-tabs]")) return;
			let n = window.innerHeight - 16, r = Math.min(e.offsetHeight, n);
			r > t + .5 && (t = r, T(r));
		};
		n();
		let r = new ResizeObserver(n);
		return r.observe(e), () => r.disconnect();
	}, [D, l]);
	let R = !!(i && i.auto !== !1 && typeof window < "u" && window.kubunoDesktop && window.location.pathname + window.location.search !== i.route), z = f(!1);
	if (s(() => {
		if (R && !z.current && i) {
			z.current = !0;
			let t = i.label ?? (typeof e == "string" ? e : void 0), n = i.width || i.height ? {
				width: i.width,
				height: i.height
			} : void 0;
			window.kubunoDesktop?.openWindow(i.route, t, n), o();
		}
	}, [R]), R) return null;
	let B = !!(i && typeof window < "u" && !D && window.location.pathname + window.location.search === i.route), V = Zn(), H = B || V && !D, U = () => {
		if (B && typeof window < "u") try {
			window.close();
		} catch {}
		o();
	}, G = m ? /* @__PURE__ */ _(h, { children: [
		/* @__PURE__ */ g("div", {
			"data-edge": "n",
			onMouseDown: L,
			className: "absolute top-0    left-2  right-2  h-1   cursor-n-resize  z-10"
		}),
		/* @__PURE__ */ g("div", {
			"data-edge": "s",
			onMouseDown: L,
			className: "absolute bottom-0 left-2  right-2  h-1   cursor-s-resize  z-10"
		}),
		/* @__PURE__ */ g("div", {
			"data-edge": "w",
			onMouseDown: L,
			className: "absolute top-2   left-0  bottom-2  w-1   cursor-w-resize  z-10"
		}),
		/* @__PURE__ */ g("div", {
			"data-edge": "e",
			onMouseDown: L,
			className: "absolute top-2   right-0 bottom-2  w-1   cursor-e-resize  z-10"
		}),
		/* @__PURE__ */ g("div", {
			"data-edge": "nw",
			onMouseDown: L,
			className: "absolute top-0    left-0  w-3 h-3  cursor-nw-resize z-20"
		}),
		/* @__PURE__ */ g("div", {
			"data-edge": "ne",
			onMouseDown: L,
			className: "absolute top-0    right-0 w-3 h-3  cursor-ne-resize z-20"
		}),
		/* @__PURE__ */ g("div", {
			"data-edge": "sw",
			onMouseDown: L,
			className: "absolute bottom-0 left-0  w-3 h-3  cursor-sw-resize z-20"
		}),
		/* @__PURE__ */ g("div", {
			"data-edge": "se",
			onMouseDown: L,
			className: "absolute bottom-0 right-0 w-3 h-3  cursor-se-resize z-20"
		})
	] }) : null;
	return W(/* @__PURE__ */ _(h, { children: [v && !B && /* @__PURE__ */ g("div", {
		className: `${O} inset-0 ${D ? "bg-black/15" : "bg-black/30"} backdrop-blur-[1px] no-print`,
		style: { zIndex: S - 1 },
		onClick: o
	}), /* @__PURE__ */ _("div", {
		ref: x,
		role: "dialog",
		"aria-modal": v && !B,
		className: `${O} bg-white flex flex-col overflow-hidden no-print ${y} ${H ? "inset-0" : "rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)]"}`,
		style: H ? {
			width: "100vw",
			height: "100dvh",
			left: 0,
			top: 0,
			zIndex: S
		} : {
			width: c,
			height: l,
			minWidth: D ? `min(${u}px, calc(100% - 16px))` : `min(${u}px, calc(100vw - 16px))`,
			minHeight: w ? `${w}px` : D ? `min(${d}px, calc(100% - 16px))` : `min(${d}px, calc(100vh - 16px))`,
			maxWidth: D ? "calc(100% - 16px)" : "calc(100vw - 16px)",
			maxHeight: D ? "calc(100% - 16px)" : "calc(100vh - 16px)",
			zIndex: S,
			left: "50%",
			top: "33%",
			transform: "translate(-50%, -33%)"
		},
		onMouseDown: H ? void 0 : F,
		children: [
			!H && G,
			/* @__PURE__ */ _("div", {
				className: `flex items-center gap-2.5 px-4 py-3 border-b border-border
                     flex-shrink-0 select-none ${H ? "" : "cursor-move"}`,
				onMouseDown: H ? void 0 : ee,
				children: [
					t && /* @__PURE__ */ g("div", {
						className: "flex-shrink-0 text-text-secondary",
						children: t
					}),
					/* @__PURE__ */ g("div", {
						className: "flex-1 min-w-0 text-sm font-medium text-text-primary truncate",
						children: e
					}),
					r && /* @__PURE__ */ g("div", {
						className: "flex items-center gap-1 flex-shrink-0",
						onMouseDown: (e) => e.stopPropagation(),
						children: r
					}),
					i && typeof window < "u" && window.kubunoDesktop && window.location.pathname + window.location.search !== i.route && /* @__PURE__ */ g("button", {
						onClick: () => {
							let t = i.label ?? (typeof e == "string" ? e : void 0), n = i.width || i.height ? {
								width: i.width,
								height: i.height
							} : void 0;
							window.kubunoDesktop?.openWindow(i.route, t, n), o();
						},
						onMouseDown: (e) => e.stopPropagation(),
						title: "Détacher dans une fenêtre",
						className: "flex-shrink-0 p-1.5 rounded-lg text-text-tertiary\n                         hover:text-text-primary hover:bg-surface-2 transition-colors",
						children: /* @__PURE__ */ g(te, { size: 14 })
					}),
					/* @__PURE__ */ g("button", {
						onClick: U,
						onMouseDown: (e) => e.stopPropagation(),
						title: "Fermer (Échap)",
						className: "flex-shrink-0 p-1.5 -mr-1 rounded-lg text-text-tertiary\n                       hover:text-text-primary hover:bg-surface-2 transition-colors",
						children: /* @__PURE__ */ g(ne, { size: 15 })
					})
				]
			}),
			/* @__PURE__ */ g("div", {
				className: "flex-1 flex flex-col min-h-0 overflow-hidden",
				style: { padding: b ?? 20 },
				children: n
			})
		]
	})] }), E ?? document.body);
}
//#endregion
//#region ../../src/ui/ConfirmDialog.tsx
function nr({ title: e, message: t, confirmLabel: n = "Confirmer", cancelLabel: r = "Annuler", variant: i = "default", hideCancel: a = !1, onConfirm: o, onCancel: c }) {
	let l = f(null);
	s(() => {
		l.current?.focus();
	}, []), s(() => {
		let e = (e) => {
			e.key === "Enter" && o();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [o]);
	let u = i === "danger" ? "bg-red-100" : i === "warning" ? "bg-amber-100" : "bg-gray-100", d = i === "danger" ? "text-red-600" : i === "warning" ? "text-amber-600" : "text-gray-600", p = i === "danger" ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white" : i === "warning" ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white";
	return /* @__PURE__ */ g(tr, {
		title: e,
		onClose: c,
		defaultWidth: 380,
		backdrop: !0,
		children: /* @__PURE__ */ _("div", {
			className: "p-6 flex flex-col gap-4",
			children: [
				/* @__PURE__ */ g("div", {
					className: `w-12 h-12 rounded-full ${u} flex items-center justify-center flex-shrink-0`,
					children: g(i === "danger" ? V : b, { className: `w-6 h-6 ${d}` })
				}),
				/* @__PURE__ */ g("p", {
					className: "text-sm text-gray-500 leading-relaxed whitespace-pre-line",
					children: t
				}),
				/* @__PURE__ */ _("div", {
					className: "flex gap-3 mt-1",
					children: [!a && /* @__PURE__ */ g("button", {
						type: "button",
						onClick: c,
						className: "flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300\n                       rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors whitespace-nowrap",
						children: r
					}), /* @__PURE__ */ g("button", {
						ref: l,
						type: "button",
						onClick: o,
						className: `flex-1 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none
                        focus:ring-2 focus:ring-offset-1 transition-colors whitespace-nowrap ${p}`,
						children: n
					})]
				})
			]
		})
	});
}
//#endregion
//#region ../../src/ui/ConflictDialog.tsx
function rr({ type: e, name: t, onChoice: n }) {
	let r = e === "folder";
	return /* @__PURE__ */ g(tr, {
		title: "Conflit de nom",
		onClose: () => n("cancel"),
		defaultWidth: 400,
		backdrop: !0,
		children: /* @__PURE__ */ _("div", {
			className: "p-6 flex flex-col gap-5",
			children: [
				/* @__PURE__ */ _("p", {
					className: "text-sm text-text-secondary leading-relaxed",
					children: [
						"Un ",
						r ? "dossier" : "fichier",
						" nommé",
						" ",
						/* @__PURE__ */ _("span", {
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
				/* @__PURE__ */ _("button", {
					type: "button",
					onClick: () => n("overwrite"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ g("div", {
						className: "w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ g(P, {
							size: 15,
							className: "text-danger"
						})
					}), /* @__PURE__ */ _("div", { children: [/* @__PURE__ */ g("p", {
						className: "text-sm font-medium text-text-primary",
						children: r ? "Fusionner" : "Écraser"
					}), /* @__PURE__ */ g("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: r ? "Les deux dossiers seront fusionnés. Les fichiers en conflit seront remplacés." : "Le fichier existant sera remplacé par le nouveau."
					})] })]
				}),
				/* @__PURE__ */ _("button", {
					type: "button",
					onClick: () => n("keep_both"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ g("div", {
						className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ g(A, {
							size: 15,
							className: "text-primary"
						})
					}), /* @__PURE__ */ _("div", { children: [/* @__PURE__ */ g("p", {
						className: "text-sm font-medium text-text-primary",
						children: "Conserver les deux"
					}), /* @__PURE__ */ _("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: [
							"Le nouvel élément sera renommé automatiquement (ex.\xA0: «\xA0",
							t,
							" (2)\xA0»)."
						]
					})] })]
				}),
				/* @__PURE__ */ g("button", {
					type: "button",
					onClick: () => n("cancel"),
					className: "self-end text-sm text-text-secondary hover:text-text-primary transition-colors px-2 py-1",
					children: "Annuler"
				})
			]
		})
	});
}
var ir = 8;
function ar(e, t, n, r = {
	width: window.innerWidth,
	height: window.innerHeight
}) {
	let i = t + 14 + n.height + ir <= r.height, a = i ? t + 14 : t - 14 - n.height, o = e;
	return o + n.width + ir > r.width && (o = r.width - n.width - ir), o < ir && (o = ir), {
		left: o,
		top: Math.max(ir, a),
		below: i
	};
}
//#endregion
//#region ../../src/ui/Tooltip.tsx
var or = {
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
function sr({ label: e, children: n, delay: r = 400, disabled: i }) {
	let [o, c] = p(null), l = f(null), d = f(null), m = f({
		x: 0,
		y: 0
	}), v = a(() => {
		d.current &&= (clearTimeout(d.current), null), c(null);
	}, []);
	if (s(() => () => {
		d.current && clearTimeout(d.current);
	}, []), u(() => {
		if (!o || o.ready || !l.current) return;
		let e = l.current.getBoundingClientRect(), t = ar(m.current.x, m.current.y, {
			width: e.width,
			height: e.height
		});
		c({
			left: t.left,
			top: t.top,
			ready: !0
		});
	}, [o]), i || e == null || e === "") return n;
	let y = (e) => {
		m.current = {
			x: e.clientX,
			y: e.clientY
		}, d.current && clearTimeout(d.current), d.current = window.setTimeout(() => {
			let e = ar(m.current.x, m.current.y, {
				width: 0,
				height: 0
			});
			c({
				left: e.left,
				top: e.top,
				ready: !1
			});
		}, r);
	}, b = (e) => {
		m.current = {
			x: e.clientX,
			y: e.clientY
		};
	};
	return /* @__PURE__ */ _(h, { children: [t(n, {
		onMouseEnter: (e) => {
			y(e), n.props.onMouseEnter?.(e);
		},
		onMouseMove: (e) => {
			b(e), n.props.onMouseMove?.(e);
		},
		onMouseLeave: (e) => {
			v(), n.props.onMouseLeave?.(e);
		},
		onMouseDown: (e) => {
			v(), n.props.onMouseDown?.(e);
		}
	}), o && W(/* @__PURE__ */ g("div", {
		ref: l,
		role: "tooltip",
		"data-kb-tooltip": !0,
		style: {
			...or,
			left: o.left,
			top: o.top,
			visibility: o.ready ? "visible" : "hidden"
		},
		children: e
	}), document.body)] });
}
//#endregion
//#region ../../src/ui/useSaveShortcut.ts
var cr = [], lr = !1;
function ur(e) {
	if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== "s") return;
	let t = cr[cr.length - 1];
	t && (e.preventDefault(), e.stopPropagation(), t());
}
function dr(e, t = !0) {
	let n = f(e);
	n.current = e, s(() => {
		if (!t) return;
		let e = () => n.current();
		return cr.push(e), lr ||= (document.addEventListener("keydown", ur, !0), !0), () => {
			let t = cr.lastIndexOf(e);
			t !== -1 && cr.splice(t, 1);
		};
	}, [t]);
}
//#endregion
//#region ../../src/ui/MobileSheet.tsx
function fr({ open: e, onClose: t, title: n, children: r }) {
	return s(() => {
		if (!e) return;
		let n = (e) => {
			e.key === "Escape" && t();
		};
		document.addEventListener("keydown", n);
		let r = document.body.style.overflow;
		return document.body.style.overflow = "hidden", () => {
			document.removeEventListener("keydown", n), document.body.style.overflow = r;
		};
	}, [e, t]), e ? W(/* @__PURE__ */ _("div", {
		className: "fixed inset-0 z-[9997] lg:hidden",
		role: "dialog",
		"aria-modal": "true",
		children: [/* @__PURE__ */ g("div", {
			className: "absolute inset-0 bg-black/40 animate-[kb-sheet-fade_.15s_ease-out]",
			onClick: t
		}), /* @__PURE__ */ _("div", {
			className: "absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white\n                   shadow-[0_-8px_30px_rgba(0,0,0,0.18)] animate-[kb-sheet-up_.2s_ease-out]",
			style: { paddingBottom: "calc(12px + env(safe-area-inset-bottom))" },
			children: [
				/* @__PURE__ */ g("div", {
					className: "flex justify-center pt-2.5 pb-1",
					children: /* @__PURE__ */ g("div", { className: "h-1 w-10 rounded-full bg-border-strong" })
				}),
				n && /* @__PURE__ */ g("div", {
					className: "px-4 pb-2 pt-1 text-sm font-medium text-text-primary truncate",
					children: n
				}),
				/* @__PURE__ */ g("div", {
					className: "py-1",
					children: r
				})
			]
		})]
	}), document.body) : null;
}
function pr({ icon: e, label: t, trailing: n, danger: r, selected: i, onClick: a }) {
	return /* @__PURE__ */ _("button", {
		onClick: a,
		className: `w-full flex items-center gap-3.5 px-4 h-[52px] text-left text-[15px] active:bg-surface-2 transition-colors
                  ${r ? "text-danger" : "text-text-primary"} ${i ? "bg-primary-light" : ""}`,
		children: [
			e && /* @__PURE__ */ g("span", {
				className: `w-5 flex justify-center shrink-0 ${r ? "text-danger" : "text-text-secondary"}`,
				children: e
			}),
			/* @__PURE__ */ g("span", {
				className: "flex-1 min-w-0 truncate",
				children: t
			}),
			n
		]
	});
}
function mr() {
	return /* @__PURE__ */ g("div", { className: "my-1 h-px bg-border" });
}
//#endregion
//#region ../../src/ui/index.ts
var hr = Z("ui.Button", Pe), gr = Z("ui.Badge", Re), _r = Z("ui.Input", ze), vr = Z("ui.NumberInput", Be), yr = Z("ui.Textarea", Ve), br = Z("ui.Editable", He), xr = Z("ui.RichText", Ue), Sr = Z("ui.Checkbox", qe), Cr = Z("ui.Radio", Ze), wr = Z("ui.Toggle", nt), Tr = Z("ui.FloatCheckbox", rt), Er = Z("ui.Separator", it), Dr = Z("ui.Spinner", ot), Or = Z("ui.RangeSlider", dt), kr = Z("ui.Dropdown", _t), Ar = Z("ui.DatePicker", Ot), jr = Z("ui.FontPicker", Kt), Mr = Z("ui.FontSizeField", Yt), Nr = Z("ui.MenuDropdown", Qt), Pr = Z("ui.Tabs", nn), Fr = Z("ui.Accordion", rn), Ir = Z("ui.StartPage", dn), Lr = Z("ui.KubunoLogo", fn), Rr = Z("ui.LabelIcon", mn), zr = Z("ui.ColorPicker", Nn), Br = Z("ui.ColorField", Pn), Vr = Z("ui.ColorSwatchPicker", Rn), Hr = Z("ui.GradientPicker", Wn), Ur = Z("ui.GradientField", Gn), Wr = Z("ui.AnchoredPopover", Kn), Gr = Z("ui.FloatingWindow", tr), Kr = Z("ui.ResizeHandle", an), qr = Z("ui.ConfirmDialog", nr), Jr = Z("ui.ConflictDialog", rr);
//#endregion
export { Fr as Accordion, Wr as AnchoredPopover, gr as Badge, hr as Button, ht as CaretDown, Sr as Checkbox, Br as ColorField, zr as ColorPicker, Vr as ColorSwatchPicker, Se as ComponentRegistry, qr as ConfirmDialog, Jr as ConflictDialog, Vn as DEFAULT_GRADIENT, Sn as DEFAULT_PICKER_THEME, Ar as DatePicker, kr as Dropdown, br as Editable, It as FONT_UI_THEME, Tr as FloatCheckbox, Gr as FloatingWindow, jr as FontPicker, Mr as FontSizeField, Ur as GradientField, Hr as GradientPicker, _r as Input, Lr as KubunoLogo, Cn as LIGHT_PICKER_THEME, Rr as LabelIcon, Xn as MOBILE_MAX_WIDTH, Nr as MenuDropdown, fr as MobileSheet, pr as MobileSheetItem, mr as MobileSheetSeparator, vr as NumberInput, ke as PortalHostContext, Cr as Radio, Or as RangeSlider, Kr as ResizeHandle, xr as RichText, lt as RollingNumber, Er as Separator, Dr as Spinner, st as SpinnerOverlay, Ir as StartPage, or as TOOLTIP_STYLE, Pr as Tabs, yr as Textarea, we as ThemePreviewContext, Ce as ThemeScopeContext, wr as Toggle, sr as Tooltip, Tn as appPickerTheme, $ as cmykToRgb, Ft as dedupeFontFamilies, Bn as gradientToCss, On as harmonyColors, hn as hexToRgb, yn as hslToRgb, Q as hsvToRgb, Yn as isCoarsePointer, $n as openable, Pt as parseFontMeta, xn as rgbToCmyk, gn as rgbToHex, _n as rgbToHsl, bn as rgbToHsv, zn as rgbaFromHex, Z as themed, En as useAppPickerTheme, Qn as useIsLandscape, Zn as useIsMobile, er as useLongPress, en as useMenuDropdown, Ae as usePortalHost, on as useResizableWidth, dr as useSaveShortcut, Te as useThemeVersion, Jn as useWindowZStore };
