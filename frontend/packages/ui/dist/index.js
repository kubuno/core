import e, { createContext as t, createElement as n, forwardRef as r, useCallback as i, useContext as a, useEffect as o, useId as s, useLayoutEffect as c, useMemo as l, useRef as u, useState as d, useSyncExternalStore as f } from "react";
import { Fragment as p, jsx as m, jsxs as h } from "react/jsx-runtime";
import { clsx as g } from "clsx";
import { twMerge as _ } from "tailwind-merge";
import { AlertTriangle as v, Bold as y, Calendar as b, Check as x, ChevronDown as S, ChevronLeft as C, ChevronRight as w, ChevronUp as T, Circle as E, Clock as D, Copy as O, Eraser as k, GripVertical as A, Italic as j, Layers as M, Link2 as N, List as P, ListOrdered as F, Pipette as ee, Plus as I, Search as te, Square as L, SquareArrowOutUpRight as R, Trash2 as z, Triangle as B, Underline as V, X as ne } from "lucide-react";
import { createPortal as H } from "react-dom";
import { addMonths as re, eachDayOfInterval as U, endOfMonth as W, endOfWeek as G, format as K, getMonth as ie, getYear as q, isAfter as ae, isBefore as oe, isSameDay as se, isSameMonth as ce, isToday as le, isValid as ue, parseISO as J, startOfMonth as de, startOfWeek as fe, subMonths as pe } from "date-fns";
import { fr as me } from "date-fns/locale";
import { create as he } from "zustand";
//#region ../../src/ui/themeRegistry.tsx
var ge = /* @__PURE__ */ new Map(), _e = /* @__PURE__ */ new Map(), ve = /* @__PURE__ */ new Map(), ye = 0, be = /* @__PURE__ */ new Set();
function xe() {
	ye += 1;
	for (let e of be) e();
}
var Y = {
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
}, Se = t(void 0), Ce = t(!1);
function we() {
	return f(Y.subscribe, Y.getVersion, Y.getVersion);
}
var Te = Symbol.for("react.forward_ref"), Ee = Symbol.for("react.memo");
function De(e) {
	if (typeof e == "string") return !0;
	let t = e?.$$typeof;
	return t === Te || t === Ee;
}
function X(e, t) {
	let i = r(function(r, i) {
		we();
		let o = a(Ce), s = a(Se), c = (o ? Y.resolvePreview(e) : Y.resolve(e, s)) ?? t;
		return n(c, i != null && De(c) ? {
			...r,
			ref: i
		} : r);
	});
	return i.displayName = `Themed(${e})`, i;
}
//#endregion
//#region ../../src/ui/portalHost.tsx
var Oe = t(null);
function ke() {
	let e = a(Oe);
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
var Ae = [
	"inline-flex items-center justify-center font-medium select-none",
	"transition-colors rounded-md",
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
	"disabled:opacity-50 disabled:cursor-not-allowed"
].join(" "), je = {
	primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
	secondary: "bg-white border border-border text-text-primary hover:bg-surface-1 active:bg-surface-2",
	ghost: "bg-transparent text-text-secondary hover:bg-surface-2 active:bg-surface-3",
	danger: "bg-danger text-white hover:opacity-90 active:opacity-80"
}, Me = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-9 px-4 text-sm gap-2",
	lg: "h-11 px-5 text-sm gap-2"
};
function Ne({ variant: e = "primary", size: t = "md", icon: n, loading: r = !1, className: i, disabled: a, children: o, type: s = "button", ...c }) {
	return /* @__PURE__ */ m("button", {
		type: s,
		className: [
			Ae,
			je[e],
			Me[t],
			i
		].filter(Boolean).join(" "),
		disabled: a || r,
		...c,
		children: r ? /* @__PURE__ */ m("span", { className: "h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" }) : /* @__PURE__ */ h(p, { children: [n, o] })
	});
}
//#endregion
//#region ../../src/ui/Badge.tsx
var Pe = {
	default: "bg-surface-2 text-text-secondary",
	primary: "bg-primary-light text-primary",
	success: "bg-success-light text-success",
	warning: "bg-warning-light text-warning",
	danger: "bg-danger-light text-danger",
	neutral: "bg-surface-3 text-text-primary"
}, Fe = {
	default: "bg-text-tertiary",
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
	danger: "bg-danger",
	neutral: "bg-text-secondary"
}, Ie = {
	sm: "text-[10px] px-1.5 py-0.5",
	md: "text-xs px-2 py-0.5"
};
function Le({ children: e, variant: t = "default", size: n = "md", className: r, dot: i = !1 }) {
	return /* @__PURE__ */ h("span", {
		className: g("inline-flex items-center gap-1 rounded-full font-medium", Pe[t], Ie[n], r),
		children: [i && /* @__PURE__ */ m("span", { className: g("h-1.5 w-1.5 rounded-full flex-shrink-0", Fe[t]) }), e]
	});
}
//#endregion
//#region ../../src/ui/Input.tsx
var Re = e.forwardRef(function({ label: e, error: t, hint: n, leftIcon: r, rightIcon: i, className: a, id: o, ...s }, c) {
	let l = o ?? (typeof e == "string" ? e.toLowerCase().replace(/\s+/g, "-") : void 0);
	return /* @__PURE__ */ h("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ m("label", {
				htmlFor: l,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ h("div", {
				className: "relative flex items-center",
				children: [
					r && /* @__PURE__ */ m("span", {
						className: "absolute left-3 text-text-secondary pointer-events-none",
						children: r
					}),
					/* @__PURE__ */ m("input", {
						ref: c,
						id: l,
						className: _(g("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-9", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r && "pl-9", i && "pr-9", a)),
						...s
					}),
					i && /* @__PURE__ */ m("span", {
						className: "absolute right-3 text-text-secondary pointer-events-none",
						children: i
					})
				]
			}),
			t && /* @__PURE__ */ m("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ m("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
});
//#endregion
//#region ../../src/ui/NumberInput.tsx
function ze({ value: e, onChange: t, min: n, max: r, step: a = 1, disabled: o = !1, label: s, error: c, hint: l, className: u, id: d }) {
	let f = d ?? s?.toLowerCase().replace(/\s+/g, "-"), p = i((e) => n !== void 0 && e < n ? n : r !== void 0 && e > r ? r : e, [n, r]), _ = () => t(p(e + a)), v = () => t(p(e - a)), y = (e) => {
		let n = parseFloat(e.target.value);
		isNaN(n) || t(p(n));
	}, b = n !== void 0 && e <= n, x = r !== void 0 && e >= r;
	return /* @__PURE__ */ h("div", {
		className: "flex flex-col gap-1",
		children: [
			s && /* @__PURE__ */ m("label", {
				htmlFor: f,
				className: "text-sm font-medium text-text-primary",
				children: s
			}),
			/* @__PURE__ */ h("div", {
				className: g("inline-flex items-stretch h-9 rounded-md border bg-white overflow-hidden", "focus-within:ring-2 focus-within:ring-primary focus-within:border-primary", c ? "border-danger focus-within:ring-danger" : "border-border", o && "opacity-50 cursor-not-allowed", u),
				children: [/* @__PURE__ */ m("input", {
					id: f,
					type: "number",
					value: e,
					onChange: y,
					min: n,
					max: r,
					step: a,
					disabled: o,
					className: g("flex-1 min-w-0 px-3 text-sm text-text-primary bg-transparent", "focus:outline-none", "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none")
				}), /* @__PURE__ */ h("div", {
					className: "flex flex-col border-l border-border w-6 flex-shrink-0",
					children: [/* @__PURE__ */ m("button", {
						type: "button",
						tabIndex: -1,
						onClick: _,
						disabled: o || x,
						className: g("flex-1 flex items-center justify-center border-b border-border", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ m(T, {
							size: 11,
							strokeWidth: 2.5
						})
					}), /* @__PURE__ */ m("button", {
						type: "button",
						tabIndex: -1,
						onClick: v,
						disabled: o || b,
						className: g("flex-1 flex items-center justify-center", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ m(S, {
							size: 11,
							strokeWidth: 2.5
						})
					})]
				})]
			}),
			c && /* @__PURE__ */ m("p", {
				className: "text-xs text-danger",
				children: c
			}),
			l && !c && /* @__PURE__ */ m("p", {
				className: "text-xs text-text-secondary",
				children: l
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Textarea.tsx
function Be({ label: e, error: t, hint: n, className: r, id: i, ...a }) {
	let o = i ?? e?.toLowerCase().replace(/\s+/g, "-");
	return /* @__PURE__ */ h("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ m("label", {
				htmlFor: o,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ m("textarea", {
				id: o,
				className: _(g("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-36 min-h-36 resize-y", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r)),
				...a
			}),
			t && /* @__PURE__ */ m("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ m("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
}
//#endregion
//#region ../../src/ui/RichText.tsx
function Ve({ value: e, onChange: t, placeholder: n, className: r, minHeight: i = 96, disabled: a }) {
	let s = u(null), [c, l] = d(!1), [f, p] = d(""), [g, _] = d(!e), v = u(null);
	o(() => {
		s.current && (s.current.innerHTML = e || ""), _(!s.current?.textContent?.trim() && !s.current?.querySelector("img,ul,ol"));
	}, []);
	let b = () => {
		let e = s.current?.innerHTML ?? "", n = !s.current?.textContent?.trim() && !s.current?.querySelector("img,ul,ol,li");
		_(n), t(n ? "" : e);
	}, x = (e, t) => {
		s.current?.focus(), document.execCommand(e, !1, t), b();
	}, S = () => {
		let e = window.getSelection();
		e && e.rangeCount && (v.current = e.getRangeAt(0).cloneRange());
	}, C = () => {
		let e = window.getSelection();
		e && v.current && (e.removeAllRanges(), e.addRange(v.current));
	}, w = () => {
		C();
		let e = f.trim();
		e && x("createLink", /^https?:\/\//i.test(e) ? e : `https://${e}`), l(!1), p("");
	}, T = ({ on: e, title: t, children: n }) => /* @__PURE__ */ m("button", {
		type: "button",
		title: t,
		"aria-label": t,
		onMouseDown: (e) => e.preventDefault(),
		onClick: e,
		className: "w-8 h-8 flex items-center justify-center rounded text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors",
		children: n
	});
	return /* @__PURE__ */ h("div", {
		className: `rounded-md border border-border bg-white overflow-hidden ${r ?? ""}`,
		children: [
			/* @__PURE__ */ h("div", {
				className: "flex items-center gap-0.5 px-1.5 py-1 border-b border-border",
				children: [
					/* @__PURE__ */ m(T, {
						title: "Gras",
						on: () => x("bold"),
						children: /* @__PURE__ */ m(y, { size: 15 })
					}),
					/* @__PURE__ */ m(T, {
						title: "Italique",
						on: () => x("italic"),
						children: /* @__PURE__ */ m(j, { size: 15 })
					}),
					/* @__PURE__ */ m(T, {
						title: "Souligné",
						on: () => x("underline"),
						children: /* @__PURE__ */ m(V, { size: 15 })
					}),
					/* @__PURE__ */ m("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ m(T, {
						title: "Liste numérotée",
						on: () => x("insertOrderedList"),
						children: /* @__PURE__ */ m(F, { size: 15 })
					}),
					/* @__PURE__ */ m(T, {
						title: "Liste à puces",
						on: () => x("insertUnorderedList"),
						children: /* @__PURE__ */ m(P, { size: 15 })
					}),
					/* @__PURE__ */ m("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ m(T, {
						title: "Insérer un lien",
						on: () => {
							S(), l((e) => !e);
						},
						children: /* @__PURE__ */ m(N, { size: 15 })
					}),
					/* @__PURE__ */ m(T, {
						title: "Effacer la mise en forme",
						on: () => x("removeFormat"),
						children: /* @__PURE__ */ m(k, { size: 15 })
					})
				]
			}),
			c && /* @__PURE__ */ h("div", {
				className: "flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-surface-1",
				children: [/* @__PURE__ */ m("input", {
					autoFocus: !0,
					value: f,
					onChange: (e) => p(e.target.value),
					placeholder: "https://…",
					onKeyDown: (e) => {
						e.key === "Enter" && (e.preventDefault(), w()), e.key === "Escape" && l(!1);
					},
					className: "flex-1 text-sm px-2 py-1 rounded border border-border outline-none focus:border-primary"
				}), /* @__PURE__ */ m("button", {
					type: "button",
					onClick: w,
					className: "text-sm font-medium text-primary px-2",
					children: "OK"
				})]
			}),
			/* @__PURE__ */ h("div", {
				className: "relative",
				children: [/* @__PURE__ */ m("div", {
					ref: s,
					contentEditable: !a,
					onInput: b,
					suppressContentEditableWarning: !0,
					className: "px-3 py-2 text-sm text-text-primary outline-none leading-relaxed\n                     [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-5 [&_ol]:ml-5",
					style: { minHeight: i }
				}), g && n && /* @__PURE__ */ m("div", {
					className: "absolute top-2 left-3 text-sm text-text-tertiary pointer-events-none select-none",
					children: n
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Checkbox.tsx
var He = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-sm border-2 cursor-pointer transition-colors checked:bg-[var(--ck)] checked:border-[var(--ck)] before:content-[''] before:w-[11px] before:h-[11px] before:scale-0 before:origin-center before:transition-transform before:duration-100 checked:before:scale-100 before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)] before:shadow-[inset_1em_1em_#fff] disabled:cursor-not-allowed disabled:opacity-50", Ue = {
	default: "border-[#dadce0] hover:border-[#5f6368]",
	dark: "border-[#555] hover:border-[#808080] bg-[#3c3c3c]"
}, We = {
	default: {
		label: "text-sm text-[#202124]",
		desc: "text-xs text-[#5f6368]"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function Ge({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: c }) {
	let l = a ?? (i === "dark" ? "#007acc" : "var(--color-primary)");
	return /* @__PURE__ */ h("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--ck": l
		},
		children: [/* @__PURE__ */ m("input", {
			type: "checkbox",
			checked: e,
			disabled: o,
			onChange: (e) => t(e.target.checked),
			className: g(He, Ue[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ h("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ m("span", {
				className: _("leading-snug", We[i].label, c),
				children: n
			}), r && /* @__PURE__ */ m("span", {
				className: _("leading-snug mt-0.5", We[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/Radio.tsx
var Ke = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-full border-2 cursor-pointer transition-colors checked:border-[var(--rb)] before:content-[''] before:w-[10px] before:h-[10px] before:rounded-full before:bg-[var(--rb)] before:scale-0 before:transition-transform before:duration-100 checked:before:scale-100 disabled:cursor-not-allowed disabled:opacity-50", qe = {
	default: "border-[#dadce0] hover:border-[#5f6368]",
	dark: "border-[#555] hover:border-[#808080]"
}, Je = {
	default: {
		label: "text-sm text-[#202124]",
		desc: "text-xs text-[#5f6368]"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function Ye({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: c }) {
	let l = a ?? (i === "dark" ? "#007acc" : "var(--color-primary)");
	return /* @__PURE__ */ h("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--rb": l
		},
		children: [/* @__PURE__ */ m("input", {
			type: "radio",
			checked: e,
			disabled: o,
			onClick: () => {
				o || t(!e);
			},
			onChange: () => {},
			className: g(Ke, qe[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ h("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ m("span", {
				className: _("leading-snug", Je[i].label, c),
				children: n
			}), r && /* @__PURE__ */ m("span", {
				className: _("leading-snug mt-0.5", Je[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/Toggle.tsx
function Xe({ label: e, description: t, size: n = "md", className: r, id: i, ...a }) {
	let o = i ?? e?.toLowerCase().replace(/\s+/g, "-"), s = n === "sm" ? "h-4 w-7" : "h-5 w-9", c = n === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", l = n === "sm" ? "peer-checked:translate-x-3" : "peer-checked:translate-x-4";
	return /* @__PURE__ */ h("label", {
		htmlFor: o,
		className: g("inline-flex items-start gap-2.5 cursor-pointer select-none", a.disabled && "cursor-not-allowed opacity-50", r),
		children: [/* @__PURE__ */ h("div", {
			className: "relative flex-shrink-0 mt-0.5",
			children: [
				/* @__PURE__ */ m("input", {
					type: "checkbox",
					id: o,
					className: "peer sr-only",
					...a
				}),
				/* @__PURE__ */ m("div", { className: g(s, "rounded-full border border-border bg-surface-3 transition-colors", "peer-checked:bg-primary peer-checked:border-primary", "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1") }),
				/* @__PURE__ */ m("div", { className: g(c, "absolute top-[3px] left-[3px] rounded-full bg-white shadow-sm transition-transform", l) })
			]
		}), (e || t) && /* @__PURE__ */ h("div", {
			className: "flex flex-col gap-0.5",
			children: [e && /* @__PURE__ */ m("span", {
				className: "text-sm text-text-primary leading-5",
				children: e
			}), t && /* @__PURE__ */ m("span", {
				className: "text-xs text-text-secondary",
				children: t
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/FloatCheckbox.tsx
function Ze({ selected: e, onToggle: t, className: n }) {
	return /* @__PURE__ */ m("div", {
		role: "checkbox",
		"aria-checked": e,
		onClick: (e) => {
			e.stopPropagation(), t();
		},
		className: g("transition-opacity cursor-pointer", e ? "opacity-100" : "opacity-0 group-hover:opacity-100", n),
		children: /* @__PURE__ */ m("div", {
			className: g("w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors", e ? "bg-primary border-primary" : "bg-black/30 border-white"),
			children: e && /* @__PURE__ */ m("span", {
				className: "text-white text-[10px] font-bold leading-none",
				children: "✓"
			})
		})
	});
}
//#endregion
//#region ../../src/ui/Separator.tsx
function Qe({ orientation: e = "horizontal", className: t }) {
	return /* @__PURE__ */ m("div", {
		role: "separator",
		"aria-orientation": e,
		className: g("bg-border flex-shrink-0", e === "horizontal" ? "h-px w-full" : "w-px self-stretch", t)
	});
}
//#endregion
//#region ../../src/ui/Spinner.tsx
var $e = {
	xs: "h-3 w-3 border",
	sm: "h-4 w-4 border-2",
	md: "h-6 w-6 border-2",
	lg: "h-8 w-8 border-[3px]"
};
function et({ size: e = "md", className: t, label: n = "Chargement…" }) {
	return /* @__PURE__ */ m("span", {
		role: "status",
		"aria-label": n,
		className: g("inline-block rounded-full border-border border-t-primary animate-spin", $e[e], t)
	});
}
function tt({ label: e = "Chargement…" }) {
	return /* @__PURE__ */ m("div", {
		className: "absolute inset-0 flex items-center justify-center bg-white/70 z-10",
		children: /* @__PURE__ */ m(et, {
			size: "lg",
			label: e
		})
	});
}
//#endregion
//#region ../../src/ui/RangeSlider.tsx
function nt({ d: e, animate: t }) {
	return /* @__PURE__ */ m("span", {
		className: "inline-block overflow-hidden align-baseline",
		style: { height: "1em" },
		children: /* @__PURE__ */ m("span", {
			className: "flex flex-col",
			style: {
				transform: `translateY(-${e}em)`,
				transition: t ? "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)" : "none"
			},
			children: Array.from({ length: 10 }, (e, t) => /* @__PURE__ */ m("span", {
				style: {
					height: "1em",
					lineHeight: "1em"
				},
				children: t
			}, t))
		})
	});
}
function rt({ text: e, className: t }) {
	let n = u(!1);
	return o(() => {
		n.current = !0;
	}, []), /* @__PURE__ */ m("span", {
		className: `inline-flex items-baseline tabular-nums leading-none ${t ?? ""}`,
		children: [...e].map((e, t) => /\d/.test(e) ? /* @__PURE__ */ m(nt, {
			d: Number(e),
			animate: n.current
		}, t) : /* @__PURE__ */ m("span", { children: e }, t))
	});
}
var it = (e, t, n) => n <= t ? 0 : Math.max(0, Math.min(100, (e - t) / (n - t) * 100));
function at({ value: e, onChange: t, min: n = 0, max: r = 100, step: i = 1, variant: a = "bubble", orientation: o = "horizontal", format: c, minLabel: l, maxLabel: u, showValue: f = !1, accent: p, trackColor: g, disabled: v, className: y, style: b, id: x, ...S }) {
	let C = s(), [w, T] = d(!1), E = x ?? C, D = c ?? ((e) => String(e)), O = it(e, n, r), k = p ?? "var(--color-primary, #1a73e8)", A = g ?? "rgba(0,0,0,0.10)", j = (e) => {
		let i = Number(e);
		Number.isFinite(i) && t(Math.max(n, Math.min(r, i)));
	}, M = /* @__PURE__ */ m("input", {
		id: E,
		type: "range",
		min: n,
		max: r,
		step: i,
		value: e,
		disabled: v,
		onChange: (e) => t(Number(e.target.value)),
		onMouseDown: (e) => e.stopPropagation(),
		"aria-label": S["aria-label"],
		className: "absolute inset-0 m-0 w-full h-full cursor-pointer appearance-none bg-transparent\n                 focus:outline-none disabled:cursor-not-allowed\n                 [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent\n                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-transparent\n                 [&::-moz-range-track]:bg-transparent\n                 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent",
		style: {
			WebkitAppearance: "none",
			appearance: "none"
		}
	}), N = (e = 12) => /* @__PURE__ */ m("span", {
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
	if (a === "boxed") return /* @__PURE__ */ h("div", {
		className: _("select-none", v && "opacity-60", y),
		style: b,
		children: [/* @__PURE__ */ h("div", {
			className: "relative rounded-xl border-2 bg-surface-0 px-4 pt-3 pb-5 transition-colors focus-within:border-primary",
			style: { borderColor: "var(--color-border, #dadce0)" },
			children: [/* @__PURE__ */ m("input", {
				type: "text",
				inputMode: "numeric",
				value: D(e),
				disabled: v,
				onChange: (e) => j(e.target.value.replace(/[^\d.-]/g, "")),
				className: "w-full bg-transparent text-2xl font-medium text-text-primary tabular-nums\n                       focus:outline-none disabled:cursor-not-allowed",
				"aria-label": S["aria-label"]
			}), /* @__PURE__ */ m("div", {
				className: "absolute left-3 right-3 bottom-0 h-0 translate-y-1/2",
				children: /* @__PURE__ */ h("div", {
					className: "relative h-1.5 rounded-full",
					style: { background: A },
					children: [
						/* @__PURE__ */ m("div", {
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
		}), /* @__PURE__ */ h("div", {
			className: "mt-1.5 flex items-center justify-between text-xs text-text-tertiary",
			children: [/* @__PURE__ */ m("span", { children: l ?? D(n) }), /* @__PURE__ */ m("span", { children: u ?? D(r) })]
		})]
	});
	if (o === "vertical") {
		let a = /* @__PURE__ */ m("input", {
			id: E,
			type: "range",
			min: n,
			max: r,
			step: i,
			value: e,
			disabled: v,
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
		return /* @__PURE__ */ m("div", {
			className: _("relative h-full select-none", v && "opacity-60", y),
			style: b,
			children: /* @__PURE__ */ h("div", {
				className: "relative mx-auto h-full w-1.5 rounded-full",
				style: { background: A },
				children: [
					/* @__PURE__ */ m("div", {
						className: "absolute inset-x-0 bottom-0 rounded-full",
						style: {
							height: `${O}%`,
							background: k
						}
					}),
					/* @__PURE__ */ m("span", {
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
	let P = f || w;
	return /* @__PURE__ */ h("div", {
		className: _("relative w-full select-none", v && "opacity-60", y),
		style: b,
		onPointerDown: () => !v && T(!0),
		onPointerUp: () => T(!1),
		onPointerLeave: () => T(!1),
		children: [/* @__PURE__ */ m("div", {
			"aria-hidden": !0,
			className: "pointer-events-none absolute -top-1 -translate-y-full transition-[opacity,transform] duration-150",
			style: {
				left: `${O}%`,
				transform: `translate(-50%, ${P ? "-100%" : "-80%"})`,
				opacity: +!!P
			},
			children: /* @__PURE__ */ m("span", {
				className: "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold text-white shadow",
				style: { background: k },
				children: /* @__PURE__ */ m(rt, { text: D(e) })
			})
		}), /* @__PURE__ */ h("div", {
			className: "relative h-1.5 rounded-full",
			style: { background: A },
			children: [
				/* @__PURE__ */ m("div", {
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
//#region ../../src/ui/Dropdown.tsx
var ot = {
	default: {
		text: "#202124",
		hoverBg: "rgba(0,0,0,0.06)",
		activeBg: "rgba(0,0,0,0.08)",
		chevron: "#5f6368",
		border: "var(--color-border)",
		popBg: "#fff",
		popShadow: "0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)",
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
		popBg: "#252526",
		popShadow: "0 4px 8px rgba(0,0,0,0.5)",
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
		popBg: "#fff",
		popShadow: "0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)",
		itemText: "#202124",
		itemHover: "rgba(0,0,0,0.06)",
		selBg: "rgba(26,115,232,0.12)",
		selHoverBg: "rgba(26,115,232,0.16)",
		checkColor: "#1a73e8"
	}
};
function st({ value: e, onChange: t, options: n, width: r, dropdownMinWidth: i, placeholder: a, disabled: s = !1, height: l = 36, fontSize: f = 14, className: p, variant: g = "default", buttonStyle: _ }) {
	let [v, y] = d(!1), [b, x] = d(null), C = u(null), w = u(null), T = ot[g], E = n.find((t) => t.value === e)?.label ?? a ?? e, D = () => {
		if (!s) {
			if (C.current) {
				let e = C.current.getBoundingClientRect();
				x({
					top: e.bottom + 2,
					left: e.left,
					minWidth: Math.max(i ?? 0, e.width)
				});
			}
			y((e) => !e);
		}
	};
	o(() => {
		if (!v) return;
		let e = (e) => {
			C.current?.contains(e.target) || y(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [v]), c(() => {
		let e = w.current;
		if (!e || !v || !b) return;
		let t = e.getBoundingClientRect(), n = window.innerWidth, r = window.innerHeight, i = b.left, a = b.top;
		t.right > n - 8 && (i = n - 8 - t.width), t.bottom > r - 8 && (a = r - 8 - t.height), i < 8 && (i = 8), a < 8 && (a = 8), e.style.left = `${i}px`, e.style.top = `${a}px`;
	}, [v, b]);
	let O = {};
	return r !== void 0 && (O.width = r), /* @__PURE__ */ h("div", {
		className: `relative ${p ?? ""}`,
		style: O,
		children: [/* @__PURE__ */ h("button", {
			type: "button",
			ref: C,
			onClick: D,
			onMouseDown: (e) => e.preventDefault(),
			disabled: s,
			className: "w-full flex items-center justify-between gap-1 select-none",
			style: {
				height: l,
				padding: "0 4px 0 8px",
				fontSize: f,
				fontFamily: "var(--font-family-sans)",
				color: T.text,
				background: v ? T.activeBg : void 0,
				border: `1px solid ${T.border}`,
				borderRadius: "var(--radius-md)",
				cursor: s ? "not-allowed" : "pointer",
				opacity: s ? .5 : 1,
				transition: "background 0.1s",
				..._
			},
			onMouseEnter: (e) => {
				!v && !s && (e.currentTarget.style.background = T.hoverBg);
			},
			onMouseLeave: (e) => {
				v || (e.currentTarget.style.background = "");
			},
			children: [/* @__PURE__ */ m("span", {
				className: "truncate flex-1 text-left",
				children: E
			}), /* @__PURE__ */ m(S, {
				size: 12,
				style: {
					color: T.chevron,
					flexShrink: 0
				}
			})]
		}), v && b && H(/* @__PURE__ */ m("div", {
			ref: w,
			onMouseDown: (e) => {
				e.preventDefault(), e.stopPropagation();
			},
			style: {
				position: "fixed",
				top: b.top,
				left: b.left,
				minWidth: b.minWidth,
				maxHeight: 280,
				zIndex: 9999,
				background: T.popBg,
				borderRadius: 4,
				padding: "4px 0",
				overflowY: "auto",
				boxShadow: T.popShadow
			},
			children: n.map((n) => /* @__PURE__ */ h("button", {
				type: "button",
				onClick: () => {
					t(n.value), y(!1);
				},
				className: "w-full text-left flex items-center gap-2",
				style: {
					padding: "5px 16px",
					fontSize: f,
					color: T.itemText,
					background: n.value === e ? T.selBg : void 0,
					fontWeight: n.value === e ? 600 : void 0
				},
				onMouseEnter: (t) => {
					t.currentTarget.style.background = n.value === e ? T.selHoverBg : T.itemHover;
				},
				onMouseLeave: (t) => {
					t.currentTarget.style.background = n.value === e ? T.selBg : "";
				},
				children: [
					n.value === e ? /* @__PURE__ */ m("span", {
						style: {
							color: T.checkColor,
							fontSize: 14,
							marginLeft: -4
						},
						children: "✓"
					}) : /* @__PURE__ */ m("span", { style: { width: 14 } }),
					n.icon && /* @__PURE__ */ m("span", {
						className: "flex-shrink-0",
						children: n.icon
					}),
					n.label
				]
			}, n.value))
		}), document.body)]
	});
}
//#endregion
//#region ../../src/ui/DatePicker.tsx
var ct = [
	"L",
	"M",
	"M",
	"J",
	"V",
	"S",
	"D"
], lt = [
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
function ut(e, t) {
	if (!e) return null;
	try {
		if (t === "time") {
			let [t, n] = e.split(":").map(Number);
			if (isNaN(t) || isNaN(n)) return null;
			let r = /* @__PURE__ */ new Date();
			return r.setHours(t, n, 0, 0), r;
		}
		let n = J(e);
		return ue(n) ? n : null;
	} catch {
		return null;
	}
}
function dt(e, t) {
	return e ? t === "date" ? K(e, "dd/MM/yyyy") : t === "time" ? K(e, "HH:mm") : t === "datetime" ? K(e, "dd/MM/yyyy HH:mm") : "" : "";
}
function ft(e, t) {
	return e ? t === "date" ? K(e, "yyyy-MM-dd") : t === "time" ? K(e, "HH:mm") : t === "datetime" ? K(e, "yyyy-MM-dd'T'HH:mm") : null : null;
}
function pt(e) {
	return U({
		start: fe(de(e), { weekStartsOn: 1 }),
		end: G(W(e), { weekStartsOn: 1 })
	});
}
function mt(e) {
	let t = e - e % 12;
	return Array.from({ length: 12 }, (e, n) => t + n);
}
function ht(e, t, n) {
	let r = e.getBoundingClientRect(), i = window.innerHeight - r.bottom - 8, a = r.top - 8;
	return {
		top: i >= t || i >= a ? r.bottom + window.scrollY + 4 : r.top + window.scrollY - t - 4,
		left: Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - n - 8))
	};
}
function gt({ values: e, selected: t, onSelect: n, label: r }) {
	let i = u(null), a = u(null);
	return o(() => {
		let e = a.current, t = i.current;
		!e || !t || (t.scrollTop = e.offsetTop - t.clientHeight / 2 + e.clientHeight / 2);
	}, [t, r]), /* @__PURE__ */ h("div", {
		className: "flex flex-col items-center w-14",
		children: [/* @__PURE__ */ m("span", {
			className: "text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1",
			children: r
		}), /* @__PURE__ */ m("div", {
			ref: i,
			className: "relative overflow-y-auto h-40",
			style: { scrollbarWidth: "none" },
			children: e.map((e) => /* @__PURE__ */ m("button", {
				ref: e === t ? a : void 0,
				type: "button",
				onClick: () => n(e),
				className: g("w-14 h-8 flex items-center justify-center text-sm rounded transition-colors", e === t ? "bg-primary/10 text-primary font-semibold" : "text-text-primary hover:bg-surface-2"),
				children: String(e).padStart(2, "0")
			}, e))
		})]
	});
}
function _t({ viewDate: e, setViewDate: t, view: n, setView: r, selected: a, onSelect: o, rangeStart: s, rangeEnd: c, hoverDate: u, setHoverDate: d, isRange: f, minDate: p, maxDate: _, disabledDate: v }) {
	let y = p ? J(p) : null, b = _ ? J(_) : null, x = i((e) => y && oe(e, y) || b && ae(e, b) ? !0 : v ? v(e) : !1, [
		y,
		b,
		v
	]), S = l(() => c || (s && !c && u ? u : null), [
		s,
		c,
		u
	]), T = i((e) => {
		if (!f || !s || !S) return !1;
		let [t, n] = oe(s, S) ? [s, S] : [S, s];
		return ae(e, t) && oe(e, n);
	}, [
		f,
		s,
		S
	]), E = i((e) => f ? s && se(e, s) || S && se(e, S) : !1, [
		f,
		s,
		S
	]), D = l(() => mt(q(e)), [e]);
	if (n === "day") {
		let n = pt(e), i = K(e, "MMMM", { locale: me }), s = i.charAt(0).toUpperCase() + i.slice(1);
		return /* @__PURE__ */ h("div", { children: [
			/* @__PURE__ */ h("div", {
				className: "flex items-center gap-1 mb-2",
				children: [
					/* @__PURE__ */ m("button", {
						type: "button",
						onClick: () => t(pe(e, 1)),
						className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
						children: /* @__PURE__ */ m(C, { size: 14 })
					}),
					/* @__PURE__ */ h("div", {
						className: "flex-1 flex items-center justify-center gap-1",
						children: [/* @__PURE__ */ m("button", {
							type: "button",
							onClick: () => r("month"),
							className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
							children: s
						}), /* @__PURE__ */ m("button", {
							type: "button",
							onClick: () => r("year"),
							className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
							children: q(e)
						})]
					}),
					/* @__PURE__ */ m("button", {
						type: "button",
						onClick: () => t(re(e, 1)),
						className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
						children: /* @__PURE__ */ m(w, { size: 14 })
					})
				]
			}),
			/* @__PURE__ */ m("div", {
				className: "grid grid-cols-7 mb-0.5",
				children: ct.map((e, t) => /* @__PURE__ */ m("div", {
					className: "h-7 flex items-center justify-center text-[11px] font-medium text-text-tertiary",
					children: e
				}, t))
			}),
			/* @__PURE__ */ m("div", {
				className: "grid grid-cols-7",
				onMouseLeave: () => d?.(null),
				children: n.map((t, n) => {
					let r = ce(t, e), i = !f && a && se(t, a), s = E(t), c = T(t), l = x(t), u = le(t);
					return /* @__PURE__ */ m("button", {
						type: "button",
						disabled: l,
						onClick: () => !l && o(t),
						onMouseEnter: () => d?.(t),
						className: g("h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium transition-colors", i || s ? "rounded-full bg-primary text-white" : "", !i && !s && c ? "bg-primary/10 text-primary" : "", !i && !s && !c && !l && u ? "rounded-full border border-primary text-primary hover:bg-primary-light" : "", !i && !s && !c && !l && !u && r ? "rounded-full text-text-primary hover:bg-surface-2" : "", !i && !s && !c && !l && !u && !r ? "rounded-full text-text-tertiary hover:bg-surface-2" : "", l ? "opacity-30 cursor-not-allowed rounded-full" : ""),
						children: K(t, "d")
					}, n);
				})
			})
		] });
	}
	return n === "month" ? /* @__PURE__ */ h("div", { children: [/* @__PURE__ */ h("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ m("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(q(e) - 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ m(C, { size: 14 })
			}),
			/* @__PURE__ */ m("button", {
				type: "button",
				onClick: () => r("year"),
				className: "flex-1 text-sm font-semibold text-center text-text-primary hover:text-primary transition-colors rounded hover:bg-surface-1 py-0.5",
				children: q(e)
			}),
			/* @__PURE__ */ m("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(q(e) + 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ m(w, { size: 14 })
			})
		]
	}), /* @__PURE__ */ m("div", {
		className: "grid grid-cols-3 gap-1",
		children: lt.map((n, i) => /* @__PURE__ */ m("button", {
			type: "button",
			onClick: () => {
				t((e) => {
					let t = new Date(e);
					return t.setMonth(i), t;
				}), r("day");
			},
			className: g("h-9 rounded-lg text-sm font-medium transition-colors", a && ie(a) === i && q(a) === q(e) ? "bg-primary text-white" : "text-text-primary hover:bg-surface-2"),
			children: n
		}, i))
	})] }) : /* @__PURE__ */ h("div", { children: [/* @__PURE__ */ h("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ m("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(q(e) - 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ m(C, { size: 14 })
			}),
			/* @__PURE__ */ h("span", {
				className: "flex-1 text-sm font-semibold text-center text-text-primary",
				children: [
					D[0],
					" – ",
					D[D.length - 1]
				]
			}),
			/* @__PURE__ */ m("button", {
				type: "button",
				onClick: () => t((e) => {
					let t = new Date(e);
					return t.setFullYear(q(e) + 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ m(w, { size: 14 })
			})
		]
	}), /* @__PURE__ */ m("div", {
		className: "grid grid-cols-3 gap-1",
		children: D.map((e) => {
			let n = a && q(a) === e, i = q(/* @__PURE__ */ new Date()) === e;
			return /* @__PURE__ */ m("button", {
				type: "button",
				onClick: () => {
					t((t) => {
						let n = new Date(t);
						return n.setFullYear(e), n;
					}), r("month");
				},
				className: g("h-9 rounded-lg text-sm font-medium transition-colors", n ? "bg-primary text-white" : i ? "border border-primary text-primary hover:bg-primary-light" : "text-text-primary hover:bg-surface-2"),
				children: e
			}, e);
		})
	})] });
}
function vt({ mode: e = "date", value: t, onChange: n, startValue: r, endValue: a, onRangeChange: s, label: c, placeholder: f, disabled: p = !1, readOnly: _ = !1, clearable: v = !1, required: y, error: x, hint: S, minDate: C, maxDate: w, disabledDate: T, minuteStep: E = 5, size: O = "md", className: k, id: A, name: j }) {
	let M = u(null), N = u(null), [P, F] = d(!1), [ee, I] = d("day"), [te, L] = d(/* @__PURE__ */ new Date()), R = l(() => ut(t, e), [t, e]), z = l(() => ut(r, "date"), [r]), B = l(() => ut(a, "date"), [a]), [V, re] = d(() => R?.getHours() ?? 0), [U, W] = d(() => R?.getMinutes() ?? 0), [G, K] = d("first"), [ie, q] = d(null), [ae, se] = d(null), [ce, le] = d({
		top: 0,
		left: 0
	}), ue = A ?? (typeof c == "string" ? c.toLowerCase().replace(/\s+/g, "-") : void 0), J = l(() => {
		if (e === "daterange") {
			let e = z, t = B;
			return e ? t ? `${dt(e, "date")} – ${dt(t, "date")}` : dt(e, "date") : "";
		}
		return dt(R, e);
	}, [
		e,
		R,
		z,
		B
	]), de = i(() => {
		if (p || _) return;
		let t = M.current;
		t && (le(ht(t, e === "time" ? 230 : e === "datetime" ? 480 : 340, e === "time" ? 172 : 284)), L(e === "daterange" ? z ?? /* @__PURE__ */ new Date() : R ?? /* @__PURE__ */ new Date()), I("day"), R && (e === "time" || e === "datetime") && (re(R.getHours()), W(R.getMinutes())), e === "daterange" && (K("first"), q(null), se(null)), F(!0));
	}, [
		p,
		_,
		e,
		R,
		z
	]);
	o(() => {
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
	let fe = i((t) => {
		if (e === "daterange") {
			if (G === "first") q(t), K("second"), s?.(ft(t, "date"), null);
			else {
				let e = ie ?? t, [n, r] = oe(e, t) ? [e, t] : [t, e];
				s?.(ft(n, "date"), ft(r, "date")), F(!1);
			}
			return;
		}
		if (e === "date") {
			n?.(ft(t, "date")), F(!1);
			return;
		}
		if (e === "datetime") {
			let e = new Date(t);
			e.setHours(V, U, 0, 0), n?.(ft(e, "datetime"));
		}
	}, [
		e,
		G,
		ie,
		V,
		U,
		n,
		s
	]), pe = i((t, r) => {
		let i = e === "datetime" && R ? new Date(R) : /* @__PURE__ */ new Date();
		i.setHours(t, r, 0, 0), n?.(ft(i, e));
	}, [
		e,
		R,
		n
	]), me = i((e) => {
		re(e), pe(e, U);
	}, [U, pe]), he = i((e) => {
		W(e), pe(V, e);
	}, [V, pe]), ge = (t) => {
		t.stopPropagation(), e === "daterange" ? s?.(null, null) : n?.(null);
	}, _e = v && (e === "daterange" ? !!(r || a) : !!t) && !p && !_, ve = O === "sm" ? "h-7 text-xs" : "h-9 text-sm", ye = m(e === "time" ? D : b, { size: 14 }), be = {
		date: "jj/mm/aaaa",
		time: "hh:mm",
		datetime: "jj/mm/aaaa hh:mm",
		daterange: "jj/mm/aaaa – jj/mm/aaaa"
	}[e], xe = Array.from({ length: 24 }, (e, t) => t), Y = Array.from({ length: Math.ceil(60 / E) }, (e, t) => t * E), Se = e !== "time", Ce = e === "time" || e === "datetime", we = e === "time" ? 172 : 284, Te = ie ?? z, Ee = ie ? null : B;
	return /* @__PURE__ */ h("div", {
		className: g("flex flex-col gap-1", k),
		children: [
			c && /* @__PURE__ */ h("label", {
				htmlFor: ue,
				className: "text-sm font-medium text-text-primary",
				children: [c, y && /* @__PURE__ */ m("span", {
					className: "text-danger ml-0.5",
					children: "*"
				})]
			}),
			/* @__PURE__ */ h("div", {
				className: "relative",
				children: [j && /* @__PURE__ */ m("input", {
					type: "hidden",
					name: j,
					value: t ?? "",
					readOnly: !0
				}), /* @__PURE__ */ h("button", {
					ref: M,
					id: ue,
					type: "button",
					onClick: de,
					disabled: p,
					"aria-haspopup": "dialog",
					"aria-expanded": P,
					className: g("w-full flex items-center gap-2 px-3 rounded border bg-white text-left", "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", x ? "border-danger focus:ring-danger" : "border-border", p && "bg-surface-2 cursor-not-allowed opacity-60", _ && "cursor-default", ve),
					children: [
						/* @__PURE__ */ m("span", {
							className: "text-text-tertiary shrink-0",
							children: ye
						}),
						/* @__PURE__ */ m("span", {
							className: g("flex-1 truncate", J ? "text-text-primary" : "text-text-tertiary"),
							children: J || (f ?? be)
						}),
						_e ? /* @__PURE__ */ m("button", {
							type: "button",
							onClick: ge,
							className: "shrink-0 text-text-tertiary hover:text-text-primary transition-colors",
							tabIndex: -1,
							children: /* @__PURE__ */ m(ne, { size: 13 })
						}) : null
					]
				})]
			}),
			x && /* @__PURE__ */ m("p", {
				className: "text-xs text-danger",
				children: x
			}),
			S && !x && /* @__PURE__ */ m("p", {
				className: "text-xs text-text-secondary",
				children: S
			}),
			P && H(/* @__PURE__ */ m("div", {
				ref: N,
				role: "dialog",
				style: {
					position: "absolute",
					top: ce.top,
					left: ce.left,
					width: we,
					zIndex: 9999
				},
				className: "bg-white rounded-xl shadow-2xl border border-border",
				children: /* @__PURE__ */ h("div", {
					className: "p-3 select-none",
					children: [
						Se && /* @__PURE__ */ m(_t, {
							viewDate: te,
							setViewDate: L,
							view: ee,
							setView: I,
							selected: R,
							onSelect: fe,
							rangeStart: Te,
							rangeEnd: Ee,
							hoverDate: ae,
							setHoverDate: se,
							isRange: e === "daterange",
							minDate: C,
							maxDate: w,
							disabledDate: T
						}),
						Se && Ce && /* @__PURE__ */ m("div", { className: "my-3 h-px bg-border" }),
						Ce && /* @__PURE__ */ h("div", {
							className: "flex items-start justify-center gap-1",
							children: [
								/* @__PURE__ */ m(gt, {
									values: xe,
									selected: V,
									onSelect: me,
									label: "Heure"
								}),
								/* @__PURE__ */ m("span", {
									className: "mt-8 text-text-tertiary text-base font-semibold",
									children: ":"
								}),
								/* @__PURE__ */ m(gt, {
									values: Y,
									selected: Y.includes(U) ? U : Y.reduce((e, t) => Math.abs(t - U) < Math.abs(e - U) ? t : e),
									onSelect: he,
									label: "Min"
								})
							]
						}),
						Ce && /* @__PURE__ */ h("div", {
							className: "flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border",
							children: [_e ? /* @__PURE__ */ m("button", {
								type: "button",
								onClick: (e) => {
									ge(e), F(!1);
								},
								className: "text-xs text-text-secondary hover:text-danger transition-colors",
								children: "Effacer"
							}) : /* @__PURE__ */ m("span", {}), /* @__PURE__ */ m("button", {
								type: "button",
								onClick: () => {
									if (!t) {
										let t = e === "datetime" && R ? new Date(R) : /* @__PURE__ */ new Date();
										t.setHours(V, U, 0, 0), n?.(ft(t, e));
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
var yt = (e) => e.charCodeAt(0) << 24 | e.charCodeAt(1) << 16 | e.charCodeAt(2) << 8 | e.charCodeAt(3), bt = yt("name"), xt = yt("ttcf"), St = yt("OS/2");
function Ct(e) {
	let t = e.toLowerCase(), n = /italic|oblique/.test(t) ? "italic" : "normal", r = 400;
	return /thin|hairline/.test(t) ? r = 100 : /extra\s*light|ultra\s*light/.test(t) ? r = 200 : /semi\s*light|demi\s*light/.test(t) ? r = 350 : /light/.test(t) ? r = 300 : /medium/.test(t) ? r = 500 : /semi\s*bold|demi\s*bold/.test(t) ? r = 600 : /extra\s*bold|ultra\s*bold/.test(t) ? r = 800 : /black|heavy/.test(t) ? r = 900 : /bold/.test(t) && (r = 700), {
		weight: r,
		style: n
	};
}
function wt(e) {
	try {
		let t = new DataView(e), n, r;
		if (t.getUint32(0) === xt) {
			let e = t.getUint32(12);
			n = t.getUint16(e + 4), r = e + 12;
		} else n = t.getUint16(4), r = 12;
		let i = -1, a = -1;
		for (let e = 0; e < n; e++) {
			let n = r + e * 16, o = t.getUint32(n);
			o === bt ? i = t.getUint32(n + 8) : o === St && (a = t.getUint32(n + 8));
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
		let u = c(17) || c(2) || "Regular", d = Ct(u);
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
function Tt(e) {
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
var Et = {
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
}, Dt = (e) => `"${e.replace(/"/g, "")}", "Segoe UI", system-ui, sans-serif`, Ot = [
	"sans",
	"serif",
	"mono",
	"script",
	"display"
], kt = {
	sans: "Sans Serif",
	serif: "Serif",
	mono: "Monospace",
	script: "Manuscrite",
	display: "Fantaisie"
}, At = /(mono|consol|courier|menlo|monaco|fixedsys|terminal|source code|fira ?code|jetbrains|inconsolata|space mono|ubuntu mono|cascadia|hack|iosevka|\bcode\b)/i, jt = /(script|hand|brush|comic|cursive|calligr|pacifico|dancing|lobster|caveat|satisfy|sacramento|great vibes|shadows into|indie flower|kalam|marck|allura|tangerine|segoe script|bradley|lucida handwriting)/i, Mt = /(display|impact|bebas|oswald|anton|abril|playbill|stencil|bungee|black ops|fredoka|lilita|luckiest|righteous|permanent marker|creepster|monoton|bangers|poster|headline)/i, Nt = /(serif|times|georgia|garamond|book antiqua|palatino|cambria|constantia|didot|bodoni|minion|caslon|merriweather|playfair|lora|crimson|spectral|slab|rockwell|century|sylfaen|cardo|vollkorn)/i;
function Pt(e) {
	let t = e.toLowerCase();
	return At.test(t) ? "mono" : jt.test(t) ? "script" : Mt.test(t) ? "display" : /\bsans\b/.test(t) ? "sans" : Nt.test(t) ? "serif" : "sans";
}
function Ft(e, t) {
	if (!t) return e;
	let n = e.toLowerCase().indexOf(t.toLowerCase());
	return n < 0 ? e : /* @__PURE__ */ h(p, { children: [
		e.slice(0, n),
		/* @__PURE__ */ m("span", {
			style: {
				color: "var(--color-primary)",
				fontWeight: 600
			},
			children: e.slice(n, n + t.length)
		}),
		e.slice(n + t.length)
	] });
}
function It({ value: e, onChange: t, fonts: n, recent: r = [], width: i = 150, height: a = 36, fontSize: f = 14, disabled: p = !1, className: g, variant: _ = "default", placeholder: v = "", buttonStyle: y, sampleText: b = "AaBbCc", theme: C = "light" }) {
	let w = Et[C], [T, E] = d(!1), [D, O] = d(null), [k, A] = d(""), [j, M] = d(0), N = u(null), P = u(null), F = u(null), ee = u(null), I = s(), L = l(() => Tt([...r, ...n]), [r, n]), R = l(() => new Set(r.map((e) => e.toLowerCase())), [r]), { rows: z, options: B } = l(() => {
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
		}, r = k.trim().toLowerCase();
		if (r) {
			let e = L.filter((e) => e.toLowerCase().includes(r));
			e.sort((e, t) => !e.toLowerCase().startsWith(r) - +!t.toLowerCase().startsWith(r)), n(e, null);
		} else {
			let e = L.filter((e) => R.has(e.toLowerCase()));
			n(e, e.length ? "Récentes" : null);
			let t = L.filter((e) => !R.has(e.toLowerCase()));
			for (let e of Ot) n(t.filter((t) => Pt(t) === e).sort((e, t) => e.localeCompare(t)), kt[e]);
		}
		return {
			rows: e,
			options: t
		};
	}, [
		L,
		R,
		k
	]), V = () => {
		if (p) return;
		let e = N.current?.getBoundingClientRect();
		e && O({
			top: e.bottom + 4,
			left: e.left,
			minWidth: Math.max(248, e.width)
		}), A(""), E((e) => !e);
	};
	o(() => {
		if (!T) return;
		let t = Math.max(0, B.indexOf(e));
		M(t);
		let n = (e) => {
			!N.current?.contains(e.target) && !P.current?.contains(e.target) && E(!1);
		};
		document.addEventListener("mousedown", n);
		let r = setTimeout(() => {
			ee.current?.focus(), F.current?.querySelector(`[data-idx="${t}"]`)?.scrollIntoView({ block: "center" });
		}, 0);
		return () => {
			document.removeEventListener("mousedown", n), clearTimeout(r);
		};
	}, [T]), o(() => {
		T && F.current?.querySelector(`[data-idx="${j}"]`)?.scrollIntoView({ block: "nearest" });
	}, [j, T]), c(() => {
		let e = P.current;
		if (!e || !T || !D) return;
		let t = e.getBoundingClientRect(), n = D.left, r = D.top;
		t.right > window.innerWidth - 8 && (n = window.innerWidth - 8 - t.width), t.bottom > window.innerHeight - 8 && (r = Math.max(8, window.innerHeight - 8 - t.height)), n < 8 && (n = 8), e.style.left = `${n}px`, e.style.top = `${r}px`;
	}, [
		T,
		D,
		z.length
	]);
	let ne = (e) => {
		t(e), E(!1);
	}, re = (e) => {
		let t = B.length - 1;
		e.key === "ArrowDown" ? (e.preventDefault(), M((e) => Math.min(t, e + 1))) : e.key === "ArrowUp" ? (e.preventDefault(), M((e) => Math.max(0, e - 1))) : e.key === "Home" ? (e.preventDefault(), M(0)) : e.key === "End" ? (e.preventDefault(), M(t)) : e.key === "PageDown" ? (e.preventDefault(), M((e) => Math.min(t, e + 8))) : e.key === "PageUp" ? (e.preventDefault(), M((e) => Math.max(0, e - 8))) : e.key === "Enter" ? (e.preventDefault(), B[j] && ne(B[j])) : e.key === "Escape" && (e.preventDefault(), E(!1));
	}, U = _ === "ghost", W = k.trim();
	return /* @__PURE__ */ h("div", {
		className: `relative ${g ?? ""}`,
		style: { width: i },
		children: [/* @__PURE__ */ h("button", {
			type: "button",
			ref: N,
			onClick: V,
			onMouseDown: (e) => e.preventDefault(),
			disabled: p,
			role: "combobox",
			"aria-haspopup": "listbox",
			"aria-expanded": T,
			"aria-controls": I,
			"aria-label": "Police",
			className: "w-full flex items-center justify-between gap-1 select-none",
			style: {
				height: a,
				padding: "0 6px 0 10px",
				fontSize: f,
				color: w.text,
				fontFamily: Dt(e || "Arial"),
				background: T ? w.active : void 0,
				border: `1px solid ${U ? "transparent" : w.border}`,
				borderRadius: "var(--radius-md)",
				cursor: p ? "not-allowed" : "pointer",
				opacity: p ? .5 : 1,
				transition: "background 0.12s, border-color 0.12s",
				...y
			},
			onMouseEnter: (e) => {
				!T && !p && (e.currentTarget.style.background = w.hover);
			},
			onMouseLeave: (e) => {
				T || (e.currentTarget.style.background = "");
			},
			title: e || v,
			children: [/* @__PURE__ */ m("span", {
				className: "truncate flex-1 text-left",
				style: e ? void 0 : { color: w.ter },
				children: e || v
			}), /* @__PURE__ */ m(S, {
				size: 14,
				style: {
					color: w.sec,
					flexShrink: 0,
					transition: "transform 0.12s",
					transform: T ? "rotate(180deg)" : void 0
				}
			})]
		}), T && D && H(/* @__PURE__ */ h("div", {
			ref: P,
			onMouseDown: (e) => e.stopPropagation(),
			style: {
				position: "fixed",
				top: D.top,
				left: D.left,
				minWidth: D.minWidth,
				width: "max-content",
				maxWidth: 360,
				zIndex: 9999,
				background: w.bg,
				borderRadius: 10,
				border: `1px solid ${w.border}`,
				boxShadow: "0 8px 24px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.10)",
				overflow: "hidden"
			},
			children: [/* @__PURE__ */ h("div", {
				className: "flex items-center gap-2 px-2.5",
				style: {
					height: 40,
					borderBottom: `1px solid ${w.border}`
				},
				children: [
					/* @__PURE__ */ m(te, {
						size: 15,
						style: {
							color: w.ter,
							flexShrink: 0
						}
					}),
					/* @__PURE__ */ m("input", {
						ref: ee,
						value: k,
						onChange: (e) => {
							A(e.target.value), M(0);
						},
						onKeyDown: re,
						placeholder: "Rechercher une police…",
						"aria-label": "Rechercher une police",
						"aria-controls": I,
						"aria-autocomplete": "list",
						className: "flex-1 outline-none bg-transparent",
						style: {
							color: w.text,
							fontSize: 13
						}
					}),
					k && /* @__PURE__ */ m("button", {
						type: "button",
						onClick: () => {
							A(""), M(0), ee.current?.focus();
						},
						className: "text-xs px-1.5 py-0.5 rounded",
						style: { color: w.sec },
						"aria-label": "Effacer la recherche",
						children: "Effacer"
					})
				]
			}), /* @__PURE__ */ h("div", {
				ref: F,
				id: I,
				role: "listbox",
				"aria-activedescendant": B[j] ? `${I}-opt-${j}` : void 0,
				style: {
					maxHeight: 340,
					overflowY: "auto",
					padding: "4px 0"
				},
				children: [B.length === 0 && /* @__PURE__ */ h("div", {
					className: "px-4 py-6 text-center",
					style: {
						color: w.ter,
						fontSize: 13
					},
					children: [
						"Aucune police pour « ",
						W,
						" »"
					]
				}), z.map((t, n) => t.kind === "header" ? /* @__PURE__ */ m("div", {
					"aria-hidden": !0,
					style: {
						padding: "8px 12px 4px",
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.05em",
						textTransform: "uppercase",
						color: w.ter,
						fontFamily: "var(--font-family-sans)"
					},
					children: t.label
				}, `h${n}`) : /* @__PURE__ */ h("button", {
					id: `${I}-opt-${t.i}`,
					"data-idx": t.i,
					type: "button",
					role: "option",
					"aria-selected": t.font === e,
					onClick: () => ne(t.font),
					onMouseEnter: () => M(t.i),
					className: "w-full text-left flex items-center gap-2",
					style: {
						padding: "7px 10px 7px 12px",
						color: w.text,
						background: t.i === j ? w.sel : t.font === e ? w.hover : void 0
					},
					children: [
						/* @__PURE__ */ m("span", {
							style: {
								width: 16,
								flexShrink: 0,
								color: w.accent,
								display: "inline-flex"
							},
							children: t.font === e && /* @__PURE__ */ m(x, { size: 15 })
						}),
						/* @__PURE__ */ m("span", {
							className: "truncate flex-1",
							style: {
								fontFamily: Dt(t.font),
								fontSize: 15
							},
							children: Ft(t.font, W)
						}),
						b && /* @__PURE__ */ m("span", {
							className: "truncate",
							style: {
								flexShrink: 0,
								maxWidth: 96,
								marginLeft: 8,
								fontFamily: Dt(t.font),
								fontSize: 15,
								color: w.ter
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
var Lt = "var(--radius-md)";
function Rt({ value: e, onChange: t, sizes: n, min: r, max: i, width: a, height: s, fontSize: l, disabled: f, boxStyle: p, theme: g = "light" }) {
	let _ = Et[g], [v, y] = d(!1), [b, x] = d(null), [C, w] = d(e), [T, E] = d(!1), D = u(null), O = u(null), k = u(null);
	o(() => {
		T || w(e);
	}, [e, T]);
	let A = (n) => {
		let a = n.trim();
		if (a === "") {
			w(e);
			return;
		}
		let o = Math.round(parseFloat(a.replace(",", ".")));
		if (!Number.isFinite(o)) {
			w(e);
			return;
		}
		t(String(Math.max(r, Math.min(i, o))));
	}, j = (n) => {
		let a = Math.max(r, Math.min(i, (parseInt(C || e || "0", 10) || 0) + n));
		t(String(a)), w(String(a));
	}, M = () => {
		if (f) return;
		let e = D.current?.getBoundingClientRect();
		e && x({
			top: e.bottom + 4,
			left: e.left,
			width: e.width
		}), y((e) => !e);
	};
	return o(() => {
		if (!v) return;
		let e = (e) => {
			!D.current?.contains(e.target) && !k.current?.contains(e.target) && y(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [v]), c(() => {
		let e = k.current;
		if (!e || !v || !b) return;
		let t = e.getBoundingClientRect(), n = b.left, r = b.top;
		t.bottom > window.innerHeight - 8 && (r = Math.max(8, b.top - t.height - s - 8)), t.right > window.innerWidth - 8 && (n = window.innerWidth - 8 - t.width), e.style.left = `${n}px`, e.style.top = `${r}px`;
	}, [
		v,
		b,
		s
	]), /* @__PURE__ */ h("div", {
		ref: D,
		className: "relative",
		style: { width: a },
		children: [/* @__PURE__ */ h("div", {
			className: "flex items-center select-none",
			style: {
				height: s,
				background: v ? _.active : void 0,
				border: `1px solid ${_.border}`,
				cursor: f ? "not-allowed" : "text",
				opacity: f ? .5 : 1,
				transition: "background 0.12s",
				...p
			},
			onMouseEnter: (e) => {
				!v && !f && (e.currentTarget.style.background = _.hover);
			},
			onMouseLeave: (e) => {
				v || (e.currentTarget.style.background = "");
			},
			children: [/* @__PURE__ */ m("input", {
				ref: O,
				value: C,
				disabled: f,
				inputMode: "numeric",
				onChange: (e) => w(e.target.value),
				onFocus: () => {
					E(!0), O.current?.select();
				},
				onBlur: () => {
					E(!1), A(C);
				},
				onKeyDown: (t) => {
					t.key === "Enter" ? (t.preventDefault(), A(C), O.current?.blur()) : t.key === "ArrowUp" ? (t.preventDefault(), j(1)) : t.key === "ArrowDown" ? (t.preventDefault(), j(-1)) : t.key === "Escape" && (t.preventDefault(), w(e), O.current?.blur());
				},
				className: "min-w-0 flex-1 outline-none bg-transparent text-left",
				style: {
					height: "100%",
					padding: "0 2px 0 8px",
					fontSize: l,
					color: _.text,
					fontFamily: "var(--font-family-sans)"
				},
				"aria-label": "Taille de police"
			}), /* @__PURE__ */ m("button", {
				type: "button",
				tabIndex: -1,
				disabled: f,
				onMouseDown: (e) => e.preventDefault(),
				onClick: M,
				"aria-label": "Choisir une taille",
				"aria-haspopup": "listbox",
				"aria-expanded": v,
				className: "flex items-center justify-center",
				style: {
					width: 18,
					height: "100%",
					flexShrink: 0,
					cursor: f ? "not-allowed" : "pointer"
				},
				children: /* @__PURE__ */ m(S, {
					size: 13,
					style: { color: _.sec }
				})
			})]
		}), v && b && H(/* @__PURE__ */ m("div", {
			ref: k,
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
				background: _.bg,
				border: `1px solid ${_.border}`,
				borderRadius: 8,
				boxShadow: "0 8px 24px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.10)"
			},
			children: n.map((n) => {
				let r = String(n), i = r === e;
				return /* @__PURE__ */ m("button", {
					type: "button",
					role: "option",
					"aria-selected": i,
					onClick: () => {
						t(r), w(r), y(!1);
					},
					className: "w-full text-left",
					style: {
						padding: "5px 12px",
						fontSize: l,
						color: _.text,
						fontWeight: i ? 600 : void 0,
						background: i ? _.sel : void 0
					},
					onMouseEnter: (e) => {
						e.currentTarget.style.background = i ? _.sel : _.hover;
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.background = i ? _.sel : "";
					},
					children: r
				}, r);
			})
		}), document.body)]
	});
}
function zt({ font: e, onFontChange: t, fonts: n, recentFonts: r, size: i, onSizeChange: a, sizes: o, minSize: s = 1, maxSize: c = 999, height: l = 30, fontWidth: u = 150, sizeWidth: d = 62, fontSize: f = 14, disabled: p = !1, className: g, theme: _ = "light" }) {
	return /* @__PURE__ */ h("div", {
		className: `flex items-stretch ${g ?? ""}`,
		children: [/* @__PURE__ */ m(It, {
			value: e,
			onChange: t,
			fonts: n,
			recent: r,
			width: u,
			height: l,
			fontSize: f,
			disabled: p,
			placeholder: "",
			theme: _,
			buttonStyle: {
				borderRadius: 0,
				borderTopLeftRadius: Lt,
				borderBottomLeftRadius: Lt
			}
		}), /* @__PURE__ */ m("div", {
			style: { marginLeft: -1 },
			children: /* @__PURE__ */ m(Rt, {
				value: i,
				onChange: a,
				sizes: o,
				min: s,
				max: c,
				width: d,
				height: l,
				fontSize: f,
				disabled: p,
				theme: _,
				boxStyle: {
					borderRadius: 0,
					borderTopRightRadius: Lt,
					borderBottomRightRadius: Lt
				}
			})
		})]
	});
}
//#endregion
//#region ../../src/ui/MenuDropdown.tsx
function Bt() {
	let [e, t] = d(() => typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(pointer: coarse)").matches);
	return o(() => {
		let e = window.matchMedia("(pointer: coarse)"), n = () => t(e.matches);
		return e.addEventListener("change", n), () => e.removeEventListener("change", n);
	}, []), e;
}
var Vt = {
	light: {
		bg: "#fff",
		text: "#202124",
		sep: "#e0e0e0",
		label: "#5f6368",
		hover: "rgba(0,0,0,0.06)",
		accent: "#1a73e8",
		shortcut: "#5f6368",
		danger: "#d93025",
		shadow: "0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)"
	},
	dark: {
		bg: "#323232",
		text: "#d6d6d6",
		sep: "#212121",
		label: "#8e8e8e",
		hover: "#454545",
		accent: "#5a9bdc",
		shortcut: "#8e8e8e",
		danger: "#e84a4a",
		shadow: "0 6px 24px rgba(0,0,0,.5)"
	}
};
function Ht({ items: t, pos: n, onClose: r, minWidth: i = 200, theme: a = "light" }) {
	let s = n.minWidth ?? i, l = Vt[a], f = u(null), g = Bt(), [_, v] = d(null);
	if (o(() => {
		let e = (e) => {
			f.current && !f.current.contains(e.target) && r();
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [r]), c(() => {
		let e = f.current;
		if (!e || g) return;
		let t = () => {
			let t = window.innerWidth, r = window.innerHeight;
			e.style.maxHeight = `${r - 16}px`, e.style.maxWidth = `${t - 16}px`, e.style.overflowY = "auto", e.style.left = `${n.left}px`, e.style.top = `${n.top}px`;
			let i = e.getBoundingClientRect(), a = n.left, o = n.top;
			a + i.width > t - 8 && (a = t - 8 - i.width), o + i.height > r - 8 && (o = r - 8 - i.height), a < 8 && (a = 8), o < 8 && (o = 8), e.style.left = `${a}px`, e.style.top = `${o}px`;
		};
		return t(), window.addEventListener("resize", t), () => window.removeEventListener("resize", t);
	}, [n, g]), g) {
		let n = _ ? _.items : t, i = {
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
		return H(/* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m("div", {
			className: "fixed inset-0 z-[9998]",
			style: { background: "rgba(0,0,0,0.35)" },
			onClick: r
		}), /* @__PURE__ */ h("div", {
			ref: f,
			onMouseDown: (e) => e.stopPropagation(),
			className: "fixed left-0 right-0 bottom-0 z-[9999]",
			style: {
				background: l.bg,
				color: l.text,
				borderTopLeftRadius: 16,
				borderTopRightRadius: 16,
				maxHeight: "78vh",
				overflowY: "auto",
				paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
				boxShadow: "0 -8px 30px rgba(0,0,0,0.28)",
				animation: "kbnSheetUp 0.18s ease-out"
			},
			children: [
				/* @__PURE__ */ m("style", { children: "@keyframes kbnSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}" }),
				/* @__PURE__ */ m("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						padding: "8px 0 2px"
					},
					children: /* @__PURE__ */ m("div", { style: {
						width: 38,
						height: 4,
						borderRadius: 2,
						background: l.sep
					} })
				}),
				_ && /* @__PURE__ */ h("button", {
					onClick: () => v(null),
					style: {
						...i,
						color: l.text,
						fontWeight: 600,
						borderBottom: `1px solid ${l.sep}`
					},
					children: [/* @__PURE__ */ m("span", {
						style: {
							width: 20,
							flexShrink: 0,
							color: l.accent,
							fontSize: 18,
							display: "inline-flex",
							alignItems: "center"
						},
						children: "‹"
					}), /* @__PURE__ */ m("span", {
						style: { flex: 1 },
						children: _.label
					})]
				}),
				n.map((t, n) => {
					if (t.type === "separator") return /* @__PURE__ */ m("div", { style: {
						background: l.sep,
						height: 1,
						margin: "4px 0"
					} }, n);
					if (t.type === "label") return /* @__PURE__ */ m("div", {
						style: {
							padding: "8px 20px 4px",
							fontSize: 12,
							color: l.label,
							fontWeight: 600,
							textTransform: "uppercase",
							letterSpacing: "0.05em"
						},
						children: t.text
					}, n);
					if (t.type === "custom") return /* @__PURE__ */ m(e.Fragment, { children: t.render(r) }, n);
					if (t.type === "submenu") return /* @__PURE__ */ h("button", {
						disabled: t.disabled,
						onClick: () => v({
							label: t.label,
							items: t.items
						}),
						style: {
							...i,
							color: l.text,
							opacity: t.disabled ? .4 : 1
						},
						children: [
							/* @__PURE__ */ m("span", {
								style: {
									width: 20,
									flexShrink: 0,
									color: l.accent,
									fontSize: 16,
									display: "inline-flex",
									alignItems: "center"
								},
								children: t.icon ?? ""
							}),
							/* @__PURE__ */ m("span", {
								style: { flex: 1 },
								children: t.label
							}),
							/* @__PURE__ */ m("span", {
								style: {
									color: l.label,
									fontSize: 16,
									flexShrink: 0
								},
								children: "›"
							})
						]
					}, n);
					let a = t.danger ? l.danger : l.text;
					return /* @__PURE__ */ h("button", {
						disabled: t.disabled,
						onClick: () => {
							t.onClick(), r();
						},
						style: {
							...i,
							color: a,
							opacity: t.disabled ? .4 : 1
						},
						children: [/* @__PURE__ */ m("span", {
							style: {
								width: 20,
								flexShrink: 0,
								color: t.danger ? l.danger : l.accent,
								fontSize: 16,
								display: "inline-flex",
								alignItems: "center"
							},
							children: t.checked ? "✓" : t.icon ? t.icon : ""
						}), /* @__PURE__ */ m("span", {
							style: { flex: 1 },
							children: t.label
						})]
					}, n);
				})
			]
		})] }), document.body);
	}
	return H(/* @__PURE__ */ m("div", {
		ref: f,
		onMouseDown: (e) => {
			e.preventDefault(), e.stopPropagation();
		},
		style: {
			position: "fixed",
			top: n.top,
			left: n.left,
			minWidth: s,
			zIndex: 9999,
			background: l.bg,
			borderRadius: 4,
			padding: "4px 0",
			boxShadow: l.shadow
		},
		children: t.map((t, n) => {
			if (t.type === "separator") return /* @__PURE__ */ m("div", { style: {
				background: l.sep,
				height: 1,
				margin: "4px 0"
			} }, n);
			if (t.type === "label") return /* @__PURE__ */ m("div", {
				style: {
					padding: "4px 16px",
					fontSize: 11,
					color: l.label,
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: "0.05em"
				},
				children: t.text
			}, n);
			if (t.type === "submenu") return /* @__PURE__ */ m(Ut, {
				item: t,
				onClose: r,
				theme: a
			}, n);
			if (t.type === "custom") return /* @__PURE__ */ m(e.Fragment, { children: t.render(r) }, n);
			let i = t.danger ? l.danger : l.text;
			return /* @__PURE__ */ h("button", {
				disabled: t.disabled,
				onClick: () => {
					t.onClick(), r();
				},
				className: "w-full flex items-center gap-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
				style: {
					padding: "6px 24px 6px 16px",
					fontSize: 13,
					color: i,
					lineHeight: "20px"
				},
				onMouseEnter: (e) => {
					t.disabled || (e.currentTarget.style.background = l.hover);
				},
				onMouseLeave: (e) => {
					e.currentTarget.style.background = "";
				},
				children: [
					/* @__PURE__ */ m("span", {
						style: {
							width: 20,
							flexShrink: 0,
							color: t.danger ? l.danger : l.accent,
							fontSize: 14,
							display: "inline-flex",
							alignItems: "center"
						},
						children: t.checked ? "✓" : t.icon ? t.icon : ""
					}),
					/* @__PURE__ */ m("span", {
						className: "flex-1",
						children: t.label
					}),
					t.shortcut && /* @__PURE__ */ m("span", {
						style: {
							color: l.shortcut,
							fontSize: 12,
							marginLeft: 24,
							flexShrink: 0,
							fontFamily: "monospace"
						},
						children: t.shortcut
					})
				]
			}, n);
		})
	}), document.body);
}
function Ut({ item: t, onClose: n, theme: r }) {
	let [i, a] = e.useState(null), o = Vt[r], s = u(null), c = u(void 0), l = () => {
		c.current && clearTimeout(c.current);
		let e = s.current?.getBoundingClientRect();
		if (!e) return;
		let t = e.right + 220 > window.innerWidth - 8 && e.left - 220 > 8 ? e.left - 220 + 2 : e.right - 2;
		a({
			top: e.top - 4,
			left: t,
			minWidth: 220
		});
	}, d = () => {
		c.current && clearTimeout(c.current), c.current = setTimeout(() => a(null), 180);
	};
	return /* @__PURE__ */ h("div", {
		onMouseEnter: l,
		onMouseLeave: d,
		style: { position: "relative" },
		children: [/* @__PURE__ */ h("button", {
			ref: s,
			disabled: t.disabled,
			className: "w-full flex items-center gap-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
			style: {
				padding: "6px 24px 6px 16px",
				fontSize: 13,
				color: o.text,
				lineHeight: "20px",
				background: i ? o.hover : ""
			},
			children: [
				/* @__PURE__ */ m("span", {
					style: {
						width: 20,
						flexShrink: 0,
						color: o.accent,
						fontSize: 14,
						display: "inline-flex",
						alignItems: "center"
					},
					children: t.icon ?? ""
				}),
				/* @__PURE__ */ m("span", {
					className: "flex-1",
					children: t.label
				}),
				/* @__PURE__ */ m("span", {
					style: {
						color: o.label,
						fontSize: 12,
						marginLeft: 24,
						flexShrink: 0
					},
					children: "▸"
				})
			]
		}), i && /* @__PURE__ */ m("div", {
			onMouseEnter: l,
			onMouseLeave: d,
			children: /* @__PURE__ */ m(Ht, {
				items: t.items,
				pos: i,
				onClose: n,
				theme: r
			})
		})]
	});
}
function Wt() {
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
function Gt({ tabs: e, value: t, onChange: n, className: r, size: i = "md", variant: a = "underline" }) {
	let o = (e) => e === t, s = i === "sm" ? 14 : 16, c = g(a === "underline" && "flex gap-1 border-b border-border overflow-x-auto overflow-y-hidden", a === "pills" && "flex gap-1", a === "stretched" && "flex border-b border-border", r), l = (e) => g("flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors", i === "sm" && "px-3 py-1.5 text-xs", i === "md" && "px-4 py-2 text-sm", (a === "underline" || a === "stretched") && "-mb-px border-b-2", (a === "underline" || a === "stretched") && o(e) && "border-primary text-primary", (a === "underline" || a === "stretched") && !o(e) && "border-transparent text-text-secondary hover:text-text-primary", a === "stretched" && "flex-1 justify-center", a === "pills" && "rounded-full", a === "pills" && o(e) && "bg-primary-light text-primary", a === "pills" && !o(e) && "text-text-secondary hover:bg-surface-2");
	return /* @__PURE__ */ m("div", {
		className: c,
		role: "tablist",
		children: e.map((e) => {
			let t = e.icon;
			return /* @__PURE__ */ h("button", {
				type: "button",
				role: "tab",
				"aria-selected": o(e.id),
				onClick: () => n(e.id),
				className: l(e.id),
				children: [
					t && /* @__PURE__ */ m(t, { size: s }),
					e.label,
					e.badge !== void 0 && /* @__PURE__ */ m("span", {
						className: g("rounded-full text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1", o(e.id) ? "bg-primary text-white" : "bg-surface-3 text-text-secondary"),
						children: e.badge
					})
				]
			}, e.id);
		})
	});
}
//#endregion
//#region ../../src/ui/Accordion.tsx
function Kt({ items: t, defaultOpen: n = [], open: r, onOpenChange: i, single: a = !1, className: o, size: s = "md" }) {
	let c = r !== void 0, [l, u] = e.useState(n), d = c ? r : l, f = (e, t) => {
		let n = e.includes(t);
		return a ? n ? [] : [t] : n ? e.filter((e) => e !== t) : [...e, t];
	}, p = (e) => {
		c ? i?.(f(r, e)) : (u((t) => f(t, e)), i?.(f(d, e)));
	}, _ = s === "sm" ? "px-3 py-2" : "px-4 py-3";
	return /* @__PURE__ */ m("div", {
		className: g("flex flex-col gap-2", o),
		children: t.map((e) => {
			let t = d.includes(e.id), n = e.icon;
			return /* @__PURE__ */ h("div", {
				className: "rounded-xl border border-border bg-surface-0 overflow-hidden",
				children: [/* @__PURE__ */ h("button", {
					type: "button",
					disabled: e.disabled,
					"aria-expanded": t,
					onClick: () => !e.disabled && p(e.id),
					className: g("flex w-full items-center gap-3 text-left transition-colors", _, e.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-surface-2"),
					children: [
						n && /* @__PURE__ */ m(n, {
							size: 16,
							className: "shrink-0 text-text-secondary"
						}),
						/* @__PURE__ */ m("span", {
							className: "flex-1 min-w-0 text-xs font-semibold uppercase tracking-wide text-text-secondary truncate",
							children: e.title
						}),
						e.badge !== void 0 && /* @__PURE__ */ m("span", {
							className: "rounded-full bg-surface-3 text-text-secondary text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1",
							children: e.badge
						}),
						/* @__PURE__ */ m(S, {
							size: 16,
							className: g("shrink-0 text-text-tertiary transition-transform duration-200", t && "rotate-180")
						})
					]
				}), /* @__PURE__ */ m("div", {
					className: "grid transition-[grid-template-rows] duration-200 ease-out",
					style: { gridTemplateRows: t ? "1fr" : "0fr" },
					children: /* @__PURE__ */ m("div", {
						className: "overflow-hidden",
						children: /* @__PURE__ */ m("div", {
							className: g(s === "sm" ? "px-3 pb-3" : "px-4 pb-4", "pt-1 border-t border-border"),
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
function qt({ position: e, onResize: t, min: n = 160, max: r = 560, onReset: i, title: a }) {
	return /* @__PURE__ */ h("div", {
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
		children: [/* @__PURE__ */ m("div", { className: "absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/40 transition-colors" }), /* @__PURE__ */ m("div", {
			className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center\n                      h-9 w-3.5 rounded-full bg-surface-0 border border-border text-text-tertiary shadow-sm\n                      opacity-80 group-hover:opacity-100 group-hover:bg-primary-light group-hover:text-primary\n                      group-hover:border-primary/40 transition",
			children: /* @__PURE__ */ m(A, { size: 13 })
		})]
	});
}
function Jt(e, t, n = 160, r = 560) {
	let [i, a] = d(() => {
		let i = Number(localStorage.getItem(e));
		return i >= n && i <= r ? i : t;
	});
	return o(() => {
		try {
			localStorage.setItem(e, String(i));
		} catch {}
	}, [e, i]), [i, a];
}
//#endregion
//#region ../../src/ui/StartPage.tsx
var Yt = "kubuno.startpage.recentW", Xt = 180, Zt = 520, Qt = 256;
function $t({ recentTitle: e = "Récents", recentIcon: t, recentItems: n, recentEmpty: r, tabs: i, defaultTab: a, activeTab: o, onTabChange: s }) {
	let [c, l] = d(a ?? i[0]?.id ?? ""), u = o ?? c, [f, g] = Jt(Yt, Qt, Xt, Zt), _ = (e) => {
		s?.(e), o === void 0 && l(e);
	}, v = i.map((e) => ({
		id: e.id,
		label: e.label
	})), y = i.find((e) => e.id === u) ?? i[0], [b, x] = d(null), S = (e, t) => {
		!t.actions || t.actions.length === 0 || (e.preventDefault(), x({
			x: Math.min(e.clientX, window.innerWidth - 200),
			y: Math.min(e.clientY, window.innerHeight - (t.actions.length * 36 + 16)),
			actions: t.actions
		}));
	};
	return /* @__PURE__ */ h("div", {
		className: "relative flex h-full overflow-hidden bg-white",
		children: [
			/* @__PURE__ */ h("aside", {
				className: "hidden lg:flex flex-shrink-0 bg-surface-1 flex-col overflow-hidden",
				style: { width: f },
				children: [/* @__PURE__ */ h("div", {
					className: "px-4 h-[57px] flex items-center gap-2 border-b border-border flex-shrink-0",
					children: [/* @__PURE__ */ m("span", {
						className: "text-text-tertiary flex-shrink-0",
						children: t ?? /* @__PURE__ */ m(D, { size: 15 })
					}), /* @__PURE__ */ m("span", {
						className: "text-sm font-medium text-text-primary",
						children: e
					})]
				}), n.length === 0 ? /* @__PURE__ */ m("div", {
					className: "flex-1 flex items-center justify-center px-4 text-center",
					children: r ?? /* @__PURE__ */ m("p", {
						className: "text-text-tertiary text-xs",
						children: "—"
					})
				}) : /* @__PURE__ */ m("div", {
					className: "flex-1 overflow-y-auto py-1",
					children: n.map((e) => /* @__PURE__ */ h("button", {
						onClick: e.onClick,
						onContextMenu: (t) => S(t, e),
						className: `w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${e.pendingTone ? "pointer-events-none" : "hover:bg-surface-2"}`,
						style: e.pendingTone ? { backgroundColor: e.pendingTone === "permanent" ? "#fee2e2" : "#f3e8ff" } : void 0,
						children: [e.icon && /* @__PURE__ */ m("span", {
							className: "flex-shrink-0",
							children: e.icon
						}), /* @__PURE__ */ h("span", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ m("span", {
								className: "block text-sm text-text-primary truncate",
								title: e.name,
								children: e.name
							}), e.subtitle && /* @__PURE__ */ m("span", {
								className: "block text-[11px] text-text-tertiary",
								children: e.subtitle
							})]
						})]
					}, e.id))
				})]
			}),
			/* @__PURE__ */ m("div", {
				className: "hidden lg:block",
				children: /* @__PURE__ */ m(qt, {
					position: f,
					onResize: g,
					min: Xt,
					max: Zt,
					onReset: () => g(Qt),
					title: e
				})
			}),
			/* @__PURE__ */ h("div", {
				className: "flex-1 min-w-0 flex flex-col overflow-hidden",
				children: [/* @__PURE__ */ m("div", {
					className: "px-6 h-[57px] flex items-center flex-shrink-0 border-b border-border",
					children: /* @__PURE__ */ m(Gt, {
						tabs: v,
						value: u,
						onChange: _
					})
				}), /* @__PURE__ */ m("div", {
					className: "flex-1 min-h-0 overflow-hidden flex flex-col",
					children: y?.content
				})]
			}),
			b && /* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m("div", {
				className: "fixed inset-0 z-[9998]",
				onClick: () => x(null),
				onContextMenu: (e) => {
					e.preventDefault(), x(null);
				}
			}), /* @__PURE__ */ m("div", {
				className: "fixed z-[9999] min-w-[190px] bg-white border border-border rounded-lg shadow-lg py-1",
				style: {
					top: b.y,
					left: b.x
				},
				children: b.actions.map((e) => /* @__PURE__ */ h("button", {
					onClick: () => {
						x(null), e.onClick();
					},
					className: `w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                  ${e.danger ? "text-danger hover:bg-danger/10" : "text-text-primary hover:bg-surface-1"}`,
					children: [e.icon && /* @__PURE__ */ m("span", {
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
function en({ size: e = 24, className: t, title: n = "Kubuno" }) {
	return /* @__PURE__ */ h("svg", {
		width: Math.round(e * 321 / 346),
		height: e,
		viewBox: "0 0 321 346",
		fill: "currentColor",
		role: "img",
		"aria-label": n,
		className: t,
		children: [/* @__PURE__ */ m("title", { children: n }), /* @__PURE__ */ h("g", {
			transform: "translate(0,346) scale(0.1,-0.1)",
			stroke: "none",
			children: [
				/* @__PURE__ */ m("path", { d: "M264 3307 c-3 -8 -3 -434 -1 -948 3 -913 3 -936 24 -1009 70 -249 198 -454 419 -672 125 -123 303 -268 328 -268 3 0 5 654 4 1452 l-3 1453 -383 3 c-313 2 -383 0 -388 -11z" }),
				/* @__PURE__ */ m("path", { d: "M1187 3313 c-4 -3 -7 -680 -7 -1504 l0 -1498 27 -19 c38 -27 279 -165 354 -202 l61 -31 61 32 c34 17 87 47 118 65 31 19 60 34 64 34 3 0 26 14 51 30 l44 31 0 729 c0 608 2 731 14 742 7 7 112 110 233 228 120 118 343 336 496 484 l277 269 -2 306 -3 306 -204 3 -203 2 -87 -83 c-47 -47 -151 -147 -231 -225 l-145 -140 -5 -299 -5 -299 -60 -62 c-32 -34 -63 -62 -67 -62 -4 0 -9 262 -10 583 l-3 582 -381 3 c-209 1 -383 -1 -387 -5z" }),
				/* @__PURE__ */ m("path", { d: "M2217 1782 l-118 -117 1 -265 2 -265 225 -225 224 -225 61 64 c133 140 264 349 319 508 l20 58 -143 138 c-294 284 -459 442 -466 444 -4 1 -60 -51 -125 -115z" })
			]
		})]
	});
}
//#endregion
//#region ../../src/ui/LabelIcon.tsx
var tn = 596.432 / 363.452;
function nn({ size: e = 24, className: t, style: n, title: r }) {
	return /* @__PURE__ */ h("svg", {
		width: Math.round(e * tn * 100) / 100,
		height: e,
		viewBox: "767.938 486.862 596.432 363.452",
		fill: "currentColor",
		fillRule: "evenodd",
		role: r ? "img" : "presentation",
		"aria-label": r,
		"aria-hidden": r ? void 0 : !0,
		className: t,
		style: n,
		children: [r ? /* @__PURE__ */ m("title", { children: r }) : null, /* @__PURE__ */ m("path", { d: "M 768.043 532.379 C 768.038 531.247 768.032 530.114 768.022 528.982 C 768.092 516.215 773.502 503.855 782.953 495.248 C 790.446 490.278 799.172 486.948 808.246 486.943 C 933.616 486.943 1058.987 487.154 1184.356 486.862 C 1204.994 486.939 1226 494.556 1239.253 510.908 C 1278.229 553.311 1313.462 599.023 1353.231 640.714 C 1362.194 650.714 1366.005 664.389 1363.723 677.601 C 1361.66 684.459 1358.251 690.999 1353.193 696.128 C 1316.095 738.242 1277.805 779.332 1242.223 822.758 C 1227.039 841.321 1203.692 850.288 1180.063 850.239 C 1057.966 850.239 935.868 850.03 813.771 850.315 C 799.369 850.259 784.332 845.812 775.393 833.828 C 771.05 826.781 768.313 818.676 768.303 810.349 C 767.818 717.693 767.914 625.036 768.043 532.379 Z M 1276.456 668.588 A 41.516 41.516 0 1 1 1193.425 668.588 A 41.516 41.516 0 1 1 1276.456 668.588 Z" })]
	});
}
//#endregion
//#region ../../src/ui/color.ts
function Z(e) {
	return [
		parseInt(e.slice(1, 3), 16),
		parseInt(e.slice(3, 5), 16),
		parseInt(e.slice(5, 7), 16)
	];
}
function rn(e, t, n) {
	return "#" + [
		e,
		t,
		n
	].map((e) => Math.max(0, Math.min(255, Math.round(e))).toString(16).padStart(2, "0")).join("");
}
function an(e, t, n) {
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
function on(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function sn(e, t, n) {
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
		on(i, r, e + 1 / 3) * 255,
		on(i, r, e) * 255,
		on(i, r, e - 1 / 3) * 255
	];
}
function cn(e, t, n) {
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
function ln(e, t, n) {
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
var un = {
	accent: "#5a9bdc",
	border: "#212121",
	text: "#d6d6d6",
	textDim: "#8e8e8e",
	toolbar: "#393939",
	surface: "#252525",
	title: "#c0c0c0"
}, dn = {
	accent: "#1a73e8",
	border: "#dadce0",
	text: "#202124",
	textDim: "#5f6368",
	toolbar: "#ffffff",
	surface: "#f1f3f4",
	title: "#5f6368"
};
function fn(e, t) {
	return typeof window > "u" ? t : getComputedStyle(document.documentElement).getPropertyValue(e).trim() || t;
}
function pn() {
	return {
		accent: fn("--color-primary", "#1a73e8"),
		border: fn("--color-border", "#dadce0"),
		text: fn("--color-text-primary", "#202124"),
		textDim: fn("--color-text-secondary", "#5f6368"),
		toolbar: fn("--color-surface-0", "#ffffff"),
		surface: fn("--color-surface-2", "#f1f3f4"),
		title: fn("--color-text-secondary", "#5f6368")
	};
}
function mn() {
	let [e, t] = d(pn);
	return o(() => {
		let e = new MutationObserver(() => t(pn()));
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
var hn = {
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
function gn(e, t, n, r) {
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
var _n = {
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
function vn({ scheme: e, size: t = 20, color: n = "currentColor" }) {
	let r = t / 2, i = t / 2 - 3, a = Math.max(1.6, t * .095), o = (e === "analog" ? [
		-48,
		0,
		48
	] : _n[e]).map((e) => [r + i * Math.sin(e * Math.PI / 180), r - i * Math.cos(e * Math.PI / 180)]), s = o.map(([e, t]) => `${e.toFixed(1)},${t.toFixed(1)}`).join(" ");
	return /* @__PURE__ */ h("svg", {
		width: t,
		height: t,
		viewBox: `0 0 ${t} ${t}`,
		fill: "none",
		strokeLinejoin: "round",
		strokeLinecap: "round",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ m("circle", {
			cx: r,
			cy: r,
			r: i,
			stroke: n,
			strokeOpacity: .3,
			strokeWidth: 1
		}), e === "mono" ? /* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m("line", {
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
		].map((e, t) => /* @__PURE__ */ m("circle", {
			cx: r,
			cy: r - i * e,
			r: t === 3 ? a * 1.25 : a,
			fill: n,
			fillOpacity: .45 + .18 * (t + 1)
		}, t))] }) : /* @__PURE__ */ h(p, { children: [o.length === 2 ? /* @__PURE__ */ m("line", {
			x1: o[0][0],
			y1: o[0][1],
			x2: o[1][0],
			y2: o[1][1],
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2
		}) : e === "analog" ? /* @__PURE__ */ m("path", {
			d: `M${o[0][0].toFixed(1)},${o[0][1].toFixed(1)} A${i},${i} 0 0 1 ${o[2][0].toFixed(1)},${o[2][1].toFixed(1)}`,
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2,
			fill: "none"
		}) : /* @__PURE__ */ m("polygon", {
			points: s,
			stroke: n,
			strokeOpacity: .55,
			strokeWidth: 1.2,
			fill: n,
			fillOpacity: .14
		}), o.map(([e, t], r) => /* @__PURE__ */ m("circle", {
			cx: e,
			cy: t,
			r: r === 0 ? a * 1.3 : a,
			fill: n
		}, r))] })]
	});
}
function yn({ size: e, h: t, s: n, v: r, shape: i, onChange: a }) {
	let s = u(null), c = u(!1), l = e / 2 - 1, d = e / 2, f = e / 2, p = .8660254, g = {
		w: [d, f - l],
		blk: [d - l * p, f + l * .5],
		hue: [d + l * p, f + l * .5]
	}, _ = (e, t, n, r, i) => {
		let a = (r[1] - i[1]) * (n[0] - i[0]) + (i[0] - r[0]) * (n[1] - i[1]), o = ((r[1] - i[1]) * (e - i[0]) + (i[0] - r[0]) * (t - i[1])) / a, s = ((i[1] - n[1]) * (e - i[0]) + (n[0] - i[0]) * (t - i[1])) / a;
		return [
			o,
			s,
			1 - o - s
		];
	}, v = () => {
		if (i === "triangle") {
			let e = 1 - r, t = n * r, i = (1 - n) * r;
			return [i * g.w[0] + t * g.hue[0] + e * g.blk[0], i * g.w[1] + t * g.hue[1] + e * g.blk[1]];
		}
		let t = n * e, a = (1 - r) * e;
		if (i === "circle") {
			let n = e / 2, r = e / 2, i = e / 2, o = t - n, s = a - r, c = Math.hypot(o, s);
			c > i && (o *= i / c, s *= i / c, t = n + o, a = r + s);
		}
		return [t, a];
	};
	o(() => {
		let n = s.current;
		if (!n) return;
		let r = n.getContext("2d"), a = Math.round(e * 3);
		n.width = a, n.height = a;
		let o = r.createImageData(a, a), c = o.data, l = a / 2, u = [g.w[0] * 3, g.w[1] * 3], d = [g.hue[0] * 3, g.hue[1] * 3], f = [g.blk[0] * 3, g.blk[1] * 3];
		for (let e = 0; e < a; e++) for (let n = 0; n < a; n++) {
			let r = 0, o = 0, s = !0;
			if (i === "triangle") {
				let [t, i, a] = _(n + .5, e + .5, u, d, f);
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
			let [m, h, g] = Q(t, r, o);
			c[p] = m, c[p + 1] = h, c[p + 2] = g, c[p + 3] = 255;
		}
		r.putImageData(o, 0, 0);
	}, [
		t,
		i,
		e
	]);
	let y = (t) => {
		let n = s.current;
		if (!n) return;
		let r = n.getBoundingClientRect(), o = t.clientX - r.left, c = t.clientY - r.top;
		if (i === "triangle") {
			let [e, t, n] = _(o, c, g.w, g.hue, g.blk);
			e = Math.max(0, e), t = Math.max(0, t), n = Math.max(0, n);
			let r = e + t + n || 1;
			e /= r, t /= r, n /= r;
			let i = 1 - n;
			a(e + t > 0 ? t / (e + t) : 0, i);
			return;
		}
		if (i === "circle") {
			let t = e / 2, n = e / 2, r = e / 2, i = o - t, a = c - n, s = Math.hypot(i, a);
			s > r && (o = t + i * r / s, c = n + a * r / s);
		}
		a(Math.max(0, Math.min(1, o / e)), Math.max(0, Math.min(1, 1 - c / e)));
	};
	o(() => {
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
	return /* @__PURE__ */ h("div", {
		className: "absolute",
		style: {
			left: (212 - e) / 2,
			top: (212 - e) / 2,
			width: e,
			height: e
		},
		children: [/* @__PURE__ */ m("canvas", {
			ref: s,
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
		}), /* @__PURE__ */ m("div", {
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
function bn({ label: e, value: t, max: n, track: r, onInput: i, C: a }) {
	let s = u(null), c = u(!1), l = (e) => {
		let t = s.current;
		if (!t) return;
		let r = t.getBoundingClientRect();
		i(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * n);
	};
	return o(() => {
		let e = (e) => {
			c.current && l(e);
		}, t = () => {
			c.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	}), /* @__PURE__ */ h("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ m("span", {
				className: "text-[10px] w-3 text-center",
				style: { color: a.textDim },
				children: e
			}),
			/* @__PURE__ */ m("div", {
				ref: s,
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
				children: /* @__PURE__ */ m("div", {
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
			/* @__PURE__ */ m("input", {
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
function xn({ t: e, color: t, onChange: n, onClose: r, C: i = un, history: a = [], onPickHistory: s, onConfirm: c, onCancel: l, confirmLabel: f, cancelLabel: p, leftTools: g = [] }) {
	let _ = {
		...un,
		...i
	}, v = (t) => e ? e(t) : hn[t] ?? t, [y, b, x] = Z(t), [S, C, w] = cn(y, b, x), [T, D] = d(S), [O, k] = d(C), [A, j] = d(w), [M, N] = d("RGB"), [P, F] = d("square"), [I, te] = d("comp");
	o(() => {
		let [e, n, r] = Z(t);
		if (rn(...Q(T, O, A)).toLowerCase() !== t.toLowerCase()) {
			let [t, i, a] = cn(e, n, r);
			D(t), k(i), j(a);
		}
	}, [t]);
	let R = (e, t, r) => {
		D(e), k(t), j(r), n(rn(...Q(e, t, r)));
	}, z = (e, t, n) => {
		let [r, i, a] = cn(e, t, n);
		R(r, i, a);
	}, V = typeof window < "u" && "EyeDropper" in window, ne = async () => {
		let e = window.EyeDropper;
		if (e) try {
			let [t, n, r] = Z((await new e().open()).sRGBHex);
			z(t, n, r);
		} catch {}
	}, H = u(null), re = u(!1), U = (e) => {
		let t = H.current;
		if (!t) return;
		let n = t.getBoundingClientRect(), r = e.clientX - n.left - n.width / 2, i = e.clientY - n.top - n.height / 2, a = Math.atan2(r, -i) * 180 / Math.PI;
		a = (a + 360) % 360, R(a, O, A);
	};
	o(() => {
		let e = (e) => {
			re.current && U(e);
		}, t = () => {
			re.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let [W, G, K] = Q(T, O, A).map(Math.round), ie = rn(...Q(T, 1, 1)), q = rn(W, G, K), ae = T * Math.PI / 180, oe = 212 / 2 + 95 * Math.sin(ae), se = 212 / 2 - 95 * Math.cos(ae), ce = Math.round(156 / Math.SQRT2), le = P === "square" ? ce : 162, ue = gn(I, T, O, A), J = (e, t, n) => rn(Math.round(e), Math.round(t), Math.round(n)), de = [];
	if (M === "RGB") de = [
		{
			l: "R",
			val: W,
			max: 255,
			track: `linear-gradient(to right,${J(0, G, K)},${J(255, G, K)})`,
			set: (e) => z(e, G, K)
		},
		{
			l: "G",
			val: G,
			max: 255,
			track: `linear-gradient(to right,${J(W, 0, K)},${J(W, 255, K)})`,
			set: (e) => z(W, e, K)
		},
		{
			l: "B",
			val: K,
			max: 255,
			track: `linear-gradient(to right,${J(W, G, 0)},${J(W, G, 255)})`,
			set: (e) => z(W, G, e)
		}
	];
	else if (M === "HSV") de = [
		{
			l: "H",
			val: T,
			max: 360,
			track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
			set: (e) => R(e, O, A)
		},
		{
			l: "S",
			val: O * 100,
			max: 100,
			track: `linear-gradient(to right,${J(...Q(T, 0, A))},${J(...Q(T, 1, A))})`,
			set: (e) => R(T, e / 100, A)
		},
		{
			l: "V",
			val: A * 100,
			max: 100,
			track: `linear-gradient(to right,#000,${J(...Q(T, O, 1))})`,
			set: (e) => R(T, O, e / 100)
		}
	];
	else if (M === "HSL") {
		let [e, t, n] = an(W, G, K);
		de = [
			{
				l: "H",
				val: e,
				max: 360,
				track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
				set: (e) => z(...sn(e, t, n))
			},
			{
				l: "S",
				val: t * 100,
				max: 100,
				track: `linear-gradient(to right,${J(...sn(e, 0, n))},${J(...sn(e, 1, n))})`,
				set: (t) => z(...sn(e, t / 100, n))
			},
			{
				l: "L",
				val: n * 100,
				max: 100,
				track: `linear-gradient(to right,#000,${J(...sn(e, t, .5))},#fff)`,
				set: (n) => z(...sn(e, t, n / 100))
			}
		];
	} else if (M === "CMYK") {
		let [e, t, n, r] = ln(W, G, K);
		de = [
			{
				l: "C",
				val: e,
				max: 100,
				track: `linear-gradient(to right,${J(...$(0, t, n, r))},${J(...$(100, t, n, r))})`,
				set: (e) => z(...$(e, t, n, r))
			},
			{
				l: "M",
				val: t,
				max: 100,
				track: `linear-gradient(to right,${J(...$(e, 0, n, r))},${J(...$(e, 100, n, r))})`,
				set: (t) => z(...$(e, t, n, r))
			},
			{
				l: "Y",
				val: n,
				max: 100,
				track: `linear-gradient(to right,${J(...$(e, t, 0, r))},${J(...$(e, t, 100, r))})`,
				set: (n) => z(...$(e, t, n, r))
			},
			{
				l: "K",
				val: r,
				max: 100,
				track: `linear-gradient(to right,${J(...$(e, t, n, 0))},#000)`,
				set: (r) => z(...$(e, t, n, r))
			}
		];
	} else de = [{
		l: "K",
		val: Math.round((W + G + K) / 3) / 255 * 100,
		max: 100,
		track: "linear-gradient(to right,#000,#fff)",
		set: (e) => {
			let t = Math.round(e / 100 * 255);
			z(t, t, t);
		}
	}];
	return /* @__PURE__ */ h("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 312,
			background: _.toolbar,
			border: `1px solid ${_.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ h("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ m("span", {
					className: "text-[10px] font-medium",
					style: { color: _.title },
					children: v("layer_color_picker")
				}), /* @__PURE__ */ m("button", {
					onClick: r,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: _.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ h("div", {
				className: "flex items-start gap-1.5 justify-center",
				children: [
					/* @__PURE__ */ h("div", {
						className: "flex flex-col gap-1",
						style: { height: 212 },
						children: [
							[
								"square",
								"triangle",
								"circle"
							].map((e) => {
								let t = P === e;
								return /* @__PURE__ */ m("button", {
									onClick: () => F(e),
									title: e,
									"aria-pressed": t,
									className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
									style: {
										background: t ? _.accent : _.surface,
										color: t ? "#fff" : _.textDim,
										border: `1px solid ${t ? _.accent : _.border}`
									},
									children: m(e === "square" ? L : e === "triangle" ? B : E, { size: 15 })
								}, e);
							}),
							V && /* @__PURE__ */ m("button", {
								onClick: ne,
								title: v("layer_color_eyedropper"),
								"aria-label": v("layer_color_eyedropper"),
								className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
								style: {
									background: _.surface,
									color: _.textDim,
									border: `1px solid ${_.border}`
								},
								onMouseEnter: (e) => {
									e.currentTarget.style.color = _.accent, e.currentTarget.style.borderColor = _.accent;
								},
								onMouseLeave: (e) => {
									e.currentTarget.style.color = _.textDim, e.currentTarget.style.borderColor = _.border;
								},
								children: /* @__PURE__ */ m(ee, { size: 14 })
							}),
							g.map((e) => /* @__PURE__ */ m("button", {
								onClick: e.onClick,
								title: e.title,
								"aria-label": e.title,
								"aria-pressed": e.active ?? void 0,
								className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
								style: {
									background: e.active ? _.accent : _.surface,
									color: e.active ? "#fff" : _.textDim,
									border: `1px solid ${e.active ? _.accent : _.border}`
								},
								children: e.icon
							}, e.id))
						]
					}),
					/* @__PURE__ */ h("div", {
						className: "relative",
						style: {
							width: 212,
							height: 212
						},
						children: [
							/* @__PURE__ */ m("div", {
								ref: H,
								tabIndex: 0,
								role: "slider",
								"aria-label": v("layer_color_picker"),
								"aria-valuemin": 0,
								"aria-valuemax": 360,
								"aria-valuenow": Math.round(T),
								onPointerDown: (e) => {
									re.current = !0, U(e);
								},
								onKeyDown: (e) => {
									let t = e.shiftKey ? 10 : 1;
									if (e.key === "ArrowLeft" || e.key === "ArrowDown") R((T - t + 360) % 360, O, A);
									else if (e.key === "ArrowRight" || e.key === "ArrowUp") R((T + t) % 360, O, A);
									else return;
									e.preventDefault();
								},
								className: "absolute inset-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
								style: { background: "conic-gradient(#f00 0deg,#ff0 60deg,#0f0 120deg,#0ff 180deg,#00f 240deg,#f0f 300deg,#f00 360deg)" }
							}),
							/* @__PURE__ */ m("div", {
								className: "absolute rounded-full",
								style: {
									inset: 22,
									background: _.toolbar
								}
							}),
							/* @__PURE__ */ m("div", {
								className: "absolute rounded-full pointer-events-none",
								style: {
									width: 14,
									height: 14,
									border: "2px solid #fff",
									boxShadow: "0 0 0 1px rgba(0,0,0,.6)",
									background: ie,
									left: oe - 7,
									top: se - 7
								}
							}),
							ue.slice(1).map((e, t) => {
								let n = e[0] * Math.PI / 180, r = 212 / 2 + 95 * Math.sin(n), i = 212 / 2 - 95 * Math.cos(n);
								return /* @__PURE__ */ m("div", {
									className: "absolute rounded-full pointer-events-none",
									style: {
										width: 10,
										height: 10,
										border: "2px solid rgba(255,255,255,.85)",
										background: rn(...Q(e[0], e[1], e[2])),
										left: r - 5,
										top: i - 5
									}
								}, t);
							}),
							/* @__PURE__ */ m(yn, {
								size: le,
								h: T,
								s: O,
								v: A,
								shape: P,
								onChange: (e, t) => R(T, e, t)
							})
						]
					}),
					/* @__PURE__ */ m("div", {
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
							return /* @__PURE__ */ m("button", {
								onClick: () => te(e.key),
								title: v(e.label),
								"aria-label": v(e.label),
								"aria-pressed": t,
								className: "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
								style: {
									background: t ? _.accent : _.surface,
									color: t ? "#fff" : _.textDim,
									border: `1px solid ${t ? _.accent : _.border}`
								},
								children: /* @__PURE__ */ m(vn, {
									scheme: e.key,
									size: 20
								})
							}, e.key);
						})
					})
				]
			}),
			/* @__PURE__ */ m("div", {
				className: "flex gap-1 mt-2.5",
				children: ue.map((e, t) => {
					let n = rn(...Q(e[0], e[1], e[2]));
					return /* @__PURE__ */ m("button", {
						onClick: () => R(e[0], e[1], e[2]),
						title: n,
						className: "flex-1 h-6",
						style: {
							background: n,
							borderRadius: 3,
							border: `1px solid ${_.border}`
						}
					}, t);
				})
			}),
			/* @__PURE__ */ h("div", {
				className: "flex items-center gap-2 mt-2",
				children: [
					/* @__PURE__ */ m("div", { style: {
						width: 28,
						height: 24,
						background: q,
						border: `1px solid ${_.border}`,
						borderRadius: 2,
						flexShrink: 0
					} }),
					/* @__PURE__ */ m("span", {
						className: "text-[10px]",
						style: { color: _.textDim },
						children: "#"
					}),
					/* @__PURE__ */ m("input", {
						value: q.replace("#", "").toUpperCase(),
						onChange: (e) => {
							let t = e.target.value.trim().replace(/^#/, "");
							if (/^[0-9a-fA-F]{3}$/.test(t) && (t = t.split("").map((e) => e + e).join("")), /^[0-9a-fA-F]{6}$/.test(t)) {
								let [e, n, r] = Z("#" + t);
								z(e, n, r);
							}
						},
						className: "flex-1 h-6 text-[11px] px-2 outline-none font-mono uppercase",
						style: {
							background: _.surface,
							border: `1px solid ${_.border}`,
							color: _.text,
							borderRadius: 2
						}
					})
				]
			}),
			/* @__PURE__ */ m("div", {
				className: "flex mt-2.5 mb-1.5",
				style: { borderBottom: `1px solid ${_.border}` },
				children: [
					"RGB",
					"HSV",
					"HSL",
					"CMYK",
					"GRAY"
				].map((e) => /* @__PURE__ */ m("button", {
					onClick: () => N(e),
					className: "px-1.5 py-0.5 text-[9px] font-medium",
					style: {
						color: M === e ? _.accent : _.textDim,
						borderBottom: M === e ? `2px solid ${_.accent}` : "2px solid transparent"
					},
					children: e
				}, e))
			}),
			/* @__PURE__ */ m("div", {
				className: "space-y-1.5",
				children: de.map((e) => /* @__PURE__ */ m(bn, {
					label: e.l,
					value: e.val,
					max: e.max,
					track: e.track,
					onInput: e.set,
					C: _
				}, e.l))
			}),
			/* @__PURE__ */ m("div", {
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
				].map((e) => /* @__PURE__ */ m("button", {
					onClick: () => {
						let [t, n, r] = Z(e);
						z(t, n, r);
					},
					title: e,
					style: {
						width: 16,
						height: 16,
						background: e,
						borderRadius: 2,
						border: `1px solid ${e.toLowerCase() === q.toLowerCase() ? _.accent : _.border}`
					}
				}, e))
			}),
			a.length > 0 && /* @__PURE__ */ h("div", {
				className: "mt-3 pt-2",
				style: { borderTop: `1px solid ${_.border}` },
				children: [/* @__PURE__ */ m("div", {
					className: "text-[9px] uppercase tracking-wide mb-1.5",
					style: { color: _.textDim },
					children: v("layer_color_recent")
				}), /* @__PURE__ */ m("div", {
					className: "grid gap-1",
					style: { gridTemplateColumns: "repeat(10, 1fr)" },
					children: a.slice(0, 30).map((e, t) => /* @__PURE__ */ m("button", {
						title: e,
						onClick: () => {
							let [t, n, r] = Z(e);
							z(t, n, r), s?.(e);
						},
						className: "aspect-square transition-transform hover:scale-110",
						style: {
							background: e,
							borderRadius: 3,
							border: `1px solid ${e.toLowerCase() === q.toLowerCase() ? _.accent : _.border}`,
							boxShadow: e.toLowerCase() === q.toLowerCase() ? `0 0 0 1px ${_.accent}` : "none"
						}
					}, e + t))
				})]
			}),
			(c || l) && /* @__PURE__ */ h("div", {
				className: "flex items-center justify-end gap-2 mt-3 pt-2.5",
				style: { borderTop: `1px solid ${_.border}` },
				children: [l && /* @__PURE__ */ m("button", {
					onClick: l,
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: _.text,
						background: "transparent",
						border: `1px solid ${_.border}`
					},
					children: p ?? v("layer_color_cancel")
				}), c && /* @__PURE__ */ m("button", {
					onClick: () => c(q),
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: "#fff",
						background: _.accent,
						border: `1px solid ${_.accent}`
					},
					children: f ?? v("layer_color_confirm")
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/ColorField.tsx
function Sn({ t: e, C: t, color: n, onChange: r, history: i, onPickHistory: a, className: s, style: l, width: f = 32, height: g = 24, leftTools: _ }) {
	let v = mn(), y = t ?? v, [b, x] = d(!1), S = u(null), C = u(null), [w, T] = d(null), E = () => {
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
	return c(() => {
		if (!b) {
			T(null);
			return;
		}
		E();
	}, [b]), o(() => {
		if (!b) return;
		let e = () => E();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [b]), /* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m("button", {
		ref: S,
		type: "button",
		onClick: () => x((e) => !e),
		className: s,
		style: {
			width: f,
			height: g,
			background: n,
			border: `1px solid ${b ? y.accent : y.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...l
		}
	}), b && H(/* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => x(!1)
	}), /* @__PURE__ */ m("div", {
		ref: C,
		className: "fixed",
		style: {
			left: w?.left ?? 0,
			top: w?.top ?? 0,
			zIndex: 200,
			visibility: w ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ m(xn, {
			t: e,
			C: y,
			color: n,
			onChange: r,
			onClose: () => x(!1),
			history: i,
			onPickHistory: a,
			leftTools: _
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/ColorSwatchPicker.tsx
var Cn = "kubuno:picker:custom-swatches";
function wn() {
	if (typeof localStorage > "u") return [];
	try {
		let e = JSON.parse(localStorage.getItem(Cn) || "[]");
		return Array.isArray(e) ? e.slice(0, 20) : [];
	} catch {
		return [];
	}
}
var Tn = /* @__PURE__ */ "#000000.#434343.#666666.#999999.#b7b7b7.#cccccc.#d9d9d9.#efefef.#f3f3f3.#ffffff.#980000.#ff0000.#ff9900.#ffff00.#00ff00.#00ffff.#4a86e8.#0000ff.#9900ff.#ff00ff.#e6b8af.#f4cccc.#fce5cd.#fff2cc.#d9ead3.#d0e0e3.#c9daf8.#cfe2f3.#d9d2e9.#ead1dc.#dd7e6b.#ea9999.#f9cb9c.#ffe599.#b6d7a8.#a2c4c9.#a4c2f4.#9fc5e8.#b4a7d6.#d5a6bd.#cc4125.#e06666.#f6b26b.#ffd966.#93c47d.#76a5af.#6d9eeb.#6fa8dc.#8e7cc3.#c27ba0.#a61c00.#cc0000.#e69138.#f1c232.#6aa84f.#45818e.#3c78d8.#3d85c6.#674ea7.#a64d79.#85200c.#990000.#b45f06.#bf9000.#38761d.#134f5c.#1155cc.#0b5394.#351c75.#741b47.#5b0f00.#660000.#783f04.#7f6000.#274e13.#0c343d.#1c4587.#073763.#20124d.#4c1130".split(".");
function En({ color: e, onChange: t, onClose: n, t: r, theme: i, customLabel: a = "Personnalisé", confirmLabel: o, cancelLabel: s }) {
	let c = mn(), l = i ?? c, [u, f] = d(!1), [p, g] = d(e), [_, v] = d(wn), y = (e) => v((t) => {
		let n = [e, ...t.filter((t) => t.toLowerCase() !== e.toLowerCase())].slice(0, 20);
		try {
			localStorage.setItem(Cn, JSON.stringify(n));
		} catch {}
		return n;
	}), b = o ?? (r ? r("color_add", { defaultValue: "Ajouter" }) : "Ajouter"), x = s ?? (r ? r("color_cancel", { defaultValue: "Annuler" }) : "Annuler");
	if (u) return /* @__PURE__ */ m(xn, {
		t: r,
		C: l,
		color: p,
		onChange: g,
		onClose: () => f(!1),
		confirmLabel: b,
		cancelLabel: x,
		onConfirm: (e) => {
			y(e), t(e), f(!1);
		},
		onCancel: () => f(!1)
	});
	let S = () => {
		g(e), f(!0);
	}, C = async () => {
		let e = window.EyeDropper;
		if (e) try {
			let r = await new e().open();
			y(r.sRGBHex), t(r.sRGBHex), n?.();
		} catch {}
	}, w = e.toLowerCase();
	return /* @__PURE__ */ h("div", {
		className: "p-3 rounded-lg shadow-lg border",
		style: {
			width: 232,
			background: l.toolbar,
			borderColor: l.border
		},
		children: [
			/* @__PURE__ */ m("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: Tn.map((e) => {
					let r = e.toLowerCase() === w;
					return /* @__PURE__ */ m("button", {
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
			/* @__PURE__ */ m("div", {
				className: "mt-3 mb-1 text-[11px] font-semibold uppercase tracking-wide",
				style: { color: l.title },
				children: a
			}),
			/* @__PURE__ */ h("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: [
					_.map((e) => /* @__PURE__ */ m("button", {
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
					/* @__PURE__ */ m("button", {
						onClick: S,
						title: a,
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: l.border,
							color: l.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = l.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ m(I, { size: 12 })
					}),
					typeof window < "u" && "EyeDropper" in window && /* @__PURE__ */ m("button", {
						onClick: C,
						title: "Pipette",
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: l.border,
							color: l.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = l.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ m(ee, { size: 11 })
					})
				]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/gradient.ts
function Dn(e, t = 100) {
	let [n, r, i] = Z(e);
	return `rgba(${n}, ${r}, ${i}, ${Math.max(0, Math.min(100, t)) / 100})`;
}
function On(e) {
	let t = [...e.stops].sort((e, t) => e.position - t.position).map((e) => `${Dn(e.color, e.opacity ?? 100)} ${Math.round(e.position * 100)}%`).join(", ");
	return e.type === "radial" ? `radial-gradient(circle, ${t})` : `linear-gradient(${Math.round(e.angle)}deg, ${t})`;
}
var kn = {
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
}, An = {
	gradient_linear: "Linéaire",
	gradient_radial: "Radial",
	gradient_angle: "Angle",
	gradient_position: "Position",
	gradient_opacity: "Opacité",
	gradient_add_stop: "Ajouter un arrêt"
};
function jn(e, t) {
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
	let i = n[r], a = n[r + 1], o = (t - i.position) / (a.position - i.position || 1), [s, c, l] = Z(i.color), [u, d, f] = Z(a.color);
	return {
		color: rn(s + (u - s) * o, c + (d - c) * o, l + (f - l) * o),
		position: t,
		opacity: Math.round(i.opacity + (a.opacity - i.opacity) * o)
	};
}
function Mn({ t: e, value: t, onChange: n, onClose: r, C: i }) {
	let a = mn(), s = i ?? a, c = (t) => e ? e(t) : An[t] ?? t, l = t ?? kn, [f, p] = d(0), g = u(null), _ = u(null), v = [...l.stops].map((e, t) => ({
		s: e,
		i: t
	})).sort((e, t) => e.s.position - t.s.position), y = l.stops[Math.min(f, l.stops.length - 1)] ?? l.stops[0], b = (e) => n({
		...l,
		...e
	}), x = (e, t) => b({ stops: l.stops.map((n, r) => r === e ? {
		...n,
		...t
	} : n) }), S = (e) => {
		let t = g.current;
		if (!t) return 0;
		let n = t.getBoundingClientRect();
		return Math.max(0, Math.min(1, (e - n.left) / n.width));
	};
	o(() => {
		let e = (e) => {
			_.current != null && x(_.current, { position: S(e.clientX) });
		}, t = () => {
			_.current = null;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let C = (e = .5) => {
		let t = jn(l.stops, e), r = [...l.stops, t];
		n({
			...l,
			stops: r
		}), p(r.length - 1);
	}, w = (e) => {
		l.stops.length <= 2 || (b({ stops: l.stops.filter((t, n) => n !== e) }), p(0));
	}, T = On(l);
	return /* @__PURE__ */ h("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 260,
			background: s.toolbar,
			border: `1px solid ${s.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ h("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ m("div", {
					className: "flex gap-1",
					children: ["linear", "radial"].map((e) => /* @__PURE__ */ m("button", {
						onClick: () => b({ type: e }),
						className: "px-2 py-0.5 text-[10px] font-medium",
						style: {
							borderRadius: 3,
							background: l.type === e ? s.accent : s.surface ?? "#2c2c2c",
							color: l.type === e ? "#fff" : s.textDim,
							border: `1px solid ${s.border}`
						},
						children: c(e === "linear" ? "gradient_linear" : "gradient_radial")
					}, e))
				}), r && /* @__PURE__ */ m("button", {
					onClick: r,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: s.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ h("div", {
				className: "relative mb-3",
				style: { height: 22 },
				children: [/* @__PURE__ */ m("div", {
					ref: g,
					onPointerDown: (e) => {
						C(S(e.clientX));
					},
					className: "absolute inset-0 cursor-copy",
					style: {
						borderRadius: 3,
						border: `1px solid ${s.border}`,
						backgroundImage: `${T}, repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%)`,
						backgroundSize: "auto, 10px 10px"
					}
				}), v.map(({ s: e, i: t }) => /* @__PURE__ */ m("div", {
					onPointerDown: (e) => {
						e.stopPropagation(), _.current = t, p(t);
					},
					title: `${Math.round(e.position * 100)}%`,
					className: "absolute -bottom-1 cursor-ew-resize",
					style: {
						left: `calc(${e.position * 100}% - 6px)`,
						width: 12,
						height: 12,
						background: e.color,
						borderRadius: 2,
						border: `2px solid ${t === f ? s.accent : "#fff"}`,
						boxShadow: "0 0 0 1px rgba(0,0,0,.5)"
					}
				}, t))]
			}),
			l.type === "linear" && /* @__PURE__ */ h("label", {
				className: "flex items-center gap-2 mb-2",
				children: [
					/* @__PURE__ */ m("span", {
						className: "text-[9px] uppercase flex-shrink-0",
						style: {
							color: s.textDim,
							width: 48
						},
						children: c("gradient_angle")
					}),
					/* @__PURE__ */ m(at, {
						min: 0,
						max: 360,
						className: "flex-1",
						value: l.angle,
						onChange: (e) => b({ angle: e }),
						accent: s.accent,
						trackColor: s.border,
						"aria-label": c("gradient_angle")
					}),
					/* @__PURE__ */ m("input", {
						type: "number",
						min: 0,
						max: 360,
						value: Math.round(l.angle),
						onChange: (e) => b({ angle: Math.max(0, Math.min(360, Number(e.target.value))) }),
						className: "w-14 px-1.5 py-0.5 text-[11px] outline-none",
						style: {
							background: s.surface,
							color: s.text,
							border: `1px solid ${s.border}`,
							borderRadius: 2
						}
					})
				]
			}),
			y && /* @__PURE__ */ h("div", {
				className: "flex flex-col gap-2 pt-2",
				style: { borderTop: `1px solid ${s.border}` },
				children: [/* @__PURE__ */ h("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ m(Sn, {
							t: e,
							C: s,
							width: 32,
							height: 24,
							className: "flex-shrink-0",
							color: y.color,
							onChange: (e) => x(l.stops.indexOf(y), { color: e })
						}),
						/* @__PURE__ */ h("label", {
							className: "flex items-center gap-1 flex-1",
							children: [/* @__PURE__ */ m("span", {
								className: "text-[9px] uppercase",
								style: { color: s.textDim },
								children: c("gradient_position")
							}), /* @__PURE__ */ m("input", {
								type: "number",
								min: 0,
								max: 100,
								value: Math.round(y.position * 100),
								onChange: (e) => x(l.stops.indexOf(y), { position: Math.max(0, Math.min(1, Number(e.target.value) / 100)) }),
								className: "w-12 px-1.5 py-0.5 text-[11px] outline-none",
								style: {
									background: s.surface,
									color: s.text,
									border: `1px solid ${s.border}`,
									borderRadius: 2
								}
							})]
						}),
						l.stops.length > 2 && /* @__PURE__ */ m("button", {
							onClick: () => w(l.stops.indexOf(y)),
							title: "",
							style: { color: s.textDim },
							children: /* @__PURE__ */ m(z, { size: 13 })
						})
					]
				}), /* @__PURE__ */ h("label", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ m("span", {
							className: "text-[9px] uppercase flex-shrink-0",
							style: {
								color: s.textDim,
								width: 48
							},
							children: c("gradient_opacity")
						}),
						/* @__PURE__ */ m(at, {
							min: 0,
							max: 100,
							className: "flex-1",
							value: y.opacity,
							onChange: (e) => x(l.stops.indexOf(y), { opacity: e }),
							accent: s.accent,
							trackColor: s.border,
							"aria-label": c("gradient_opacity")
						}),
						/* @__PURE__ */ m("input", {
							type: "number",
							min: 0,
							max: 100,
							value: Math.round(y.opacity),
							onChange: (e) => x(l.stops.indexOf(y), { opacity: Math.max(0, Math.min(100, Number(e.target.value))) }),
							className: "w-14 px-1.5 py-0.5 text-[11px] outline-none",
							style: {
								background: s.surface,
								color: s.text,
								border: `1px solid ${s.border}`,
								borderRadius: 2
							}
						})
					]
				})]
			}),
			/* @__PURE__ */ h("button", {
				onClick: () => C(),
				className: "flex items-center gap-1 px-1.5 py-1 mt-2 text-[10px] rounded",
				style: {
					background: s.surface,
					color: s.textDim
				},
				children: [
					/* @__PURE__ */ m(I, { size: 11 }),
					" ",
					c("gradient_add_stop")
				]
			})
		]
	});
}
function Nn({ t: e, C: t, value: n, onChange: r, className: i, style: a, width: s = 32, height: l = 24 }) {
	let f = t ?? mn(), [g, _] = d(!1), v = u(null), y = u(null), [b, x] = d(null), S = () => {
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
	return c(() => {
		if (!g) {
			x(null);
			return;
		}
		S();
	}, [g]), o(() => {
		if (!g) return;
		let e = () => S();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [g]), /* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m("button", {
		ref: v,
		type: "button",
		onClick: () => _((e) => !e),
		className: i,
		style: {
			width: s,
			height: l,
			backgroundImage: On(n),
			backgroundColor: "#fff",
			border: `1px solid ${g ? f.accent : f.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...a
		}
	}), g && H(/* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => _(!1)
	}), /* @__PURE__ */ m("div", {
		ref: y,
		className: "fixed",
		style: {
			left: b?.left ?? 0,
			top: b?.top ?? 0,
			zIndex: 200,
			visibility: b ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ m(Mn, {
			t: e,
			C: f,
			value: n,
			onChange: r,
			onClose: () => _(!1)
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/AnchoredPopover.tsx
function Pn({ anchorRef: e, open: t, onClose: n, children: r, gap: i = 4, align: a = "left" }) {
	let s = u(null), [l, f] = d(null), { host: g, scoped: _ } = ke(), v = _ ? "absolute" : "fixed", y = () => {
		let t = e.current, n = s.current;
		if (!t || !n) return;
		let r = t.getBoundingClientRect(), o = n.offsetWidth || 232, c = n.offsetHeight || 300, l = _ && g ? g.getBoundingClientRect() : null, u = l ? l.left : 0, d = l ? l.top : 0, p = l ? l.width : window.innerWidth, m = l ? l.height : window.innerHeight, h = r.bottom - d + i;
		h + c > m - 8 && (h = r.top - d - c - i), h < 8 && (h = 8);
		let v = a === "right" ? r.right - u - o : r.left - u;
		v + o > p - 8 && (v = p - o - 8), v < 8 && (v = 8), f({
			left: v,
			top: h
		});
	};
	return c(() => {
		if (!t) {
			f(null);
			return;
		}
		y();
	}, [t]), o(() => {
		if (!t) return;
		let e = () => y();
		return window.addEventListener("resize", e), window.addEventListener("scroll", e, !0), () => {
			window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0);
		};
	}, [t]), t ? H(/* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m("div", {
		className: `${v} inset-0`,
		style: { zIndex: 199 },
		onMouseDown: n
	}), /* @__PURE__ */ m("div", {
		ref: s,
		className: v,
		style: {
			left: l?.left ?? 0,
			top: l?.top ?? 0,
			zIndex: 200,
			visibility: l ? "visible" : "hidden"
		},
		children: r
	})] }), g ?? document.body) : null;
}
//#endregion
//#region ../../src/ui/windowZStore.ts
var Fn = 1e3, In = he((e, t) => ({
	counter: Fn,
	next: () => {
		let n = t().counter + 1;
		return e({ counter: n }), n;
	}
}));
//#endregion
//#region ../../src/ui/interaction.ts
function Ln() {
	return typeof window < "u" && typeof window.matchMedia == "function" && (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches);
}
var Rn = 1023;
function zn() {
	let e = `(max-width: ${Rn}px)`, [t, n] = d(() => typeof window < "u" && typeof window.matchMedia == "function" ? window.matchMedia(e).matches : !1);
	return o(() => {
		if (typeof window > "u" || typeof window.matchMedia != "function") return;
		let t = window.matchMedia(e), r = (e) => n(e.matches);
		return n(t.matches), t.addEventListener("change", r), () => t.removeEventListener("change", r);
	}, [e]), t;
}
function Bn() {
	let e = "(orientation: landscape)", [t, n] = d(() => typeof window < "u" && typeof window.matchMedia == "function" ? window.matchMedia(e).matches : !0);
	return o(() => {
		if (typeof window > "u" || typeof window.matchMedia != "function") return;
		let t = window.matchMedia(e), r = (e) => n(e.matches);
		return n(t.matches), t.addEventListener("change", r), () => t.removeEventListener("change", r);
	}, []), t;
}
function Vn(e) {
	return {
		onClick: (t) => {
			Ln() ? e.open(t) : e.select?.(t);
		},
		onDoubleClick: (t) => {
			Ln() || e.open(t);
		}
	};
}
function Hn(e, t = {}) {
	let { ms: n = 500, moveTolerance: r = 12 } = t, a = u(null), o = u(null), s = i(() => {
		a.current &&= (clearTimeout(a.current), null), o.current = null;
	}, []);
	return {
		onTouchStart: i((t) => {
			if (t.touches.length !== 1) {
				s();
				return;
			}
			let r = t.touches[0];
			o.current = {
				x: r.clientX,
				y: r.clientY
			}, a.current = setTimeout(() => {
				a.current = null;
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
		onTouchMove: i((e) => {
			if (!o.current) return;
			let t = e.touches[0];
			(Math.abs(t.clientX - o.current.x) > r || Math.abs(t.clientY - o.current.y) > r) && s();
		}, [s, r]),
		onTouchEnd: s,
		onTouchCancel: s
	};
}
//#endregion
//#region ../../src/ui/FloatingWindow.tsx
function Un({ title: e, icon: t, children: n, titleActions: r, popout: a, onClose: s, defaultWidth: c = 560, defaultHeight: l, minWidth: f = 280, minHeight: g = 120, resizable: _ = !1, backdrop: v = !1, className: y = "" }) {
	let b = u(null), [x, S] = d(() => In.getState().next()), [C, w] = d(0), { host: T, scoped: E } = ke(), D = E ? "absolute" : "fixed", O = u(!1), k = u({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0
	}), A = u(!1), j = u(!1), M = u(""), N = u({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0,
		ww: 0,
		wh: 0
	}), P = i(() => {
		S(In.getState().next());
	}, []), F = i(() => {
		let e = b.current;
		if (!e || A.current) return;
		let t = e.getBoundingClientRect();
		e.style.transform = "none", e.style.left = `${t.left}px`, e.style.top = `${t.top}px`, A.current = !0;
	}, []), ee = i((e) => {
		if (E || e.target.closest("button,a,input,select,textarea")) return;
		let t = b.current;
		if (!t) return;
		P(), F();
		let n = t.getBoundingClientRect();
		O.current = !0, k.current = {
			mx: e.clientX,
			my: e.clientY,
			wx: n.left,
			wy: n.top
		}, e.preventDefault();
	}, [
		P,
		F,
		E
	]), I = i((e) => {
		if (E) return;
		let t = b.current;
		if (!t) return;
		P(), F();
		let n = t.getBoundingClientRect();
		j.current = !0, M.current = e.currentTarget.dataset.edge ?? "", N.current = {
			mx: e.clientX,
			my: e.clientY,
			wx: n.left,
			wy: n.top,
			ww: n.width,
			wh: n.height
		}, e.preventDefault(), e.stopPropagation();
	}, [
		P,
		F,
		E
	]);
	o(() => {
		let e = (e) => {
			let t = b.current;
			if (t) {
				if (O.current) {
					let { mx: n, my: r, wx: i, wy: a } = k.current, o = i + e.clientX - n, s = a + e.clientY - r, c = window.innerWidth - 100, l = window.innerHeight - 40;
					t.style.left = `${Math.max(-t.offsetWidth + 100, Math.min(c, o))}px`, t.style.top = `${Math.max(0, Math.min(l, s))}px`;
					return;
				}
				if (j.current) {
					let { mx: n, my: r, wx: i, wy: a, ww: o, wh: s } = N.current, c = e.clientX - n, l = e.clientY - r, u = M.current, d = o, p = s, m = i, h = a;
					u.includes("e") && (d = Math.max(f, o + c)), u.includes("s") && (p = Math.max(g, s + l)), u.includes("w") && (d = Math.max(f, o - c), m = i + (o - d)), u.includes("n") && (p = Math.max(g, s - l), h = a + (s - p)), t.style.width = `${d}px`, t.style.height = `${p}px`, t.style.left = `${m}px`, t.style.top = `${h}px`;
				}
			}
		}, t = () => {
			O.current = !1, j.current = !1;
		};
		return window.addEventListener("mousemove", e), window.addEventListener("mouseup", t), () => {
			window.removeEventListener("mousemove", e), window.removeEventListener("mouseup", t);
		};
	}, [f, g]), o(() => {
		let e = (e) => {
			if (e.key === "Escape") {
				if (a && !E && window.location.pathname + window.location.search === a.route) try {
					window.close();
				} catch {}
				s();
			}
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [
		s,
		a,
		E
	]), o(() => {
		let e = b.current;
		if (!e || E || l !== void 0) return;
		let t = 0, n = () => {
			if (!e.querySelector("[role=\"tablist\"],[data-fw-tabs]")) return;
			let n = window.innerHeight - 16, r = Math.min(e.offsetHeight, n);
			r > t + .5 && (t = r, w(r));
		};
		n();
		let r = new ResizeObserver(n);
		return r.observe(e), () => r.disconnect();
	}, [E, l]);
	let te = !!(a && a.auto !== !1 && typeof window < "u" && window.kubunoDesktop && window.location.pathname + window.location.search !== a.route), L = u(!1);
	if (o(() => {
		if (te && !L.current && a) {
			L.current = !0;
			let t = a.label ?? (typeof e == "string" ? e : void 0), n = a.width || a.height ? {
				width: a.width,
				height: a.height
			} : void 0;
			window.kubunoDesktop?.openWindow(a.route, t, n), s();
		}
	}, [te]), te) return null;
	let z = !!(a && typeof window < "u" && !E && window.location.pathname + window.location.search === a.route), B = zn(), V = z || B && !E, re = () => {
		if (z && typeof window < "u") try {
			window.close();
		} catch {}
		s();
	}, U = _ ? /* @__PURE__ */ h(p, { children: [
		/* @__PURE__ */ m("div", {
			"data-edge": "n",
			onMouseDown: I,
			className: "absolute top-0    left-2  right-2  h-1   cursor-n-resize  z-10"
		}),
		/* @__PURE__ */ m("div", {
			"data-edge": "s",
			onMouseDown: I,
			className: "absolute bottom-0 left-2  right-2  h-1   cursor-s-resize  z-10"
		}),
		/* @__PURE__ */ m("div", {
			"data-edge": "w",
			onMouseDown: I,
			className: "absolute top-2   left-0  bottom-2  w-1   cursor-w-resize  z-10"
		}),
		/* @__PURE__ */ m("div", {
			"data-edge": "e",
			onMouseDown: I,
			className: "absolute top-2   right-0 bottom-2  w-1   cursor-e-resize  z-10"
		}),
		/* @__PURE__ */ m("div", {
			"data-edge": "nw",
			onMouseDown: I,
			className: "absolute top-0    left-0  w-3 h-3  cursor-nw-resize z-20"
		}),
		/* @__PURE__ */ m("div", {
			"data-edge": "ne",
			onMouseDown: I,
			className: "absolute top-0    right-0 w-3 h-3  cursor-ne-resize z-20"
		}),
		/* @__PURE__ */ m("div", {
			"data-edge": "sw",
			onMouseDown: I,
			className: "absolute bottom-0 left-0  w-3 h-3  cursor-sw-resize z-20"
		}),
		/* @__PURE__ */ m("div", {
			"data-edge": "se",
			onMouseDown: I,
			className: "absolute bottom-0 right-0 w-3 h-3  cursor-se-resize z-20"
		})
	] }) : null;
	return H(/* @__PURE__ */ h(p, { children: [v && !z && /* @__PURE__ */ m("div", {
		className: `${D} inset-0 ${E ? "bg-black/15" : "bg-black/30"} backdrop-blur-[1px] no-print`,
		style: { zIndex: x - 1 },
		onClick: s
	}), /* @__PURE__ */ h("div", {
		ref: b,
		role: "dialog",
		"aria-modal": v && !z,
		className: `${D} bg-white flex flex-col overflow-hidden no-print ${y} ${V ? "inset-0" : "rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)]"}`,
		style: V ? {
			width: "100vw",
			height: "100dvh",
			left: 0,
			top: 0,
			zIndex: x
		} : {
			width: c,
			height: l,
			minWidth: E ? `min(${f}px, calc(100% - 16px))` : `min(${f}px, calc(100vw - 16px))`,
			minHeight: C ? `${C}px` : E ? `min(${g}px, calc(100% - 16px))` : `min(${g}px, calc(100vh - 16px))`,
			maxWidth: E ? "calc(100% - 16px)" : "calc(100vw - 16px)",
			maxHeight: E ? "calc(100% - 16px)" : "calc(100vh - 16px)",
			zIndex: x,
			left: "50%",
			top: "33%",
			transform: "translate(-50%, -33%)"
		},
		onMouseDown: V ? void 0 : P,
		children: [
			!V && U,
			/* @__PURE__ */ h("div", {
				className: `flex items-center gap-2.5 px-4 py-3 border-b border-border
                     flex-shrink-0 select-none ${V ? "" : "cursor-move"}`,
				onMouseDown: V ? void 0 : ee,
				children: [
					t && /* @__PURE__ */ m("div", {
						className: "flex-shrink-0 text-text-secondary",
						children: t
					}),
					/* @__PURE__ */ m("div", {
						className: "flex-1 min-w-0 text-sm font-medium text-text-primary truncate",
						children: e
					}),
					r && /* @__PURE__ */ m("div", {
						className: "flex items-center gap-1 flex-shrink-0",
						onMouseDown: (e) => e.stopPropagation(),
						children: r
					}),
					a && typeof window < "u" && window.kubunoDesktop && window.location.pathname + window.location.search !== a.route && /* @__PURE__ */ m("button", {
						onClick: () => {
							let t = a.label ?? (typeof e == "string" ? e : void 0), n = a.width || a.height ? {
								width: a.width,
								height: a.height
							} : void 0;
							window.kubunoDesktop?.openWindow(a.route, t, n), s();
						},
						onMouseDown: (e) => e.stopPropagation(),
						title: "Détacher dans une fenêtre",
						className: "flex-shrink-0 p-1.5 rounded-lg text-text-tertiary\n                         hover:text-text-primary hover:bg-surface-2 transition-colors",
						children: /* @__PURE__ */ m(R, { size: 14 })
					}),
					/* @__PURE__ */ m("button", {
						onClick: re,
						onMouseDown: (e) => e.stopPropagation(),
						title: "Fermer (Échap)",
						className: "flex-shrink-0 p-1.5 -mr-1 rounded-lg text-text-tertiary\n                       hover:text-text-primary hover:bg-surface-2 transition-colors",
						children: /* @__PURE__ */ m(ne, { size: 15 })
					})
				]
			}),
			/* @__PURE__ */ m("div", {
				className: "flex-1 flex flex-col min-h-0 overflow-hidden",
				children: n
			})
		]
	})] }), T ?? document.body);
}
//#endregion
//#region ../../src/ui/ConfirmDialog.tsx
function Wn({ title: e, message: t, confirmLabel: n = "Confirmer", cancelLabel: r = "Annuler", variant: i = "default", hideCancel: a = !1, onConfirm: s, onCancel: c }) {
	let l = u(null);
	o(() => {
		l.current?.focus();
	}, []), o(() => {
		let e = (e) => {
			e.key === "Enter" && s();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [s]);
	let d = i === "danger" ? "bg-red-100" : i === "warning" ? "bg-amber-100" : "bg-gray-100", f = i === "danger" ? "text-red-600" : i === "warning" ? "text-amber-600" : "text-gray-600", p = i === "danger" ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white" : i === "warning" ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white";
	return /* @__PURE__ */ m(Un, {
		title: e,
		onClose: c,
		defaultWidth: 380,
		backdrop: !0,
		children: /* @__PURE__ */ h("div", {
			className: "p-6 flex flex-col gap-4",
			children: [
				/* @__PURE__ */ m("div", {
					className: `w-12 h-12 rounded-full ${d} flex items-center justify-center flex-shrink-0`,
					children: m(i === "danger" ? z : v, { className: `w-6 h-6 ${f}` })
				}),
				/* @__PURE__ */ m("p", {
					className: "text-sm text-gray-500 leading-relaxed whitespace-pre-line",
					children: t
				}),
				/* @__PURE__ */ h("div", {
					className: "flex gap-3 mt-1",
					children: [!a && /* @__PURE__ */ m("button", {
						type: "button",
						onClick: c,
						className: "flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300\n                       rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors whitespace-nowrap",
						children: r
					}), /* @__PURE__ */ m("button", {
						ref: l,
						type: "button",
						onClick: s,
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
function Gn({ type: e, name: t, onChoice: n }) {
	let r = e === "folder";
	return /* @__PURE__ */ m(Un, {
		title: "Conflit de nom",
		onClose: () => n("cancel"),
		defaultWidth: 400,
		backdrop: !0,
		children: /* @__PURE__ */ h("div", {
			className: "p-6 flex flex-col gap-5",
			children: [
				/* @__PURE__ */ h("p", {
					className: "text-sm text-text-secondary leading-relaxed",
					children: [
						"Un ",
						r ? "dossier" : "fichier",
						" nommé",
						" ",
						/* @__PURE__ */ h("span", {
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
				/* @__PURE__ */ h("button", {
					type: "button",
					onClick: () => n("overwrite"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ m("div", {
						className: "w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ m(M, {
							size: 15,
							className: "text-danger"
						})
					}), /* @__PURE__ */ h("div", { children: [/* @__PURE__ */ m("p", {
						className: "text-sm font-medium text-text-primary",
						children: r ? "Fusionner" : "Écraser"
					}), /* @__PURE__ */ m("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: r ? "Les deux dossiers seront fusionnés. Les fichiers en conflit seront remplacés." : "Le fichier existant sera remplacé par le nouveau."
					})] })]
				}),
				/* @__PURE__ */ h("button", {
					type: "button",
					onClick: () => n("keep_both"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ m("div", {
						className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ m(O, {
							size: 15,
							className: "text-primary"
						})
					}), /* @__PURE__ */ h("div", { children: [/* @__PURE__ */ m("p", {
						className: "text-sm font-medium text-text-primary",
						children: "Conserver les deux"
					}), /* @__PURE__ */ h("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: [
							"Le nouvel élément sera renommé automatiquement (ex.\xA0: «\xA0",
							t,
							" (2)\xA0»)."
						]
					})] })]
				}),
				/* @__PURE__ */ m("button", {
					type: "button",
					onClick: () => n("cancel"),
					className: "self-end text-sm text-text-secondary hover:text-text-primary transition-colors px-2 py-1",
					children: "Annuler"
				})
			]
		})
	});
}
//#endregion
//#region ../../src/ui/MobileSheet.tsx
function Kn({ open: e, onClose: t, title: n, children: r }) {
	return o(() => {
		if (!e) return;
		let n = (e) => {
			e.key === "Escape" && t();
		};
		document.addEventListener("keydown", n);
		let r = document.body.style.overflow;
		return document.body.style.overflow = "hidden", () => {
			document.removeEventListener("keydown", n), document.body.style.overflow = r;
		};
	}, [e, t]), e ? H(/* @__PURE__ */ h("div", {
		className: "fixed inset-0 z-[9997] lg:hidden",
		role: "dialog",
		"aria-modal": "true",
		children: [/* @__PURE__ */ m("div", {
			className: "absolute inset-0 bg-black/40 animate-[kb-sheet-fade_.15s_ease-out]",
			onClick: t
		}), /* @__PURE__ */ h("div", {
			className: "absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white\n                   shadow-[0_-8px_30px_rgba(0,0,0,0.18)] animate-[kb-sheet-up_.2s_ease-out]",
			style: { paddingBottom: "calc(12px + env(safe-area-inset-bottom))" },
			children: [
				/* @__PURE__ */ m("div", {
					className: "flex justify-center pt-2.5 pb-1",
					children: /* @__PURE__ */ m("div", { className: "h-1 w-10 rounded-full bg-border-strong" })
				}),
				n && /* @__PURE__ */ m("div", {
					className: "px-4 pb-2 pt-1 text-sm font-medium text-text-primary truncate",
					children: n
				}),
				/* @__PURE__ */ m("div", {
					className: "py-1",
					children: r
				})
			]
		})]
	}), document.body) : null;
}
function qn({ icon: e, label: t, trailing: n, danger: r, selected: i, onClick: a }) {
	return /* @__PURE__ */ h("button", {
		onClick: a,
		className: `w-full flex items-center gap-3.5 px-4 h-[52px] text-left text-[15px] active:bg-surface-2 transition-colors
                  ${r ? "text-danger" : "text-text-primary"} ${i ? "bg-primary-light" : ""}`,
		children: [
			e && /* @__PURE__ */ m("span", {
				className: `w-5 flex justify-center shrink-0 ${r ? "text-danger" : "text-text-secondary"}`,
				children: e
			}),
			/* @__PURE__ */ m("span", {
				className: "flex-1 min-w-0 truncate",
				children: t
			}),
			n
		]
	});
}
function Jn() {
	return /* @__PURE__ */ m("div", { className: "my-1 h-px bg-border" });
}
//#endregion
//#region ../../src/ui/index.ts
var Yn = X("ui.Button", Ne), Xn = X("ui.Badge", Le), Zn = X("ui.Input", Re), Qn = X("ui.NumberInput", ze), $n = X("ui.Textarea", Be), er = X("ui.RichText", Ve), tr = X("ui.Checkbox", Ge), nr = X("ui.Radio", Ye), rr = X("ui.Toggle", Xe), ir = X("ui.FloatCheckbox", Ze), ar = X("ui.Separator", Qe), or = X("ui.Spinner", et), sr = X("ui.RangeSlider", at), cr = X("ui.Dropdown", st), lr = X("ui.DatePicker", vt), ur = X("ui.FontPicker", It), dr = X("ui.FontSizeField", zt), fr = X("ui.MenuDropdown", Ht), pr = X("ui.Tabs", Gt), mr = X("ui.Accordion", Kt), hr = X("ui.StartPage", $t), gr = X("ui.KubunoLogo", en), _r = X("ui.LabelIcon", nn), vr = X("ui.ColorPicker", xn), yr = X("ui.ColorField", Sn), br = X("ui.ColorSwatchPicker", En), xr = X("ui.GradientPicker", Mn), Sr = X("ui.GradientField", Nn), Cr = X("ui.AnchoredPopover", Pn), wr = X("ui.FloatingWindow", Un), Tr = X("ui.ResizeHandle", qt), Er = X("ui.ConfirmDialog", Wn), Dr = X("ui.ConflictDialog", Gn);
//#endregion
export { mr as Accordion, Cr as AnchoredPopover, Xn as Badge, Yn as Button, tr as Checkbox, yr as ColorField, vr as ColorPicker, br as ColorSwatchPicker, Y as ComponentRegistry, Er as ConfirmDialog, Dr as ConflictDialog, kn as DEFAULT_GRADIENT, un as DEFAULT_PICKER_THEME, lr as DatePicker, cr as Dropdown, Et as FONT_UI_THEME, ir as FloatCheckbox, wr as FloatingWindow, ur as FontPicker, dr as FontSizeField, Sr as GradientField, xr as GradientPicker, Zn as Input, gr as KubunoLogo, dn as LIGHT_PICKER_THEME, _r as LabelIcon, Rn as MOBILE_MAX_WIDTH, fr as MenuDropdown, Kn as MobileSheet, qn as MobileSheetItem, Jn as MobileSheetSeparator, Qn as NumberInput, Oe as PortalHostContext, nr as Radio, sr as RangeSlider, Tr as ResizeHandle, er as RichText, rt as RollingNumber, ar as Separator, or as Spinner, tt as SpinnerOverlay, hr as StartPage, pr as Tabs, $n as Textarea, Ce as ThemePreviewContext, Se as ThemeScopeContext, rr as Toggle, pn as appPickerTheme, $ as cmykToRgb, Tt as dedupeFontFamilies, On as gradientToCss, gn as harmonyColors, Z as hexToRgb, sn as hslToRgb, Q as hsvToRgb, Ln as isCoarsePointer, Vn as openable, wt as parseFontMeta, ln as rgbToCmyk, rn as rgbToHex, an as rgbToHsl, cn as rgbToHsv, Dn as rgbaFromHex, X as themed, mn as useAppPickerTheme, Bn as useIsLandscape, zn as useIsMobile, Hn as useLongPress, Wt as useMenuDropdown, ke as usePortalHost, Jt as useResizableWidth, we as useThemeVersion, In as useWindowZStore };
