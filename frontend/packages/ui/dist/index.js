import e, { useCallback as t, useEffect as n, useId as r, useLayoutEffect as i, useMemo as a, useRef as o, useState as s } from "react";
import { Fragment as c, jsx as l, jsxs as u } from "react/jsx-runtime";
import { AlertTriangle as d, Bold as f, Calendar as p, Check as m, ChevronDown as h, ChevronLeft as g, ChevronRight as _, ChevronUp as v, Circle as y, Clock as b, Copy as x, Eraser as S, GripVertical as C, Italic as w, Layers as T, Link2 as E, List as D, ListOrdered as O, Pipette as k, Plus as A, Search as j, Square as M, Trash2 as N, Triangle as P, Underline as F, X as ee } from "lucide-react";
import { clsx as I } from "clsx";
import { twMerge as L } from "tailwind-merge";
import { createPortal as R } from "react-dom";
import { addMonths as z, eachDayOfInterval as te, endOfMonth as B, endOfWeek as V, format as H, getMonth as U, getYear as W, isAfter as G, isBefore as K, isSameDay as q, isSameMonth as ne, isToday as re, isValid as ie, parseISO as ae, startOfMonth as oe, startOfWeek as J, subMonths as Y } from "date-fns";
import { fr as se } from "date-fns/locale";
import { create as ce } from "zustand";
//#region ../../src/ui/Button.tsx
var le = [
	"inline-flex items-center justify-center font-medium select-none",
	"transition-colors rounded-md",
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
	"disabled:opacity-50 disabled:cursor-not-allowed"
].join(" "), ue = {
	primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
	secondary: "bg-white border border-border text-text-primary hover:bg-surface-1 active:bg-surface-2",
	ghost: "bg-transparent text-text-secondary hover:bg-surface-2 active:bg-surface-3",
	danger: "bg-danger text-white hover:opacity-90 active:opacity-80"
}, de = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-9 px-4 text-sm gap-2",
	lg: "h-11 px-5 text-sm gap-2"
};
function fe({ variant: e = "primary", size: t = "md", icon: n, loading: r = !1, className: i, disabled: a, children: o, type: s = "button", ...d }) {
	return /* @__PURE__ */ l("button", {
		type: s,
		className: [
			le,
			ue[e],
			de[t],
			i
		].filter(Boolean).join(" "),
		disabled: a || r,
		...d,
		children: r ? /* @__PURE__ */ l("span", { className: "h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" }) : /* @__PURE__ */ u(c, { children: [n, o] })
	});
}
//#endregion
//#region ../../src/ui/NumberInput.tsx
function pe({ value: e, onChange: n, min: r, max: i, step: a = 1, disabled: o = !1, label: s, error: c, hint: d, className: f, id: p }) {
	let m = p ?? s?.toLowerCase().replace(/\s+/g, "-"), g = t((e) => r !== void 0 && e < r ? r : i !== void 0 && e > i ? i : e, [r, i]), _ = () => n(g(e + a)), y = () => n(g(e - a)), b = (e) => {
		let t = parseFloat(e.target.value);
		isNaN(t) || n(g(t));
	}, x = r !== void 0 && e <= r, S = i !== void 0 && e >= i;
	return /* @__PURE__ */ u("div", {
		className: "flex flex-col gap-1",
		children: [
			s && /* @__PURE__ */ l("label", {
				htmlFor: m,
				className: "text-sm font-medium text-text-primary",
				children: s
			}),
			/* @__PURE__ */ u("div", {
				className: I("inline-flex items-stretch h-9 rounded-md border bg-white overflow-hidden", "focus-within:ring-2 focus-within:ring-primary focus-within:border-primary", c ? "border-danger focus-within:ring-danger" : "border-border", o && "opacity-50 cursor-not-allowed", f),
				children: [/* @__PURE__ */ l("input", {
					id: m,
					type: "number",
					value: e,
					onChange: b,
					min: r,
					max: i,
					step: a,
					disabled: o,
					className: I("flex-1 min-w-0 px-3 text-sm text-text-primary bg-transparent", "focus:outline-none", "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none")
				}), /* @__PURE__ */ u("div", {
					className: "flex flex-col border-l border-border w-6 flex-shrink-0",
					children: [/* @__PURE__ */ l("button", {
						type: "button",
						tabIndex: -1,
						onClick: _,
						disabled: o || S,
						className: I("flex-1 flex items-center justify-center border-b border-border", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ l(v, {
							size: 11,
							strokeWidth: 2.5
						})
					}), /* @__PURE__ */ l("button", {
						type: "button",
						tabIndex: -1,
						onClick: y,
						disabled: o || x,
						className: I("flex-1 flex items-center justify-center", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ l(h, {
							size: 11,
							strokeWidth: 2.5
						})
					})]
				})]
			}),
			c && /* @__PURE__ */ l("p", {
				className: "text-xs text-danger",
				children: c
			}),
			d && !c && /* @__PURE__ */ l("p", {
				className: "text-xs text-text-secondary",
				children: d
			})
		]
	});
}
//#endregion
//#region ../../src/ui/RangeSlider.tsx
function me({ d: e, animate: t }) {
	return /* @__PURE__ */ l("span", {
		className: "inline-block overflow-hidden align-baseline",
		style: { height: "1em" },
		children: /* @__PURE__ */ l("span", {
			className: "flex flex-col",
			style: {
				transform: `translateY(-${e}em)`,
				transition: t ? "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)" : "none"
			},
			children: Array.from({ length: 10 }, (e, t) => /* @__PURE__ */ l("span", {
				style: {
					height: "1em",
					lineHeight: "1em"
				},
				children: t
			}, t))
		})
	});
}
function he({ text: e, className: t }) {
	let r = o(!1);
	return n(() => {
		r.current = !0;
	}, []), /* @__PURE__ */ l("span", {
		className: `inline-flex items-baseline tabular-nums leading-none ${t ?? ""}`,
		children: [...e].map((e, t) => /\d/.test(e) ? /* @__PURE__ */ l(me, {
			d: Number(e),
			animate: r.current
		}, t) : /* @__PURE__ */ l("span", { children: e }, t))
	});
}
var ge = (e, t, n) => n <= t ? 0 : Math.max(0, Math.min(100, (e - t) / (n - t) * 100));
function _e({ value: e, onChange: t, min: n = 0, max: i = 100, step: a = 1, variant: o = "bubble", orientation: c = "horizontal", format: d, minLabel: f, maxLabel: p, showValue: m = !1, accent: h, trackColor: g, disabled: _, className: v, style: y, id: b, ...x }) {
	let S = r(), [C, w] = s(!1), T = b ?? S, E = d ?? ((e) => String(e)), D = ge(e, n, i), O = h ?? "var(--color-primary, #1a73e8)", k = g ?? "rgba(0,0,0,0.10)", A = (e) => {
		let r = Number(e);
		Number.isFinite(r) && t(Math.max(n, Math.min(i, r)));
	}, j = /* @__PURE__ */ l("input", {
		id: T,
		type: "range",
		min: n,
		max: i,
		step: a,
		value: e,
		disabled: _,
		onChange: (e) => t(Number(e.target.value)),
		onMouseDown: (e) => e.stopPropagation(),
		"aria-label": x["aria-label"],
		className: "absolute inset-0 m-0 w-full h-full cursor-pointer appearance-none bg-transparent\n                 focus:outline-none disabled:cursor-not-allowed\n                 [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent\n                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-transparent\n                 [&::-moz-range-track]:bg-transparent\n                 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent",
		style: {
			WebkitAppearance: "none",
			appearance: "none"
		}
	}), M = (e = 12) => /* @__PURE__ */ l("span", {
		"aria-hidden": !0,
		className: "absolute top-1/2 rounded-full pointer-events-none",
		style: {
			left: `${D}%`,
			width: e,
			height: e,
			transform: "translate(-50%, -50%)",
			background: O,
			boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,0.35)"
		}
	});
	if (o === "boxed") return /* @__PURE__ */ u("div", {
		className: L("select-none", _ && "opacity-60", v),
		style: y,
		children: [/* @__PURE__ */ u("div", {
			className: "relative rounded-xl border-2 bg-surface-0 px-4 pt-3 pb-5 transition-colors focus-within:border-primary",
			style: { borderColor: "var(--color-border, #dadce0)" },
			children: [/* @__PURE__ */ l("input", {
				type: "text",
				inputMode: "numeric",
				value: E(e),
				disabled: _,
				onChange: (e) => A(e.target.value.replace(/[^\d.-]/g, "")),
				className: "w-full bg-transparent text-2xl font-medium text-text-primary tabular-nums\n                       focus:outline-none disabled:cursor-not-allowed",
				"aria-label": x["aria-label"]
			}), /* @__PURE__ */ l("div", {
				className: "absolute left-3 right-3 bottom-0 h-0 translate-y-1/2",
				children: /* @__PURE__ */ u("div", {
					className: "relative h-1.5 rounded-full",
					style: { background: k },
					children: [
						/* @__PURE__ */ l("div", {
							className: "absolute inset-y-0 left-0 rounded-full",
							style: {
								width: `${D}%`,
								background: O
							}
						}),
						M(14),
						j
					]
				})
			})]
		}), /* @__PURE__ */ u("div", {
			className: "mt-1.5 flex items-center justify-between text-xs text-text-tertiary",
			children: [/* @__PURE__ */ l("span", { children: f ?? E(n) }), /* @__PURE__ */ l("span", { children: p ?? E(i) })]
		})]
	});
	if (c === "vertical") {
		let r = /* @__PURE__ */ l("input", {
			id: T,
			type: "range",
			min: n,
			max: i,
			step: a,
			value: e,
			disabled: _,
			onChange: (e) => t(Number(e.target.value)),
			onMouseDown: (e) => e.stopPropagation(),
			"aria-label": x["aria-label"],
			className: "absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none bg-transparent\n                   focus:outline-none disabled:cursor-not-allowed\n                   [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent\n                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-transparent\n                   [&::-moz-range-track]:bg-transparent\n                   [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent",
			style: {
				writingMode: "vertical-lr",
				direction: "rtl",
				WebkitAppearance: "none",
				appearance: "none"
			}
		});
		return /* @__PURE__ */ l("div", {
			className: L("relative h-full select-none", _ && "opacity-60", v),
			style: y,
			children: /* @__PURE__ */ u("div", {
				className: "relative mx-auto h-full w-1.5 rounded-full",
				style: { background: k },
				children: [
					/* @__PURE__ */ l("div", {
						className: "absolute inset-x-0 bottom-0 rounded-full",
						style: {
							height: `${D}%`,
							background: O
						}
					}),
					/* @__PURE__ */ l("span", {
						"aria-hidden": !0,
						className: "absolute left-1/2 h-3 w-3 rounded-full pointer-events-none",
						style: {
							bottom: `${D}%`,
							transform: "translate(-50%, 50%)",
							background: O,
							boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,0.35)"
						}
					}),
					r
				]
			})
		});
	}
	let N = m || C;
	return /* @__PURE__ */ u("div", {
		className: L("relative w-full select-none", _ && "opacity-60", v),
		style: y,
		onPointerDown: () => !_ && w(!0),
		onPointerUp: () => w(!1),
		onPointerLeave: () => w(!1),
		children: [/* @__PURE__ */ l("div", {
			"aria-hidden": !0,
			className: "pointer-events-none absolute -top-1 -translate-y-full transition-[opacity,transform] duration-150",
			style: {
				left: `${D}%`,
				transform: `translate(-50%, ${N ? "-100%" : "-80%"})`,
				opacity: +!!N
			},
			children: /* @__PURE__ */ l("span", {
				className: "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold text-white shadow",
				style: { background: O },
				children: /* @__PURE__ */ l(he, { text: E(e) })
			})
		}), /* @__PURE__ */ u("div", {
			className: "relative h-1.5 rounded-full",
			style: { background: k },
			children: [
				/* @__PURE__ */ l("div", {
					className: "absolute inset-y-0 left-0 rounded-full",
					style: {
						width: `${D}%`,
						background: O
					}
				}),
				M(),
				j
			]
		})]
	});
}
//#endregion
//#region ../../src/ui/Input.tsx
var ve = e.forwardRef(function({ label: e, error: t, hint: n, leftIcon: r, rightIcon: i, className: a, id: o, ...s }, c) {
	let d = o ?? (typeof e == "string" ? e.toLowerCase().replace(/\s+/g, "-") : void 0);
	return /* @__PURE__ */ u("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ l("label", {
				htmlFor: d,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ u("div", {
				className: "relative flex items-center",
				children: [
					r && /* @__PURE__ */ l("span", {
						className: "absolute left-3 text-text-secondary pointer-events-none",
						children: r
					}),
					/* @__PURE__ */ l("input", {
						ref: c,
						id: d,
						className: L(I("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-9", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r && "pl-9", i && "pr-9", a)),
						...s
					}),
					i && /* @__PURE__ */ l("span", {
						className: "absolute right-3 text-text-secondary pointer-events-none",
						children: i
					})
				]
			}),
			t && /* @__PURE__ */ l("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ l("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
});
//#endregion
//#region ../../src/ui/Textarea.tsx
function ye({ label: e, error: t, hint: n, className: r, id: i, ...a }) {
	let o = i ?? e?.toLowerCase().replace(/\s+/g, "-");
	return /* @__PURE__ */ u("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ l("label", {
				htmlFor: o,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ l("textarea", {
				id: o,
				className: L(I("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-36 min-h-36 resize-y", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r)),
				...a
			}),
			t && /* @__PURE__ */ l("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ l("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
}
//#endregion
//#region ../../src/ui/RichText.tsx
function be({ value: e, onChange: t, placeholder: r, className: i, minHeight: a = 96, disabled: c }) {
	let d = o(null), [p, m] = s(!1), [h, g] = s(""), [_, v] = s(!e), y = o(null);
	n(() => {
		d.current && (d.current.innerHTML = e || ""), v(!d.current?.textContent?.trim() && !d.current?.querySelector("img,ul,ol"));
	}, []);
	let b = () => {
		let e = d.current?.innerHTML ?? "", n = !d.current?.textContent?.trim() && !d.current?.querySelector("img,ul,ol,li");
		v(n), t(n ? "" : e);
	}, x = (e, t) => {
		d.current?.focus(), document.execCommand(e, !1, t), b();
	}, C = () => {
		let e = window.getSelection();
		e && e.rangeCount && (y.current = e.getRangeAt(0).cloneRange());
	}, T = () => {
		let e = window.getSelection();
		e && y.current && (e.removeAllRanges(), e.addRange(y.current));
	}, k = () => {
		T();
		let e = h.trim();
		e && x("createLink", /^https?:\/\//i.test(e) ? e : `https://${e}`), m(!1), g("");
	}, A = ({ on: e, title: t, children: n }) => /* @__PURE__ */ l("button", {
		type: "button",
		title: t,
		"aria-label": t,
		onMouseDown: (e) => e.preventDefault(),
		onClick: e,
		className: "w-8 h-8 flex items-center justify-center rounded text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors",
		children: n
	});
	return /* @__PURE__ */ u("div", {
		className: `rounded-md border border-border bg-white overflow-hidden ${i ?? ""}`,
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center gap-0.5 px-1.5 py-1 border-b border-border",
				children: [
					/* @__PURE__ */ l(A, {
						title: "Gras",
						on: () => x("bold"),
						children: /* @__PURE__ */ l(f, { size: 15 })
					}),
					/* @__PURE__ */ l(A, {
						title: "Italique",
						on: () => x("italic"),
						children: /* @__PURE__ */ l(w, { size: 15 })
					}),
					/* @__PURE__ */ l(A, {
						title: "Souligné",
						on: () => x("underline"),
						children: /* @__PURE__ */ l(F, { size: 15 })
					}),
					/* @__PURE__ */ l("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ l(A, {
						title: "Liste numérotée",
						on: () => x("insertOrderedList"),
						children: /* @__PURE__ */ l(O, { size: 15 })
					}),
					/* @__PURE__ */ l(A, {
						title: "Liste à puces",
						on: () => x("insertUnorderedList"),
						children: /* @__PURE__ */ l(D, { size: 15 })
					}),
					/* @__PURE__ */ l("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ l(A, {
						title: "Insérer un lien",
						on: () => {
							C(), m((e) => !e);
						},
						children: /* @__PURE__ */ l(E, { size: 15 })
					}),
					/* @__PURE__ */ l(A, {
						title: "Effacer la mise en forme",
						on: () => x("removeFormat"),
						children: /* @__PURE__ */ l(S, { size: 15 })
					})
				]
			}),
			p && /* @__PURE__ */ u("div", {
				className: "flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-surface-1",
				children: [/* @__PURE__ */ l("input", {
					autoFocus: !0,
					value: h,
					onChange: (e) => g(e.target.value),
					placeholder: "https://…",
					onKeyDown: (e) => {
						e.key === "Enter" && (e.preventDefault(), k()), e.key === "Escape" && m(!1);
					},
					className: "flex-1 text-sm px-2 py-1 rounded border border-border outline-none focus:border-primary"
				}), /* @__PURE__ */ l("button", {
					type: "button",
					onClick: k,
					className: "text-sm font-medium text-primary px-2",
					children: "OK"
				})]
			}),
			/* @__PURE__ */ u("div", {
				className: "relative",
				children: [/* @__PURE__ */ l("div", {
					ref: d,
					contentEditable: !c,
					onInput: b,
					suppressContentEditableWarning: !0,
					className: "px-3 py-2 text-sm text-text-primary outline-none leading-relaxed\n                     [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-5 [&_ol]:ml-5",
					style: { minHeight: a }
				}), _ && r && /* @__PURE__ */ l("div", {
					className: "absolute top-2 left-3 text-sm text-text-tertiary pointer-events-none select-none",
					children: r
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Dropdown.tsx
var xe = {
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
function Se({ value: e, onChange: t, options: r, width: a, dropdownMinWidth: c, placeholder: d, disabled: f = !1, height: p = 36, fontSize: m = 14, className: g, variant: _ = "default" }) {
	let [v, y] = s(!1), [b, x] = s(null), S = o(null), C = o(null), w = xe[_], T = r.find((t) => t.value === e)?.label ?? d ?? e, E = () => {
		if (!f) {
			if (S.current) {
				let e = S.current.getBoundingClientRect();
				x({
					top: e.bottom + 2,
					left: e.left,
					minWidth: Math.max(c ?? 0, e.width)
				});
			}
			y((e) => !e);
		}
	};
	n(() => {
		if (!v) return;
		let e = (e) => {
			S.current?.contains(e.target) || y(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [v]), i(() => {
		let e = C.current;
		if (!e || !v || !b) return;
		let t = e.getBoundingClientRect(), n = window.innerWidth, r = window.innerHeight, i = b.left, a = b.top;
		t.right > n - 8 && (i = n - 8 - t.width), t.bottom > r - 8 && (a = r - 8 - t.height), i < 8 && (i = 8), a < 8 && (a = 8), e.style.left = `${i}px`, e.style.top = `${a}px`;
	}, [v, b]);
	let D = {};
	return a !== void 0 && (D.width = a), /* @__PURE__ */ u("div", {
		className: `relative ${g ?? ""}`,
		style: D,
		children: [/* @__PURE__ */ u("button", {
			type: "button",
			ref: S,
			onClick: E,
			onMouseDown: (e) => e.preventDefault(),
			disabled: f,
			className: "w-full flex items-center justify-between gap-1 select-none",
			style: {
				height: p,
				padding: "0 4px 0 8px",
				fontSize: m,
				fontFamily: "var(--font-family-sans)",
				color: w.text,
				background: v ? w.activeBg : void 0,
				border: `1px solid ${w.border}`,
				borderRadius: "var(--radius-md)",
				cursor: f ? "not-allowed" : "pointer",
				opacity: f ? .5 : 1,
				transition: "background 0.1s"
			},
			onMouseEnter: (e) => {
				!v && !f && (e.currentTarget.style.background = w.hoverBg);
			},
			onMouseLeave: (e) => {
				v || (e.currentTarget.style.background = "");
			},
			children: [/* @__PURE__ */ l("span", {
				className: "truncate flex-1 text-left",
				children: T
			}), /* @__PURE__ */ l(h, {
				size: 12,
				style: {
					color: w.chevron,
					flexShrink: 0
				}
			})]
		}), v && b && R(/* @__PURE__ */ l("div", {
			ref: C,
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
				background: w.popBg,
				borderRadius: 4,
				padding: "4px 0",
				overflowY: "auto",
				boxShadow: w.popShadow
			},
			children: r.map((n) => /* @__PURE__ */ u("button", {
				type: "button",
				onClick: () => {
					t(n.value), y(!1);
				},
				className: "w-full text-left flex items-center gap-2",
				style: {
					padding: "5px 16px",
					fontSize: m,
					color: w.itemText,
					background: n.value === e ? w.selBg : void 0,
					fontWeight: n.value === e ? 600 : void 0
				},
				onMouseEnter: (t) => {
					t.currentTarget.style.background = n.value === e ? w.selHoverBg : w.itemHover;
				},
				onMouseLeave: (t) => {
					t.currentTarget.style.background = n.value === e ? w.selBg : "";
				},
				children: [
					n.value === e ? /* @__PURE__ */ l("span", {
						style: {
							color: w.checkColor,
							fontSize: 14,
							marginLeft: -4
						},
						children: "✓"
					}) : /* @__PURE__ */ l("span", { style: { width: 14 } }),
					n.icon && /* @__PURE__ */ l("span", {
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
//#region ../../src/ui/fontFamily.ts
var Ce = (e) => e.charCodeAt(0) << 24 | e.charCodeAt(1) << 16 | e.charCodeAt(2) << 8 | e.charCodeAt(3), we = Ce("name"), Te = Ce("ttcf"), Ee = Ce("OS/2");
function De(e) {
	let t = e.toLowerCase(), n = /italic|oblique/.test(t) ? "italic" : "normal", r = 400;
	return /thin|hairline/.test(t) ? r = 100 : /extra\s*light|ultra\s*light/.test(t) ? r = 200 : /semi\s*light|demi\s*light/.test(t) ? r = 350 : /light/.test(t) ? r = 300 : /medium/.test(t) ? r = 500 : /semi\s*bold|demi\s*bold/.test(t) ? r = 600 : /extra\s*bold|ultra\s*bold/.test(t) ? r = 800 : /black|heavy/.test(t) ? r = 900 : /bold/.test(t) && (r = 700), {
		weight: r,
		style: n
	};
}
function Oe(e) {
	try {
		let t = new DataView(e), n, r;
		if (t.getUint32(0) === Te) {
			let e = t.getUint32(12);
			n = t.getUint16(e + 4), r = e + 12;
		} else n = t.getUint16(4), r = 12;
		let i = -1, a = -1;
		for (let e = 0; e < n; e++) {
			let n = r + e * 16, o = t.getUint32(n);
			o === we ? i = t.getUint32(n + 8) : o === Ee && (a = t.getUint32(n + 8));
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
		let u = c(17) || c(2) || "Regular", d = De(u);
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
function ke(e) {
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
var Ae = (e) => `"${e.replace(/"/g, "")}", "Segoe UI", system-ui, sans-serif`;
function je({ value: t, onChange: r, fonts: c, recent: d = [], width: f = 150, height: p = 36, fontSize: g = 14, disabled: _ = !1, className: v, variant: y = "default" }) {
	let [b, x] = s(!1), [S, C] = s(null), [w, T] = s(""), [E, D] = s(0), O = o(null), k = o(null), A = o(null), M = a(() => ke([...d, ...c]), [d, c]), N = a(() => new Set(d.map((e) => e.toLowerCase())), [d]), P = a(() => {
		let e = w.trim().toLowerCase();
		return e ? M.filter((t) => t.toLowerCase().includes(e)) : M;
	}, [M, w]), F = () => {
		if (_) return;
		let e = O.current?.getBoundingClientRect();
		e && C({
			top: e.bottom + 2,
			left: e.left,
			minWidth: Math.max(220, e.width)
		}), T(""), D(0), x((e) => !e);
	};
	n(() => {
		if (!b) return;
		let e = (e) => {
			!O.current?.contains(e.target) && !k.current?.contains(e.target) && x(!1);
		};
		return document.addEventListener("mousedown", e), setTimeout(() => A.current?.focus(), 0), () => document.removeEventListener("mousedown", e);
	}, [b]), n(() => {
		b && k.current?.querySelector(`[data-idx="${E}"]`)?.scrollIntoView({ block: "nearest" });
	}, [E, b]), i(() => {
		let e = k.current;
		if (!e || !b || !S) return;
		let t = e.getBoundingClientRect(), n = S.left, r = S.top;
		t.right > window.innerWidth - 8 && (n = window.innerWidth - 8 - t.width), t.bottom > window.innerHeight - 8 && (r = Math.max(8, window.innerHeight - 8 - t.height)), n < 8 && (n = 8), e.style.left = `${n}px`, e.style.top = `${r}px`;
	}, [
		b,
		S,
		P.length
	]);
	let ee = (e) => {
		r(e), x(!1);
	}, I = (e) => {
		e.key === "ArrowDown" ? (e.preventDefault(), D((e) => Math.min(P.length - 1, e + 1))) : e.key === "ArrowUp" ? (e.preventDefault(), D((e) => Math.max(0, e - 1))) : e.key === "Enter" ? (e.preventDefault(), P[E] && ee(P[E])) : e.key === "Escape" && (e.preventDefault(), x(!1));
	}, L = y === "ghost", z = w ? -1 : P.reduce((e, t, n) => N.has(t.toLowerCase()) ? n : e, -1);
	return /* @__PURE__ */ u("div", {
		className: `relative ${v ?? ""}`,
		style: { width: f },
		children: [/* @__PURE__ */ u("button", {
			type: "button",
			ref: O,
			onClick: F,
			onMouseDown: (e) => e.preventDefault(),
			disabled: _,
			className: "w-full flex items-center justify-between gap-1 select-none",
			style: {
				height: p,
				padding: "0 4px 0 8px",
				fontSize: g,
				color: "#202124",
				fontFamily: Ae(t || "Arial"),
				background: b ? "rgba(0,0,0,0.08)" : void 0,
				border: `1px solid ${L ? "transparent" : "var(--color-border)"}`,
				borderRadius: "var(--radius-md)",
				cursor: _ ? "not-allowed" : "pointer",
				opacity: _ ? .5 : 1,
				transition: "background 0.1s"
			},
			onMouseEnter: (e) => {
				!b && !_ && (e.currentTarget.style.background = "rgba(0,0,0,0.06)");
			},
			onMouseLeave: (e) => {
				b || (e.currentTarget.style.background = "");
			},
			title: t,
			children: [/* @__PURE__ */ l("span", {
				className: "truncate flex-1 text-left",
				children: t || "Arial"
			}), /* @__PURE__ */ l(h, {
				size: 12,
				style: {
					color: "#5f6368",
					flexShrink: 0
				}
			})]
		}), b && S && R(/* @__PURE__ */ u("div", {
			ref: k,
			onMouseDown: (e) => e.stopPropagation(),
			style: {
				position: "fixed",
				top: S.top,
				left: S.left,
				minWidth: S.minWidth,
				width: "max-content",
				maxWidth: 320,
				zIndex: 9999,
				background: "#fff",
				borderRadius: 8,
				boxShadow: "0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)",
				overflow: "hidden"
			},
			children: [/* @__PURE__ */ u("div", {
				className: "flex items-center gap-1.5 px-2.5 py-1.5 border-b",
				style: { borderColor: "var(--color-border)" },
				children: [/* @__PURE__ */ l(j, {
					size: 14,
					style: {
						color: "#80868b",
						flexShrink: 0
					}
				}), /* @__PURE__ */ l("input", {
					ref: A,
					value: w,
					onChange: (e) => {
						T(e.target.value), D(0);
					},
					onKeyDown: I,
					placeholder: "Rechercher une police…",
					className: "flex-1 outline-none bg-transparent text-sm",
					style: { color: "#202124" }
				})]
			}), /* @__PURE__ */ u("div", {
				style: {
					maxHeight: 320,
					overflowY: "auto",
					padding: "4px 0"
				},
				children: [P.length === 0 && /* @__PURE__ */ l("div", {
					className: "px-4 py-3 text-sm",
					style: { color: "#80868b" },
					children: "Aucune police"
				}), P.map((n, r) => /* @__PURE__ */ u(e.Fragment, { children: [/* @__PURE__ */ u("button", {
					type: "button",
					"data-idx": r,
					onClick: () => ee(n),
					onMouseEnter: () => D(r),
					className: "w-full text-left flex items-center gap-2",
					style: {
						padding: "7px 12px",
						fontSize: 15,
						color: "#202124",
						fontFamily: Ae(n),
						background: r === E ? "rgba(26,115,232,0.10)" : n === t ? "rgba(26,115,232,0.06)" : void 0
					},
					children: [/* @__PURE__ */ l("span", {
						style: {
							width: 16,
							flexShrink: 0,
							color: "#1a73e8"
						},
						children: n === t && /* @__PURE__ */ l(m, { size: 14 })
					}), /* @__PURE__ */ l("span", {
						className: "truncate",
						children: n
					})]
				}), r === z && /* @__PURE__ */ l("div", { style: {
					height: 1,
					background: "var(--color-border)",
					margin: "4px 0"
				} })] }, n))]
			})]
		}), document.body)]
	});
}
//#endregion
//#region ../../src/ui/MenuDropdown.tsx
function Me() {
	let [e, t] = s(() => typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(pointer: coarse)").matches);
	return n(() => {
		let e = window.matchMedia("(pointer: coarse)"), n = () => t(e.matches);
		return e.addEventListener("change", n), () => e.removeEventListener("change", n);
	}, []), e;
}
var Ne = {
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
function Pe({ items: t, pos: r, onClose: a, minWidth: d = 200, theme: f = "light" }) {
	let p = r.minWidth ?? d, m = Ne[f], h = o(null), g = Me(), [_, v] = s(null);
	if (n(() => {
		let e = (e) => {
			h.current && !h.current.contains(e.target) && a();
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [a]), i(() => {
		let e = h.current;
		if (!e || g) return;
		let t = () => {
			let t = window.innerWidth, n = window.innerHeight;
			e.style.maxHeight = `${n - 16}px`, e.style.maxWidth = `${t - 16}px`, e.style.overflowY = "auto", e.style.left = `${r.left}px`, e.style.top = `${r.top}px`;
			let i = e.getBoundingClientRect(), a = r.left, o = r.top;
			a + i.width > t - 8 && (a = t - 8 - i.width), o + i.height > n - 8 && (o = n - 8 - i.height), a < 8 && (a = 8), o < 8 && (o = 8), e.style.left = `${a}px`, e.style.top = `${o}px`;
		};
		return t(), window.addEventListener("resize", t), () => window.removeEventListener("resize", t);
	}, [r, g]), g) {
		let n = _ ? _.items : t, r = {
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
		return R(/* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
			className: "fixed inset-0 z-[9998]",
			style: { background: "rgba(0,0,0,0.35)" },
			onClick: a
		}), /* @__PURE__ */ u("div", {
			ref: h,
			onMouseDown: (e) => e.stopPropagation(),
			className: "fixed left-0 right-0 bottom-0 z-[9999]",
			style: {
				background: m.bg,
				color: m.text,
				borderTopLeftRadius: 16,
				borderTopRightRadius: 16,
				maxHeight: "78vh",
				overflowY: "auto",
				paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
				boxShadow: "0 -8px 30px rgba(0,0,0,0.28)",
				animation: "kbnSheetUp 0.18s ease-out"
			},
			children: [
				/* @__PURE__ */ l("style", { children: "@keyframes kbnSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}" }),
				/* @__PURE__ */ l("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						padding: "8px 0 2px"
					},
					children: /* @__PURE__ */ l("div", { style: {
						width: 38,
						height: 4,
						borderRadius: 2,
						background: m.sep
					} })
				}),
				_ && /* @__PURE__ */ u("button", {
					onClick: () => v(null),
					style: {
						...r,
						color: m.text,
						fontWeight: 600,
						borderBottom: `1px solid ${m.sep}`
					},
					children: [/* @__PURE__ */ l("span", {
						style: {
							width: 20,
							flexShrink: 0,
							color: m.accent,
							fontSize: 18,
							display: "inline-flex",
							alignItems: "center"
						},
						children: "‹"
					}), /* @__PURE__ */ l("span", {
						style: { flex: 1 },
						children: _.label
					})]
				}),
				n.map((t, n) => {
					if (t.type === "separator") return /* @__PURE__ */ l("div", { style: {
						background: m.sep,
						height: 1,
						margin: "4px 0"
					} }, n);
					if (t.type === "label") return /* @__PURE__ */ l("div", {
						style: {
							padding: "8px 20px 4px",
							fontSize: 12,
							color: m.label,
							fontWeight: 600,
							textTransform: "uppercase",
							letterSpacing: "0.05em"
						},
						children: t.text
					}, n);
					if (t.type === "custom") return /* @__PURE__ */ l(e.Fragment, { children: t.render(a) }, n);
					if (t.type === "submenu") return /* @__PURE__ */ u("button", {
						disabled: t.disabled,
						onClick: () => v({
							label: t.label,
							items: t.items
						}),
						style: {
							...r,
							color: m.text,
							opacity: t.disabled ? .4 : 1
						},
						children: [
							/* @__PURE__ */ l("span", {
								style: {
									width: 20,
									flexShrink: 0,
									color: m.accent,
									fontSize: 16,
									display: "inline-flex",
									alignItems: "center"
								},
								children: t.icon ?? ""
							}),
							/* @__PURE__ */ l("span", {
								style: { flex: 1 },
								children: t.label
							}),
							/* @__PURE__ */ l("span", {
								style: {
									color: m.label,
									fontSize: 16,
									flexShrink: 0
								},
								children: "›"
							})
						]
					}, n);
					let i = t.danger ? m.danger : m.text;
					return /* @__PURE__ */ u("button", {
						disabled: t.disabled,
						onClick: () => {
							t.onClick(), a();
						},
						style: {
							...r,
							color: i,
							opacity: t.disabled ? .4 : 1
						},
						children: [/* @__PURE__ */ l("span", {
							style: {
								width: 20,
								flexShrink: 0,
								color: t.danger ? m.danger : m.accent,
								fontSize: 16,
								display: "inline-flex",
								alignItems: "center"
							},
							children: t.checked ? "✓" : t.icon ? t.icon : ""
						}), /* @__PURE__ */ l("span", {
							style: { flex: 1 },
							children: t.label
						})]
					}, n);
				})
			]
		})] }), document.body);
	}
	return R(/* @__PURE__ */ l("div", {
		ref: h,
		onMouseDown: (e) => {
			e.preventDefault(), e.stopPropagation();
		},
		style: {
			position: "fixed",
			top: r.top,
			left: r.left,
			minWidth: p,
			zIndex: 9999,
			background: m.bg,
			borderRadius: 4,
			padding: "4px 0",
			boxShadow: m.shadow
		},
		children: t.map((t, n) => {
			if (t.type === "separator") return /* @__PURE__ */ l("div", { style: {
				background: m.sep,
				height: 1,
				margin: "4px 0"
			} }, n);
			if (t.type === "label") return /* @__PURE__ */ l("div", {
				style: {
					padding: "4px 16px",
					fontSize: 11,
					color: m.label,
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: "0.05em"
				},
				children: t.text
			}, n);
			if (t.type === "submenu") return /* @__PURE__ */ l(Fe, {
				item: t,
				onClose: a,
				theme: f
			}, n);
			if (t.type === "custom") return /* @__PURE__ */ l(e.Fragment, { children: t.render(a) }, n);
			let r = t.danger ? m.danger : m.text;
			return /* @__PURE__ */ u("button", {
				disabled: t.disabled,
				onClick: () => {
					t.onClick(), a();
				},
				className: "w-full flex items-center gap-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
				style: {
					padding: "6px 24px 6px 16px",
					fontSize: 13,
					color: r,
					lineHeight: "20px"
				},
				onMouseEnter: (e) => {
					t.disabled || (e.currentTarget.style.background = m.hover);
				},
				onMouseLeave: (e) => {
					e.currentTarget.style.background = "";
				},
				children: [
					/* @__PURE__ */ l("span", {
						style: {
							width: 20,
							flexShrink: 0,
							color: t.danger ? m.danger : m.accent,
							fontSize: 14,
							display: "inline-flex",
							alignItems: "center"
						},
						children: t.checked ? "✓" : t.icon ? t.icon : ""
					}),
					/* @__PURE__ */ l("span", {
						className: "flex-1",
						children: t.label
					}),
					t.shortcut && /* @__PURE__ */ l("span", {
						style: {
							color: m.shortcut,
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
function Fe({ item: t, onClose: n, theme: r }) {
	let [i, a] = e.useState(null), s = Ne[r], c = o(null), d = o(void 0), f = () => {
		d.current && clearTimeout(d.current);
		let e = c.current?.getBoundingClientRect();
		if (!e) return;
		let t = e.right + 220 > window.innerWidth - 8 && e.left - 220 > 8 ? e.left - 220 + 2 : e.right - 2;
		a({
			top: e.top - 4,
			left: t,
			minWidth: 220
		});
	}, p = () => {
		d.current && clearTimeout(d.current), d.current = setTimeout(() => a(null), 180);
	};
	return /* @__PURE__ */ u("div", {
		onMouseEnter: f,
		onMouseLeave: p,
		style: { position: "relative" },
		children: [/* @__PURE__ */ u("button", {
			ref: c,
			disabled: t.disabled,
			className: "w-full flex items-center gap-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
			style: {
				padding: "6px 24px 6px 16px",
				fontSize: 13,
				color: s.text,
				lineHeight: "20px",
				background: i ? s.hover : ""
			},
			children: [
				/* @__PURE__ */ l("span", {
					style: {
						width: 20,
						flexShrink: 0,
						color: s.accent,
						fontSize: 14,
						display: "inline-flex",
						alignItems: "center"
					},
					children: t.icon ?? ""
				}),
				/* @__PURE__ */ l("span", {
					className: "flex-1",
					children: t.label
				}),
				/* @__PURE__ */ l("span", {
					style: {
						color: s.label,
						fontSize: 12,
						marginLeft: 24,
						flexShrink: 0
					},
					children: "▸"
				})
			]
		}), i && /* @__PURE__ */ l("div", {
			onMouseEnter: f,
			onMouseLeave: p,
			children: /* @__PURE__ */ l(Pe, {
				items: t.items,
				pos: i,
				onClose: n,
				theme: r
			})
		})]
	});
}
function Ie() {
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
//#region ../../src/ui/Checkbox.tsx
var Le = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-sm border-2 cursor-pointer transition-colors checked:bg-[var(--ck)] checked:border-[var(--ck)] before:content-[''] before:w-[11px] before:h-[11px] before:scale-0 before:origin-center before:transition-transform before:duration-100 checked:before:scale-100 before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)] before:shadow-[inset_1em_1em_#fff] disabled:cursor-not-allowed disabled:opacity-50", Re = {
	default: "border-[#dadce0] hover:border-[#5f6368]",
	dark: "border-[#555] hover:border-[#808080] bg-[#3c3c3c]"
}, ze = {
	default: {
		label: "text-sm text-[#202124]",
		desc: "text-xs text-[#5f6368]"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function Be({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: c }) {
	let d = a ?? (i === "dark" ? "#007acc" : "#1a73e8");
	return /* @__PURE__ */ u("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--ck": d
		},
		children: [/* @__PURE__ */ l("input", {
			type: "checkbox",
			checked: e,
			disabled: o,
			onChange: (e) => t(e.target.checked),
			className: I(Le, Re[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ u("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ l("span", {
				className: L("leading-snug", ze[i].label, c),
				children: n
			}), r && /* @__PURE__ */ l("span", {
				className: L("leading-snug mt-0.5", ze[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/Radio.tsx
var Ve = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-full border-2 cursor-pointer transition-colors checked:border-[var(--rb)] before:content-[''] before:w-[10px] before:h-[10px] before:rounded-full before:bg-[var(--rb)] before:scale-0 before:transition-transform before:duration-100 checked:before:scale-100 disabled:cursor-not-allowed disabled:opacity-50", He = {
	default: "border-[#dadce0] hover:border-[#5f6368]",
	dark: "border-[#555] hover:border-[#808080]"
}, Ue = {
	default: {
		label: "text-sm text-[#202124]",
		desc: "text-xs text-[#5f6368]"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function We({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: c }) {
	let d = a ?? (i === "dark" ? "#007acc" : "#1a73e8");
	return /* @__PURE__ */ u("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--rb": d
		},
		children: [/* @__PURE__ */ l("input", {
			type: "radio",
			checked: e,
			disabled: o,
			onClick: () => {
				o || t(!e);
			},
			onChange: () => {},
			className: I(Ve, He[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ u("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ l("span", {
				className: L("leading-snug", Ue[i].label, c),
				children: n
			}), r && /* @__PURE__ */ l("span", {
				className: L("leading-snug mt-0.5", Ue[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/FloatCheckbox.tsx
function Ge({ selected: e, onToggle: t, className: n }) {
	return /* @__PURE__ */ l("div", {
		role: "checkbox",
		"aria-checked": e,
		onClick: (e) => {
			e.stopPropagation(), t();
		},
		className: I("transition-opacity cursor-pointer", e ? "opacity-100" : "opacity-0 group-hover:opacity-100", n),
		children: /* @__PURE__ */ l("div", {
			className: I("w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors", e ? "bg-primary border-primary" : "bg-black/30 border-white"),
			children: e && /* @__PURE__ */ l("span", {
				className: "text-white text-[10px] font-bold leading-none",
				children: "✓"
			})
		})
	});
}
//#endregion
//#region ../../src/ui/Toggle.tsx
function Ke({ label: e, description: t, size: n = "md", className: r, id: i, ...a }) {
	let o = i ?? e?.toLowerCase().replace(/\s+/g, "-"), s = n === "sm" ? "h-4 w-7" : "h-5 w-9", c = n === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", d = n === "sm" ? "peer-checked:translate-x-3" : "peer-checked:translate-x-4";
	return /* @__PURE__ */ u("label", {
		htmlFor: o,
		className: I("inline-flex items-start gap-2.5 cursor-pointer select-none", a.disabled && "cursor-not-allowed opacity-50", r),
		children: [/* @__PURE__ */ u("div", {
			className: "relative flex-shrink-0 mt-0.5",
			children: [
				/* @__PURE__ */ l("input", {
					type: "checkbox",
					id: o,
					className: "peer sr-only",
					...a
				}),
				/* @__PURE__ */ l("div", { className: I(s, "rounded-full border border-border bg-surface-3 transition-colors", "peer-checked:bg-primary peer-checked:border-primary", "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1") }),
				/* @__PURE__ */ l("div", { className: I(c, "absolute top-[3px] left-[3px] rounded-full bg-white shadow-sm transition-transform", d) })
			]
		}), (e || t) && /* @__PURE__ */ u("div", {
			className: "flex flex-col gap-0.5",
			children: [e && /* @__PURE__ */ l("span", {
				className: "text-sm text-text-primary leading-5",
				children: e
			}), t && /* @__PURE__ */ l("span", {
				className: "text-xs text-text-secondary",
				children: t
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/Badge.tsx
var qe = {
	default: "bg-surface-2 text-text-secondary",
	primary: "bg-primary-light text-primary",
	success: "bg-success-light text-success",
	warning: "bg-warning-light text-warning",
	danger: "bg-danger-light text-danger",
	neutral: "bg-surface-3 text-text-primary"
}, Je = {
	default: "bg-text-tertiary",
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
	danger: "bg-danger",
	neutral: "bg-text-secondary"
}, Ye = {
	sm: "text-[10px] px-1.5 py-0.5",
	md: "text-xs px-2 py-0.5"
};
function Xe({ children: e, variant: t = "default", size: n = "md", className: r, dot: i = !1 }) {
	return /* @__PURE__ */ u("span", {
		className: I("inline-flex items-center gap-1 rounded-full font-medium", qe[t], Ye[n], r),
		children: [i && /* @__PURE__ */ l("span", { className: I("h-1.5 w-1.5 rounded-full flex-shrink-0", Je[t]) }), e]
	});
}
//#endregion
//#region ../../src/ui/Spinner.tsx
var Ze = {
	xs: "h-3 w-3 border",
	sm: "h-4 w-4 border-2",
	md: "h-6 w-6 border-2",
	lg: "h-8 w-8 border-[3px]"
};
function Qe({ size: e = "md", className: t, label: n = "Chargement…" }) {
	return /* @__PURE__ */ l("span", {
		role: "status",
		"aria-label": n,
		className: I("inline-block rounded-full border-border border-t-primary animate-spin", Ze[e], t)
	});
}
function $e({ label: e = "Chargement…" }) {
	return /* @__PURE__ */ l("div", {
		className: "absolute inset-0 flex items-center justify-center bg-white/70 z-10",
		children: /* @__PURE__ */ l(Qe, {
			size: "lg",
			label: e
		})
	});
}
//#endregion
//#region ../../src/ui/Separator.tsx
function et({ orientation: e = "horizontal", className: t }) {
	return /* @__PURE__ */ l("div", {
		role: "separator",
		"aria-orientation": e,
		className: I("bg-border flex-shrink-0", e === "horizontal" ? "h-px w-full" : "w-px self-stretch", t)
	});
}
//#endregion
//#region ../../src/ui/DatePicker.tsx
var tt = [
	"L",
	"M",
	"M",
	"J",
	"V",
	"S",
	"D"
], nt = [
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
function rt(e, t) {
	if (!e) return null;
	try {
		if (t === "time") {
			let [t, n] = e.split(":").map(Number);
			if (isNaN(t) || isNaN(n)) return null;
			let r = /* @__PURE__ */ new Date();
			return r.setHours(t, n, 0, 0), r;
		}
		let n = ae(e);
		return ie(n) ? n : null;
	} catch {
		return null;
	}
}
function it(e, t) {
	return e ? t === "date" ? H(e, "dd/MM/yyyy") : t === "time" ? H(e, "HH:mm") : t === "datetime" ? H(e, "dd/MM/yyyy HH:mm") : "" : "";
}
function at(e, t) {
	return e ? t === "date" ? H(e, "yyyy-MM-dd") : t === "time" ? H(e, "HH:mm") : t === "datetime" ? H(e, "yyyy-MM-dd'T'HH:mm") : null : null;
}
function ot(e) {
	return te({
		start: J(oe(e), { weekStartsOn: 1 }),
		end: V(B(e), { weekStartsOn: 1 })
	});
}
function st(e) {
	let t = e - e % 12;
	return Array.from({ length: 12 }, (e, n) => t + n);
}
function ct(e, t, n) {
	let r = e.getBoundingClientRect(), i = window.innerHeight - r.bottom - 8, a = r.top - 8;
	return {
		top: i >= t || i >= a ? r.bottom + window.scrollY + 4 : r.top + window.scrollY - t - 4,
		left: Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - n - 8))
	};
}
function lt({ values: e, selected: t, onSelect: r, label: i }) {
	let a = o(null), s = o(null);
	return n(() => {
		let e = s.current, t = a.current;
		!e || !t || (t.scrollTop = e.offsetTop - t.clientHeight / 2 + e.clientHeight / 2);
	}, [t, i]), /* @__PURE__ */ u("div", {
		className: "flex flex-col items-center w-14",
		children: [/* @__PURE__ */ l("span", {
			className: "text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1",
			children: i
		}), /* @__PURE__ */ l("div", {
			ref: a,
			className: "relative overflow-y-auto h-40",
			style: { scrollbarWidth: "none" },
			children: e.map((e) => /* @__PURE__ */ l("button", {
				ref: e === t ? s : void 0,
				type: "button",
				onClick: () => r(e),
				className: I("w-14 h-8 flex items-center justify-center text-sm rounded transition-colors", e === t ? "bg-primary/10 text-primary font-semibold" : "text-text-primary hover:bg-surface-2"),
				children: String(e).padStart(2, "0")
			}, e))
		})]
	});
}
function ut({ viewDate: e, setViewDate: n, view: r, setView: i, selected: o, onSelect: s, rangeStart: c, rangeEnd: d, hoverDate: f, setHoverDate: p, isRange: m, minDate: h, maxDate: v, disabledDate: y }) {
	let b = h ? ae(h) : null, x = v ? ae(v) : null, S = t((e) => b && K(e, b) || x && G(e, x) ? !0 : y ? y(e) : !1, [
		b,
		x,
		y
	]), C = a(() => d || (c && !d && f ? f : null), [
		c,
		d,
		f
	]), w = t((e) => {
		if (!m || !c || !C) return !1;
		let [t, n] = K(c, C) ? [c, C] : [C, c];
		return G(e, t) && K(e, n);
	}, [
		m,
		c,
		C
	]), T = t((e) => m ? c && q(e, c) || C && q(e, C) : !1, [
		m,
		c,
		C
	]), E = a(() => st(W(e)), [e]);
	if (r === "day") {
		let t = ot(e), r = H(e, "MMMM", { locale: se }), a = r.charAt(0).toUpperCase() + r.slice(1);
		return /* @__PURE__ */ u("div", { children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center gap-1 mb-2",
				children: [
					/* @__PURE__ */ l("button", {
						type: "button",
						onClick: () => n(Y(e, 1)),
						className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
						children: /* @__PURE__ */ l(g, { size: 14 })
					}),
					/* @__PURE__ */ u("div", {
						className: "flex-1 flex items-center justify-center gap-1",
						children: [/* @__PURE__ */ l("button", {
							type: "button",
							onClick: () => i("month"),
							className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
							children: a
						}), /* @__PURE__ */ l("button", {
							type: "button",
							onClick: () => i("year"),
							className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
							children: W(e)
						})]
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						onClick: () => n(z(e, 1)),
						className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
						children: /* @__PURE__ */ l(_, { size: 14 })
					})
				]
			}),
			/* @__PURE__ */ l("div", {
				className: "grid grid-cols-7 mb-0.5",
				children: tt.map((e, t) => /* @__PURE__ */ l("div", {
					className: "h-7 flex items-center justify-center text-[11px] font-medium text-text-tertiary",
					children: e
				}, t))
			}),
			/* @__PURE__ */ l("div", {
				className: "grid grid-cols-7",
				onMouseLeave: () => p?.(null),
				children: t.map((t, n) => {
					let r = ne(t, e), i = !m && o && q(t, o), a = T(t), c = w(t), u = S(t), d = re(t);
					return /* @__PURE__ */ l("button", {
						type: "button",
						disabled: u,
						onClick: () => !u && s(t),
						onMouseEnter: () => p?.(t),
						className: I("h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium transition-colors", i || a ? "rounded-full bg-primary text-white" : "", !i && !a && c ? "bg-primary/10 text-primary" : "", !i && !a && !c && !u && d ? "rounded-full border border-primary text-primary hover:bg-primary-light" : "", !i && !a && !c && !u && !d && r ? "rounded-full text-text-primary hover:bg-surface-2" : "", !i && !a && !c && !u && !d && !r ? "rounded-full text-text-tertiary hover:bg-surface-2" : "", u ? "opacity-30 cursor-not-allowed rounded-full" : ""),
						children: H(t, "d")
					}, n);
				})
			})
		] });
	}
	return r === "month" ? /* @__PURE__ */ u("div", { children: [/* @__PURE__ */ u("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => n((e) => {
					let t = new Date(e);
					return t.setFullYear(W(e) - 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ l(g, { size: 14 })
			}),
			/* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => i("year"),
				className: "flex-1 text-sm font-semibold text-center text-text-primary hover:text-primary transition-colors rounded hover:bg-surface-1 py-0.5",
				children: W(e)
			}),
			/* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => n((e) => {
					let t = new Date(e);
					return t.setFullYear(W(e) + 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ l(_, { size: 14 })
			})
		]
	}), /* @__PURE__ */ l("div", {
		className: "grid grid-cols-3 gap-1",
		children: nt.map((t, r) => /* @__PURE__ */ l("button", {
			type: "button",
			onClick: () => {
				n((e) => {
					let t = new Date(e);
					return t.setMonth(r), t;
				}), i("day");
			},
			className: I("h-9 rounded-lg text-sm font-medium transition-colors", o && U(o) === r && W(o) === W(e) ? "bg-primary text-white" : "text-text-primary hover:bg-surface-2"),
			children: t
		}, r))
	})] }) : /* @__PURE__ */ u("div", { children: [/* @__PURE__ */ u("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => n((e) => {
					let t = new Date(e);
					return t.setFullYear(W(e) - 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ l(g, { size: 14 })
			}),
			/* @__PURE__ */ u("span", {
				className: "flex-1 text-sm font-semibold text-center text-text-primary",
				children: [
					E[0],
					" – ",
					E[E.length - 1]
				]
			}),
			/* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => n((e) => {
					let t = new Date(e);
					return t.setFullYear(W(e) + 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ l(_, { size: 14 })
			})
		]
	}), /* @__PURE__ */ l("div", {
		className: "grid grid-cols-3 gap-1",
		children: E.map((e) => {
			let t = o && W(o) === e, r = W(/* @__PURE__ */ new Date()) === e;
			return /* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => {
					n((t) => {
						let n = new Date(t);
						return n.setFullYear(e), n;
					}), i("month");
				},
				className: I("h-9 rounded-lg text-sm font-medium transition-colors", t ? "bg-primary text-white" : r ? "border border-primary text-primary hover:bg-primary-light" : "text-text-primary hover:bg-surface-2"),
				children: e
			}, e);
		})
	})] });
}
function dt({ mode: e = "date", value: r, onChange: i, startValue: c, endValue: d, onRangeChange: f, label: m, placeholder: h, disabled: g = !1, readOnly: _ = !1, clearable: v = !1, required: y, error: x, hint: S, minDate: C, maxDate: w, disabledDate: T, minuteStep: E = 5, size: D = "md", className: O, id: k, name: A }) {
	let j = o(null), M = o(null), [N, P] = s(!1), [F, L] = s("day"), [z, te] = s(/* @__PURE__ */ new Date()), B = a(() => rt(r, e), [r, e]), V = a(() => rt(c, "date"), [c]), H = a(() => rt(d, "date"), [d]), [U, W] = s(() => B?.getHours() ?? 0), [G, q] = s(() => B?.getMinutes() ?? 0), [ne, re] = s("first"), [ie, ae] = s(null), [oe, J] = s(null), [Y, se] = s({
		top: 0,
		left: 0
	}), ce = k ?? (typeof m == "string" ? m.toLowerCase().replace(/\s+/g, "-") : void 0), le = a(() => {
		if (e === "daterange") {
			let e = V, t = H;
			return e ? t ? `${it(e, "date")} – ${it(t, "date")}` : it(e, "date") : "";
		}
		return it(B, e);
	}, [
		e,
		B,
		V,
		H
	]), ue = t(() => {
		if (g || _) return;
		let t = j.current;
		t && (se(ct(t, e === "time" ? 230 : e === "datetime" ? 480 : 340, e === "time" ? 172 : 284)), te(e === "daterange" ? V ?? /* @__PURE__ */ new Date() : B ?? /* @__PURE__ */ new Date()), L("day"), B && (e === "time" || e === "datetime") && (W(B.getHours()), q(B.getMinutes())), e === "daterange" && (re("first"), ae(null), J(null)), P(!0));
	}, [
		g,
		_,
		e,
		B,
		V
	]);
	n(() => {
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
	let de = t((t) => {
		if (e === "daterange") {
			if (ne === "first") ae(t), re("second"), f?.(at(t, "date"), null);
			else {
				let e = ie ?? t, [n, r] = K(e, t) ? [e, t] : [t, e];
				f?.(at(n, "date"), at(r, "date")), P(!1);
			}
			return;
		}
		if (e === "date") {
			i?.(at(t, "date")), P(!1);
			return;
		}
		if (e === "datetime") {
			let e = new Date(t);
			e.setHours(U, G, 0, 0), i?.(at(e, "datetime"));
		}
	}, [
		e,
		ne,
		ie,
		U,
		G,
		i,
		f
	]), fe = t((t, n) => {
		let r = e === "datetime" && B ? new Date(B) : /* @__PURE__ */ new Date();
		r.setHours(t, n, 0, 0), i?.(at(r, e));
	}, [
		e,
		B,
		i
	]), pe = t((e) => {
		W(e), fe(e, G);
	}, [G, fe]), me = t((e) => {
		q(e), fe(U, e);
	}, [U, fe]), he = (t) => {
		t.stopPropagation(), e === "daterange" ? f?.(null, null) : i?.(null);
	}, ge = v && (e === "daterange" ? !!(c || d) : !!r) && !g && !_, _e = D === "sm" ? "h-7 text-xs" : "h-9 text-sm", ve = l(e === "time" ? b : p, { size: 14 }), ye = {
		date: "jj/mm/aaaa",
		time: "hh:mm",
		datetime: "jj/mm/aaaa hh:mm",
		daterange: "jj/mm/aaaa – jj/mm/aaaa"
	}[e], be = Array.from({ length: 24 }, (e, t) => t), xe = Array.from({ length: Math.ceil(60 / E) }, (e, t) => t * E), Se = e !== "time", Ce = e === "time" || e === "datetime", we = e === "time" ? 172 : 284, Te = ie ?? V, Ee = ie ? null : H;
	return /* @__PURE__ */ u("div", {
		className: I("flex flex-col gap-1", O),
		children: [
			m && /* @__PURE__ */ u("label", {
				htmlFor: ce,
				className: "text-sm font-medium text-text-primary",
				children: [m, y && /* @__PURE__ */ l("span", {
					className: "text-danger ml-0.5",
					children: "*"
				})]
			}),
			/* @__PURE__ */ u("div", {
				className: "relative",
				children: [A && /* @__PURE__ */ l("input", {
					type: "hidden",
					name: A,
					value: r ?? "",
					readOnly: !0
				}), /* @__PURE__ */ u("button", {
					ref: j,
					id: ce,
					type: "button",
					onClick: ue,
					disabled: g,
					"aria-haspopup": "dialog",
					"aria-expanded": N,
					className: I("w-full flex items-center gap-2 px-3 rounded border bg-white text-left", "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", x ? "border-danger focus:ring-danger" : "border-border", g && "bg-surface-2 cursor-not-allowed opacity-60", _ && "cursor-default", _e),
					children: [
						/* @__PURE__ */ l("span", {
							className: "text-text-tertiary shrink-0",
							children: ve
						}),
						/* @__PURE__ */ l("span", {
							className: I("flex-1 truncate", le ? "text-text-primary" : "text-text-tertiary"),
							children: le || (h ?? ye)
						}),
						ge ? /* @__PURE__ */ l("button", {
							type: "button",
							onClick: he,
							className: "shrink-0 text-text-tertiary hover:text-text-primary transition-colors",
							tabIndex: -1,
							children: /* @__PURE__ */ l(ee, { size: 13 })
						}) : null
					]
				})]
			}),
			x && /* @__PURE__ */ l("p", {
				className: "text-xs text-danger",
				children: x
			}),
			S && !x && /* @__PURE__ */ l("p", {
				className: "text-xs text-text-secondary",
				children: S
			}),
			N && R(/* @__PURE__ */ l("div", {
				ref: M,
				role: "dialog",
				style: {
					position: "absolute",
					top: Y.top,
					left: Y.left,
					width: we,
					zIndex: 9999
				},
				className: "bg-white rounded-xl shadow-2xl border border-border",
				children: /* @__PURE__ */ u("div", {
					className: "p-3 select-none",
					children: [
						Se && /* @__PURE__ */ l(ut, {
							viewDate: z,
							setViewDate: te,
							view: F,
							setView: L,
							selected: B,
							onSelect: de,
							rangeStart: Te,
							rangeEnd: Ee,
							hoverDate: oe,
							setHoverDate: J,
							isRange: e === "daterange",
							minDate: C,
							maxDate: w,
							disabledDate: T
						}),
						Se && Ce && /* @__PURE__ */ l("div", { className: "my-3 h-px bg-border" }),
						Ce && /* @__PURE__ */ u("div", {
							className: "flex items-start justify-center gap-1",
							children: [
								/* @__PURE__ */ l(lt, {
									values: be,
									selected: U,
									onSelect: pe,
									label: "Heure"
								}),
								/* @__PURE__ */ l("span", {
									className: "mt-8 text-text-tertiary text-base font-semibold",
									children: ":"
								}),
								/* @__PURE__ */ l(lt, {
									values: xe,
									selected: xe.includes(G) ? G : xe.reduce((e, t) => Math.abs(t - G) < Math.abs(e - G) ? t : e),
									onSelect: me,
									label: "Min"
								})
							]
						}),
						Ce && /* @__PURE__ */ u("div", {
							className: "flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border",
							children: [ge ? /* @__PURE__ */ l("button", {
								type: "button",
								onClick: (e) => {
									he(e), P(!1);
								},
								className: "text-xs text-text-secondary hover:text-danger transition-colors",
								children: "Effacer"
							}) : /* @__PURE__ */ l("span", {}), /* @__PURE__ */ l("button", {
								type: "button",
								onClick: () => {
									if (!r) {
										let t = e === "datetime" && B ? new Date(B) : /* @__PURE__ */ new Date();
										t.setHours(U, G, 0, 0), i?.(at(t, e));
									}
									P(!1);
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
//#region ../../src/ui/Tabs.tsx
function ft({ tabs: e, value: t, onChange: n, className: r, size: i = "md", variant: a = "underline" }) {
	let o = (e) => e === t, s = i === "sm" ? 14 : 16, c = I(a === "underline" && "flex gap-1 border-b border-border overflow-x-auto overflow-y-hidden", a === "pills" && "flex gap-1", a === "stretched" && "flex border-b border-border", r), d = (e) => I("flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors", i === "sm" && "px-3 py-1.5 text-xs", i === "md" && "px-4 py-2 text-sm", (a === "underline" || a === "stretched") && "-mb-px border-b-2", (a === "underline" || a === "stretched") && o(e) && "border-primary text-primary", (a === "underline" || a === "stretched") && !o(e) && "border-transparent text-text-secondary hover:text-text-primary", a === "stretched" && "flex-1 justify-center", a === "pills" && "rounded-full", a === "pills" && o(e) && "bg-primary-light text-primary", a === "pills" && !o(e) && "text-text-secondary hover:bg-surface-2");
	return /* @__PURE__ */ l("div", {
		className: c,
		children: e.map((e) => {
			let t = e.icon;
			return /* @__PURE__ */ u("button", {
				type: "button",
				onClick: () => n(e.id),
				className: d(e.id),
				children: [
					t && /* @__PURE__ */ l(t, { size: s }),
					e.label,
					e.badge !== void 0 && /* @__PURE__ */ l("span", {
						className: I("rounded-full text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1", o(e.id) ? "bg-primary text-white" : "bg-surface-3 text-text-secondary"),
						children: e.badge
					})
				]
			}, e.id);
		})
	});
}
//#endregion
//#region ../../src/ui/ResizeHandle.tsx
function pt({ position: e, onResize: t, min: n = 160, max: r = 560, onReset: i, title: a }) {
	return /* @__PURE__ */ u("div", {
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
		children: [/* @__PURE__ */ l("div", { className: "absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/40 transition-colors" }), /* @__PURE__ */ l("div", {
			className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center\n                      h-9 w-3.5 rounded-full bg-surface-0 border border-border text-text-tertiary shadow-sm\n                      opacity-80 group-hover:opacity-100 group-hover:bg-primary-light group-hover:text-primary\n                      group-hover:border-primary/40 transition",
			children: /* @__PURE__ */ l(C, { size: 13 })
		})]
	});
}
function mt(e, t, r = 160, i = 560) {
	let [a, o] = s(() => {
		let n = Number(localStorage.getItem(e));
		return n >= r && n <= i ? n : t;
	});
	return n(() => {
		try {
			localStorage.setItem(e, String(a));
		} catch {}
	}, [e, a]), [a, o];
}
//#endregion
//#region ../../src/ui/StartPage.tsx
var ht = "kubuno.startpage.recentW", gt = 180, _t = 520, vt = 256;
function yt({ recentTitle: e = "Récents", recentIcon: t, recentItems: n, recentEmpty: r, tabs: i, defaultTab: a, activeTab: o, onTabChange: d }) {
	let [f, p] = s(a ?? i[0]?.id ?? ""), m = o ?? f, [h, g] = mt(ht, vt, gt, _t), _ = (e) => {
		d?.(e), o === void 0 && p(e);
	}, v = i.map((e) => ({
		id: e.id,
		label: e.label
	})), y = i.find((e) => e.id === m) ?? i[0], [x, S] = s(null), C = (e, t) => {
		!t.actions || t.actions.length === 0 || (e.preventDefault(), S({
			x: Math.min(e.clientX, window.innerWidth - 200),
			y: Math.min(e.clientY, window.innerHeight - (t.actions.length * 36 + 16)),
			actions: t.actions
		}));
	};
	return /* @__PURE__ */ u("div", {
		className: "relative flex h-full overflow-hidden bg-white",
		children: [
			/* @__PURE__ */ u("aside", {
				className: "hidden lg:flex flex-shrink-0 bg-surface-1 flex-col overflow-hidden",
				style: { width: h },
				children: [/* @__PURE__ */ u("div", {
					className: "px-4 h-[57px] flex items-center gap-2 border-b border-border flex-shrink-0",
					children: [/* @__PURE__ */ l("span", {
						className: "text-text-tertiary flex-shrink-0",
						children: t ?? /* @__PURE__ */ l(b, { size: 15 })
					}), /* @__PURE__ */ l("span", {
						className: "text-sm font-medium text-text-primary",
						children: e
					})]
				}), n.length === 0 ? /* @__PURE__ */ l("div", {
					className: "flex-1 flex items-center justify-center px-4 text-center",
					children: r ?? /* @__PURE__ */ l("p", {
						className: "text-text-tertiary text-xs",
						children: "—"
					})
				}) : /* @__PURE__ */ l("div", {
					className: "flex-1 overflow-y-auto py-1",
					children: n.map((e) => /* @__PURE__ */ u("button", {
						onClick: e.onClick,
						onContextMenu: (t) => C(t, e),
						className: `w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${e.pendingTone ? "pointer-events-none" : "hover:bg-surface-2"}`,
						style: e.pendingTone ? { backgroundColor: e.pendingTone === "permanent" ? "#fee2e2" : "#f3e8ff" } : void 0,
						children: [e.icon && /* @__PURE__ */ l("span", {
							className: "flex-shrink-0",
							children: e.icon
						}), /* @__PURE__ */ u("span", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ l("span", {
								className: "block text-sm text-text-primary truncate",
								title: e.name,
								children: e.name
							}), e.subtitle && /* @__PURE__ */ l("span", {
								className: "block text-[11px] text-text-tertiary",
								children: e.subtitle
							})]
						})]
					}, e.id))
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "hidden lg:block",
				children: /* @__PURE__ */ l(pt, {
					position: h,
					onResize: g,
					min: gt,
					max: _t,
					onReset: () => g(vt),
					title: e
				})
			}),
			/* @__PURE__ */ u("div", {
				className: "flex-1 min-w-0 flex flex-col overflow-hidden",
				children: [/* @__PURE__ */ l("div", {
					className: "px-6 h-[57px] flex items-center flex-shrink-0 border-b border-border",
					children: /* @__PURE__ */ l(ft, {
						tabs: v,
						value: m,
						onChange: _
					})
				}), /* @__PURE__ */ l("div", {
					className: "flex-1 min-h-0 overflow-hidden flex flex-col",
					children: y?.content
				})]
			}),
			x && /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
				className: "fixed inset-0 z-[9998]",
				onClick: () => S(null),
				onContextMenu: (e) => {
					e.preventDefault(), S(null);
				}
			}), /* @__PURE__ */ l("div", {
				className: "fixed z-[9999] min-w-[190px] bg-white border border-border rounded-lg shadow-lg py-1",
				style: {
					top: x.y,
					left: x.x
				},
				children: x.actions.map((e) => /* @__PURE__ */ u("button", {
					onClick: () => {
						S(null), e.onClick();
					},
					className: `w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                  ${e.danger ? "text-danger hover:bg-danger/10" : "text-text-primary hover:bg-surface-1"}`,
					children: [e.icon && /* @__PURE__ */ l("span", {
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
function bt({ size: e = 24, className: t, title: n = "Kubuno" }) {
	return /* @__PURE__ */ u("svg", {
		width: Math.round(e * 321 / 346),
		height: e,
		viewBox: "0 0 321 346",
		fill: "currentColor",
		role: "img",
		"aria-label": n,
		className: t,
		children: [/* @__PURE__ */ l("title", { children: n }), /* @__PURE__ */ u("g", {
			transform: "translate(0,346) scale(0.1,-0.1)",
			stroke: "none",
			children: [
				/* @__PURE__ */ l("path", { d: "M264 3307 c-3 -8 -3 -434 -1 -948 3 -913 3 -936 24 -1009 70 -249 198 -454 419 -672 125 -123 303 -268 328 -268 3 0 5 654 4 1452 l-3 1453 -383 3 c-313 2 -383 0 -388 -11z" }),
				/* @__PURE__ */ l("path", { d: "M1187 3313 c-4 -3 -7 -680 -7 -1504 l0 -1498 27 -19 c38 -27 279 -165 354 -202 l61 -31 61 32 c34 17 87 47 118 65 31 19 60 34 64 34 3 0 26 14 51 30 l44 31 0 729 c0 608 2 731 14 742 7 7 112 110 233 228 120 118 343 336 496 484 l277 269 -2 306 -3 306 -204 3 -203 2 -87 -83 c-47 -47 -151 -147 -231 -225 l-145 -140 -5 -299 -5 -299 -60 -62 c-32 -34 -63 -62 -67 -62 -4 0 -9 262 -10 583 l-3 582 -381 3 c-209 1 -383 -1 -387 -5z" }),
				/* @__PURE__ */ l("path", { d: "M2217 1782 l-118 -117 1 -265 2 -265 225 -225 224 -225 61 64 c133 140 264 349 319 508 l20 58 -143 138 c-294 284 -459 442 -466 444 -4 1 -60 -51 -125 -115z" })
			]
		})]
	});
}
//#endregion
//#region ../../src/ui/color.ts
function X(e) {
	return [
		parseInt(e.slice(1, 3), 16),
		parseInt(e.slice(3, 5), 16),
		parseInt(e.slice(5, 7), 16)
	];
}
function Z(e, t, n) {
	return "#" + [
		e,
		t,
		n
	].map((e) => Math.max(0, Math.min(255, Math.round(e))).toString(16).padStart(2, "0")).join("");
}
function xt(e, t, n) {
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
function St(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function Ct(e, t, n) {
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
		St(i, r, e + 1 / 3) * 255,
		St(i, r, e) * 255,
		St(i, r, e - 1 / 3) * 255
	];
}
function wt(e, t, n) {
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
function Tt(e, t, n) {
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
var Et = {
	accent: "#5a9bdc",
	border: "#212121",
	text: "#d6d6d6",
	textDim: "#8e8e8e",
	toolbar: "#393939",
	surface: "#252525",
	title: "#c0c0c0"
}, Dt = {
	accent: "#1a73e8",
	border: "#dadce0",
	text: "#202124",
	textDim: "#5f6368",
	toolbar: "#ffffff",
	surface: "#f1f3f4",
	title: "#5f6368"
};
function Ot(e, t) {
	return typeof window > "u" ? t : getComputedStyle(document.documentElement).getPropertyValue(e).trim() || t;
}
function kt() {
	return {
		accent: Ot("--color-primary", "#1a73e8"),
		border: Ot("--color-border", "#dadce0"),
		text: Ot("--color-text-primary", "#202124"),
		textDim: Ot("--color-text-secondary", "#5f6368"),
		toolbar: Ot("--color-surface-0", "#ffffff"),
		surface: Ot("--color-surface-2", "#f1f3f4"),
		title: Ot("--color-text-secondary", "#5f6368")
	};
}
function At() {
	let [e, t] = s(kt);
	return n(() => {
		let e = new MutationObserver(() => t(kt()));
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
var jt = {
	layer_color_picker: "Couleur",
	layer_harmony_comp: "Complémentaire",
	layer_harmony_analog: "Analogues",
	layer_harmony_triad: "Triade",
	layer_harmony_tetrad: "Tétrade",
	layer_harmony_split: "Complémentaires divisées",
	layer_harmony_mono: "Monochrome",
	layer_color_recent: "Récemment utilisées",
	layer_color_cancel: "Annuler",
	layer_color_confirm: "Ajouter"
};
function Mt(e, t, n, r) {
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
function Nt({ size: e, h: t, s: r, v: i, shape: a, onChange: s }) {
	let c = o(null), d = o(!1), f = e / 2 - 1, p = e / 2, m = e / 2, h = .8660254, g = {
		w: [p, m - f],
		blk: [p - f * h, m + f * .5],
		hue: [p + f * h, m + f * .5]
	}, _ = (e, t, n, r, i) => {
		let a = (r[1] - i[1]) * (n[0] - i[0]) + (i[0] - r[0]) * (n[1] - i[1]), o = ((r[1] - i[1]) * (e - i[0]) + (i[0] - r[0]) * (t - i[1])) / a, s = ((i[1] - n[1]) * (e - i[0]) + (n[0] - i[0]) * (t - i[1])) / a;
		return [
			o,
			s,
			1 - o - s
		];
	}, v = () => {
		if (a === "triangle") {
			let e = 1 - i, t = r * i, n = (1 - r) * i;
			return [n * g.w[0] + t * g.hue[0] + e * g.blk[0], n * g.w[1] + t * g.hue[1] + e * g.blk[1]];
		}
		let t = r * e, n = (1 - i) * e;
		if (a === "circle") {
			let r = e / 2, i = e / 2, a = e / 2, o = t - r, s = n - i, c = Math.hypot(o, s);
			c > a && (o *= a / c, s *= a / c, t = r + o, n = i + s);
		}
		return [t, n];
	};
	n(() => {
		let n = c.current;
		if (!n) return;
		let r = n.getContext("2d"), i = Math.round(e * 3);
		n.width = i, n.height = i;
		let o = r.createImageData(i, i), s = o.data, l = i / 2, u = [g.w[0] * 3, g.w[1] * 3], d = [g.hue[0] * 3, g.hue[1] * 3], f = [g.blk[0] * 3, g.blk[1] * 3];
		for (let e = 0; e < i; e++) for (let n = 0; n < i; n++) {
			let r = 0, o = 0, c = !0;
			if (a === "triangle") {
				let [t, i, a] = _(n + .5, e + .5, u, d, f);
				t < 0 || i < 0 || a < 0 ? c = !1 : (o = 1 - a, r = t + i > 0 ? i / (t + i) : 0);
			} else if (a === "circle") {
				let t = n - l, a = e - l;
				Math.hypot(t, a) > l ? c = !1 : (r = n / i, o = 1 - e / i);
			} else r = n / i, o = 1 - e / i;
			let p = (e * i + n) * 4;
			if (!c) {
				s[p + 3] = 0;
				continue;
			}
			let [m, h, g] = Q(t, r, o);
			s[p] = m, s[p + 1] = h, s[p + 2] = g, s[p + 3] = 255;
		}
		r.putImageData(o, 0, 0);
	}, [
		t,
		a,
		e
	]);
	let y = (t) => {
		let n = c.current;
		if (!n) return;
		let r = n.getBoundingClientRect(), i = t.clientX - r.left, o = t.clientY - r.top;
		if (a === "triangle") {
			let [e, t, n] = _(i, o, g.w, g.hue, g.blk);
			e = Math.max(0, e), t = Math.max(0, t), n = Math.max(0, n);
			let r = e + t + n || 1;
			e /= r, t /= r, n /= r;
			let a = 1 - n;
			s(e + t > 0 ? t / (e + t) : 0, a);
			return;
		}
		if (a === "circle") {
			let t = e / 2, n = e / 2, r = e / 2, a = i - t, s = o - n, c = Math.hypot(a, s);
			c > r && (i = t + a * r / c, o = n + s * r / c);
		}
		s(Math.max(0, Math.min(1, i / e)), Math.max(0, Math.min(1, 1 - o / e)));
	};
	n(() => {
		let e = (e) => {
			d.current && y(e);
		}, t = () => {
			d.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let [b, x] = v();
	return /* @__PURE__ */ u("div", {
		className: "absolute",
		style: {
			left: (212 - e) / 2,
			top: (212 - e) / 2,
			width: e,
			height: e
		},
		children: [/* @__PURE__ */ l("canvas", {
			ref: c,
			onPointerDown: (e) => {
				d.current = !0, y(e);
			},
			style: {
				width: e,
				height: e,
				cursor: "crosshair",
				borderRadius: a === "circle" ? "50%" : 2
			}
		}), /* @__PURE__ */ l("div", {
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
function Pt({ label: e, value: t, max: r, track: i, onInput: a, C: s }) {
	let c = o(null), d = o(!1), f = (e) => {
		let t = c.current;
		if (!t) return;
		let n = t.getBoundingClientRect();
		a(Math.max(0, Math.min(1, (e.clientX - n.left) / n.width)) * r);
	};
	return n(() => {
		let e = (e) => {
			d.current && f(e);
		}, t = () => {
			d.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	}), /* @__PURE__ */ u("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ l("span", {
				className: "text-[10px] w-3 text-center",
				style: { color: s.textDim },
				children: e
			}),
			/* @__PURE__ */ l("div", {
				ref: c,
				onPointerDown: (e) => {
					d.current = !0, f(e);
				},
				className: "relative flex-1 h-3 cursor-pointer",
				style: {
					background: i,
					border: `1px solid ${s.border}`,
					borderRadius: 2
				},
				children: /* @__PURE__ */ l("div", {
					className: "absolute top-[-2px] bottom-[-2px] pointer-events-none",
					style: {
						width: 3,
						background: "#fff",
						boxShadow: "0 0 0 1px rgba(0,0,0,.6)",
						left: `calc(${t / r * 100}% - 1.5px)`,
						borderRadius: 2
					}
				})
			}),
			/* @__PURE__ */ l("input", {
				type: "number",
				min: 0,
				max: Math.round(r),
				value: Math.round(t),
				onChange: (e) => a(Math.max(0, Math.min(r, +e.target.value))),
				className: "w-11 h-5 text-[10px] text-center outline-none",
				style: {
					background: s.surface,
					color: s.text,
					border: `1px solid ${s.border}`,
					borderRadius: 2
				}
			})
		]
	});
}
function Ft({ t: e, color: t, onChange: r, onClose: i, C: a = Et, history: c = [], onPickHistory: d, onConfirm: f, onCancel: p, confirmLabel: m, cancelLabel: h }) {
	let g = {
		...Et,
		...a
	}, _ = (t) => e ? e(t) : jt[t] ?? t, [v, b, x] = X(t), [S, C, w] = wt(v, b, x), [T, E] = s(S), [D, O] = s(C), [k, A] = s(w), [j, N] = s("RGB"), [F, ee] = s("square"), [I, L] = s("comp");
	n(() => {
		let [e, n, r] = X(t);
		if (Z(...Q(T, D, k)).toLowerCase() !== t.toLowerCase()) {
			let [t, i, a] = wt(e, n, r);
			E(t), O(i), A(a);
		}
	}, [t]);
	let R = (e, t, n) => {
		E(e), O(t), A(n), r(Z(...Q(e, t, n)));
	}, z = (e, t, n) => {
		let [r, i, a] = wt(e, t, n);
		R(r, i, a);
	}, te = o(null), B = o(!1), V = (e) => {
		let t = te.current;
		if (!t) return;
		let n = t.getBoundingClientRect(), r = e.clientX - n.left - n.width / 2, i = e.clientY - n.top - n.height / 2, a = Math.atan2(r, -i) * 180 / Math.PI;
		a = (a + 360) % 360, R(a, D, k);
	};
	n(() => {
		let e = (e) => {
			B.current && V(e);
		}, t = () => {
			B.current = !1;
		};
		return window.addEventListener("pointermove", e), window.addEventListener("pointerup", t), () => {
			window.removeEventListener("pointermove", e), window.removeEventListener("pointerup", t);
		};
	});
	let [H, U, W] = Q(T, D, k).map(Math.round), G = Z(...Q(T, 1, 1)), K = Z(H, U, W), q = T * Math.PI / 180, ne = 212 / 2 + 95 * Math.sin(q), re = 212 / 2 - 95 * Math.cos(q), ie = Math.round(156 / Math.SQRT2), ae = F === "square" ? ie : 162, oe = Mt(I, T, D, k), J = (e, t, n) => Z(Math.round(e), Math.round(t), Math.round(n)), Y = [];
	if (j === "RGB") Y = [
		{
			l: "R",
			val: H,
			max: 255,
			track: `linear-gradient(to right,${J(0, U, W)},${J(255, U, W)})`,
			set: (e) => z(e, U, W)
		},
		{
			l: "G",
			val: U,
			max: 255,
			track: `linear-gradient(to right,${J(H, 0, W)},${J(H, 255, W)})`,
			set: (e) => z(H, e, W)
		},
		{
			l: "B",
			val: W,
			max: 255,
			track: `linear-gradient(to right,${J(H, U, 0)},${J(H, U, 255)})`,
			set: (e) => z(H, U, e)
		}
	];
	else if (j === "HSV") Y = [
		{
			l: "H",
			val: T,
			max: 360,
			track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
			set: (e) => R(e, D, k)
		},
		{
			l: "S",
			val: D * 100,
			max: 100,
			track: `linear-gradient(to right,${J(...Q(T, 0, k))},${J(...Q(T, 1, k))})`,
			set: (e) => R(T, e / 100, k)
		},
		{
			l: "V",
			val: k * 100,
			max: 100,
			track: `linear-gradient(to right,#000,${J(...Q(T, D, 1))})`,
			set: (e) => R(T, D, e / 100)
		}
	];
	else if (j === "HSL") {
		let [e, t, n] = xt(H, U, W);
		Y = [
			{
				l: "H",
				val: e,
				max: 360,
				track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
				set: (e) => z(...Ct(e, t, n))
			},
			{
				l: "S",
				val: t * 100,
				max: 100,
				track: `linear-gradient(to right,${J(...Ct(e, 0, n))},${J(...Ct(e, 1, n))})`,
				set: (t) => z(...Ct(e, t / 100, n))
			},
			{
				l: "L",
				val: n * 100,
				max: 100,
				track: `linear-gradient(to right,#000,${J(...Ct(e, t, .5))},#fff)`,
				set: (n) => z(...Ct(e, t, n / 100))
			}
		];
	} else if (j === "CMYK") {
		let [e, t, n, r] = Tt(H, U, W);
		Y = [
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
	} else Y = [{
		l: "K",
		val: Math.round((H + U + W) / 3) / 255 * 100,
		max: 100,
		track: "linear-gradient(to right,#000,#fff)",
		set: (e) => {
			let t = Math.round(e / 100 * 255);
			z(t, t, t);
		}
	}];
	return /* @__PURE__ */ u("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 236,
			background: g.toolbar,
			border: `1px solid ${g.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ l("span", {
					className: "text-[10px] font-medium",
					style: { color: g.title },
					children: _("layer_color_picker")
				}), /* @__PURE__ */ l("button", {
					onClick: i,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: g.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ u("div", {
				className: "relative mx-auto",
				style: {
					width: 212,
					height: 212
				},
				children: [
					/* @__PURE__ */ l("div", {
						ref: te,
						onPointerDown: (e) => {
							B.current = !0, V(e);
						},
						className: "absolute inset-0 rounded-full cursor-pointer",
						style: { background: "conic-gradient(#f00 0deg,#ff0 60deg,#0f0 120deg,#0ff 180deg,#00f 240deg,#f0f 300deg,#f00 360deg)" }
					}),
					/* @__PURE__ */ l("div", {
						className: "absolute rounded-full",
						style: {
							inset: 22,
							background: g.toolbar
						}
					}),
					/* @__PURE__ */ l("div", {
						className: "absolute rounded-full pointer-events-none",
						style: {
							width: 14,
							height: 14,
							border: "2px solid #fff",
							boxShadow: "0 0 0 1px rgba(0,0,0,.6)",
							background: G,
							left: ne - 7,
							top: re - 7
						}
					}),
					oe.slice(1).map((e, t) => {
						let n = e[0] * Math.PI / 180, r = 212 / 2 + 95 * Math.sin(n), i = 212 / 2 - 95 * Math.cos(n);
						return /* @__PURE__ */ l("div", {
							className: "absolute rounded-full pointer-events-none",
							style: {
								width: 10,
								height: 10,
								border: "2px solid rgba(255,255,255,.85)",
								background: Z(...Q(e[0], e[1], e[2])),
								left: r - 5,
								top: i - 5
							}
						}, t);
					}),
					/* @__PURE__ */ l(Nt, {
						size: ae,
						h: T,
						s: D,
						v: k,
						shape: F,
						onChange: (e, t) => R(T, e, t)
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "flex items-center gap-1 mt-2",
				children: [
					[
						"square",
						"triangle",
						"circle"
					].map((e) => /* @__PURE__ */ l("button", {
						onClick: () => ee(e),
						title: e,
						className: "w-6 h-6 flex items-center justify-center",
						style: {
							borderRadius: 3,
							background: F === e ? g.accent : g.surface,
							color: F === e ? "#fff" : g.textDim,
							border: `1px solid ${g.border}`
						},
						children: l(e === "square" ? M : e === "triangle" ? P : y, { size: 12 })
					}, e)),
					/* @__PURE__ */ l("div", { style: {
						width: 1,
						height: 16,
						background: g.border,
						margin: "0 2px"
					} }),
					/* @__PURE__ */ u("select", {
						value: I,
						onChange: (e) => L(e.target.value),
						className: "flex-1 h-6 text-[10px] px-1 outline-none",
						style: {
							background: g.surface,
							color: g.text,
							border: `1px solid ${g.border}`,
							borderRadius: 3
						},
						children: [
							/* @__PURE__ */ l("option", {
								value: "comp",
								children: _("layer_harmony_comp")
							}),
							/* @__PURE__ */ l("option", {
								value: "analog",
								children: _("layer_harmony_analog")
							}),
							/* @__PURE__ */ l("option", {
								value: "triad",
								children: _("layer_harmony_triad")
							}),
							/* @__PURE__ */ l("option", {
								value: "tetrad",
								children: _("layer_harmony_tetrad")
							}),
							/* @__PURE__ */ l("option", {
								value: "split",
								children: _("layer_harmony_split")
							}),
							/* @__PURE__ */ l("option", {
								value: "mono",
								children: _("layer_harmony_mono")
							})
						]
					})
				]
			}),
			/* @__PURE__ */ l("div", {
				className: "flex gap-1 mt-1.5",
				children: oe.map((e, t) => {
					let n = Z(...Q(e[0], e[1], e[2]));
					return /* @__PURE__ */ l("button", {
						onClick: () => R(e[0], e[1], e[2]),
						title: n,
						className: "flex-1 h-6",
						style: {
							background: n,
							borderRadius: 3,
							border: `1px solid ${g.border}`
						}
					}, t);
				})
			}),
			/* @__PURE__ */ u("div", {
				className: "flex items-center gap-2 mt-2",
				children: [
					/* @__PURE__ */ l("div", { style: {
						width: 28,
						height: 24,
						background: K,
						border: `1px solid ${g.border}`,
						borderRadius: 2,
						flexShrink: 0
					} }),
					/* @__PURE__ */ l("span", {
						className: "text-[10px]",
						style: { color: g.textDim },
						children: "#"
					}),
					/* @__PURE__ */ l("input", {
						value: K.replace("#", "").toUpperCase(),
						onChange: (e) => {
							let t = "#" + e.target.value.trim();
							if (/^#[0-9a-fA-F]{6}$/.test(t)) {
								let [e, n, r] = X(t);
								z(e, n, r);
							}
						},
						className: "flex-1 h-6 text-[11px] px-2 outline-none font-mono uppercase",
						style: {
							background: g.surface,
							border: `1px solid ${g.border}`,
							color: g.text,
							borderRadius: 2
						}
					})
				]
			}),
			/* @__PURE__ */ l("div", {
				className: "flex mt-2.5 mb-1.5",
				style: { borderBottom: `1px solid ${g.border}` },
				children: [
					"RGB",
					"HSV",
					"HSL",
					"CMYK",
					"GRAY"
				].map((e) => /* @__PURE__ */ l("button", {
					onClick: () => N(e),
					className: "px-1.5 py-0.5 text-[9px] font-medium",
					style: {
						color: j === e ? g.accent : g.textDim,
						borderBottom: j === e ? `2px solid ${g.accent}` : "2px solid transparent"
					},
					children: e
				}, e))
			}),
			/* @__PURE__ */ l("div", {
				className: "space-y-1.5",
				children: Y.map((e) => /* @__PURE__ */ l(Pt, {
					label: e.l,
					value: e.val,
					max: e.max,
					track: e.track,
					onInput: e.set,
					C: g
				}, e.l))
			}),
			/* @__PURE__ */ l("div", {
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
				].map((e) => /* @__PURE__ */ l("button", {
					onClick: () => {
						let [t, n, r] = X(e);
						z(t, n, r);
					},
					title: e,
					style: {
						width: 16,
						height: 16,
						background: e,
						borderRadius: 2,
						border: `1px solid ${e.toLowerCase() === K.toLowerCase() ? g.accent : g.border}`
					}
				}, e))
			}),
			c.length > 0 && /* @__PURE__ */ u("div", {
				className: "mt-3 pt-2",
				style: { borderTop: `1px solid ${g.border}` },
				children: [/* @__PURE__ */ l("div", {
					className: "text-[9px] uppercase tracking-wide mb-1.5",
					style: { color: g.textDim },
					children: _("layer_color_recent")
				}), /* @__PURE__ */ l("div", {
					className: "grid gap-1",
					style: { gridTemplateColumns: "repeat(10, 1fr)" },
					children: c.slice(0, 30).map((e, t) => /* @__PURE__ */ l("button", {
						title: e,
						onClick: () => {
							let [t, n, r] = X(e);
							z(t, n, r), d?.(e);
						},
						className: "aspect-square transition-transform hover:scale-110",
						style: {
							background: e,
							borderRadius: 3,
							border: `1px solid ${e.toLowerCase() === K.toLowerCase() ? g.accent : g.border}`,
							boxShadow: e.toLowerCase() === K.toLowerCase() ? `0 0 0 1px ${g.accent}` : "none"
						}
					}, e + t))
				})]
			}),
			(f || p) && /* @__PURE__ */ u("div", {
				className: "flex items-center justify-end gap-2 mt-3 pt-2.5",
				style: { borderTop: `1px solid ${g.border}` },
				children: [p && /* @__PURE__ */ l("button", {
					onClick: p,
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: g.text,
						background: "transparent",
						border: `1px solid ${g.border}`
					},
					children: h ?? _("layer_color_cancel")
				}), f && /* @__PURE__ */ l("button", {
					onClick: () => f(K),
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: "#fff",
						background: g.accent,
						border: `1px solid ${g.accent}`
					},
					children: m ?? _("layer_color_confirm")
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/ColorField.tsx
function It({ t: e, C: t, color: r, onChange: a, history: d, onPickHistory: f, className: p, style: m, width: h = 32, height: g = 24 }) {
	let _ = At(), v = t ?? _, [y, b] = s(!1), x = o(null), S = o(null), [C, w] = s(null), T = () => {
		let e = x.current, t = S.current;
		if (!e || !t) return;
		let n = e.getBoundingClientRect(), r = t.offsetWidth || 244, i = t.offsetHeight || 480, a = window.innerWidth, o = window.innerHeight, s = n.left - r - 8;
		s < 8 && (s = n.right + 8), s + r > a - 8 && (s = a - r - 8), s < 8 && (s = 8);
		let c = n.top;
		c + i > o - 8 && (c = o - i - 8), c < 8 && (c = 8), w({
			left: s,
			top: c
		});
	};
	return i(() => {
		if (!y) {
			w(null);
			return;
		}
		T();
	}, [y]), n(() => {
		if (!y) return;
		let e = () => T();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [y]), /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("button", {
		ref: x,
		type: "button",
		onClick: () => b((e) => !e),
		className: p,
		style: {
			width: h,
			height: g,
			background: r,
			border: `1px solid ${y ? v.accent : v.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...m
		}
	}), y && R(/* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => b(!1)
	}), /* @__PURE__ */ l("div", {
		ref: S,
		className: "fixed",
		style: {
			left: C?.left ?? 0,
			top: C?.top ?? 0,
			zIndex: 200,
			visibility: C ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ l(Ft, {
			t: e,
			C: v,
			color: r,
			onChange: a,
			onClose: () => b(!1),
			history: d,
			onPickHistory: f
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/ColorSwatchPicker.tsx
var Lt = "kubuno:picker:custom-swatches";
function Rt() {
	if (typeof localStorage > "u") return [];
	try {
		let e = JSON.parse(localStorage.getItem(Lt) || "[]");
		return Array.isArray(e) ? e.slice(0, 20) : [];
	} catch {
		return [];
	}
}
var zt = /* @__PURE__ */ "#000000.#434343.#666666.#999999.#b7b7b7.#cccccc.#d9d9d9.#efefef.#f3f3f3.#ffffff.#980000.#ff0000.#ff9900.#ffff00.#00ff00.#00ffff.#4a86e8.#0000ff.#9900ff.#ff00ff.#e6b8af.#f4cccc.#fce5cd.#fff2cc.#d9ead3.#d0e0e3.#c9daf8.#cfe2f3.#d9d2e9.#ead1dc.#dd7e6b.#ea9999.#f9cb9c.#ffe599.#b6d7a8.#a2c4c9.#a4c2f4.#9fc5e8.#b4a7d6.#d5a6bd.#cc4125.#e06666.#f6b26b.#ffd966.#93c47d.#76a5af.#6d9eeb.#6fa8dc.#8e7cc3.#c27ba0.#a61c00.#cc0000.#e69138.#f1c232.#6aa84f.#45818e.#3c78d8.#3d85c6.#674ea7.#a64d79.#85200c.#990000.#b45f06.#bf9000.#38761d.#134f5c.#1155cc.#0b5394.#351c75.#741b47.#5b0f00.#660000.#783f04.#7f6000.#274e13.#0c343d.#1c4587.#073763.#20124d.#4c1130".split(".");
function Bt({ color: e, onChange: t, onClose: n, t: r, theme: i, customLabel: a = "Personnalisé", confirmLabel: o, cancelLabel: c }) {
	let d = At(), f = i ?? d, [p, m] = s(!1), [h, g] = s(e), [_, v] = s(Rt), y = (e) => v((t) => {
		let n = [e, ...t.filter((t) => t.toLowerCase() !== e.toLowerCase())].slice(0, 20);
		try {
			localStorage.setItem(Lt, JSON.stringify(n));
		} catch {}
		return n;
	}), b = o ?? (r ? r("color_add", { defaultValue: "Ajouter" }) : "Ajouter"), x = c ?? (r ? r("color_cancel", { defaultValue: "Annuler" }) : "Annuler");
	if (p) return /* @__PURE__ */ l(Ft, {
		t: r,
		C: f,
		color: h,
		onChange: g,
		onClose: () => m(!1),
		confirmLabel: b,
		cancelLabel: x,
		onConfirm: (e) => {
			y(e), t(e), m(!1);
		},
		onCancel: () => m(!1)
	});
	let S = () => {
		g(e), m(!0);
	}, C = async () => {
		let e = window.EyeDropper;
		if (e) try {
			let r = await new e().open();
			y(r.sRGBHex), t(r.sRGBHex), n?.();
		} catch {}
	}, w = e.toLowerCase();
	return /* @__PURE__ */ u("div", {
		className: "p-3 rounded-lg shadow-lg border",
		style: {
			width: 232,
			background: f.toolbar,
			borderColor: f.border
		},
		children: [
			/* @__PURE__ */ l("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: zt.map((e) => {
					let r = e.toLowerCase() === w;
					return /* @__PURE__ */ l("button", {
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
			/* @__PURE__ */ l("div", {
				className: "mt-3 mb-1 text-[11px] font-semibold uppercase tracking-wide",
				style: { color: f.title },
				children: a
			}),
			/* @__PURE__ */ u("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: [
					_.map((e) => /* @__PURE__ */ l("button", {
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
					/* @__PURE__ */ l("button", {
						onClick: S,
						title: a,
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: f.border,
							color: f.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = f.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ l(A, { size: 12 })
					}),
					typeof window < "u" && "EyeDropper" in window && /* @__PURE__ */ l("button", {
						onClick: C,
						title: "Pipette",
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: f.border,
							color: f.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = f.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ l(k, { size: 11 })
					})
				]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/AnchoredPopover.tsx
function Vt({ anchorRef: e, open: t, onClose: r, children: a, gap: d = 4, align: f = "left" }) {
	let p = o(null), [m, h] = s(null), g = () => {
		let t = e.current, n = p.current;
		if (!t || !n) return;
		let r = t.getBoundingClientRect(), i = n.offsetWidth || 232, a = n.offsetHeight || 300, o = window.innerWidth, s = window.innerHeight, c = r.bottom + d;
		c + a > s - 8 && (c = r.top - a - d), c < 8 && (c = 8);
		let l = f === "right" ? r.right - i : r.left;
		l + i > o - 8 && (l = o - i - 8), l < 8 && (l = 8), h({
			left: l,
			top: c
		});
	};
	return i(() => {
		if (!t) {
			h(null);
			return;
		}
		g();
	}, [t]), n(() => {
		if (!t) return;
		let e = () => g();
		return window.addEventListener("resize", e), window.addEventListener("scroll", e, !0), () => {
			window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0);
		};
	}, [t]), t ? R(/* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onMouseDown: r
	}), /* @__PURE__ */ l("div", {
		ref: p,
		className: "fixed",
		style: {
			left: m?.left ?? 0,
			top: m?.top ?? 0,
			zIndex: 200,
			visibility: m ? "visible" : "hidden"
		},
		children: a
	})] }), document.body) : null;
}
//#endregion
//#region ../../src/ui/windowZStore.ts
var Ht = 1e3, Ut = ce((e, t) => ({
	counter: Ht,
	next: () => {
		let n = t().counter + 1;
		return e({ counter: n }), n;
	}
}));
//#endregion
//#region ../../src/ui/FloatingWindow.tsx
function Wt({ title: e, icon: r, children: i, titleActions: a, onClose: d, defaultWidth: f = 560, defaultHeight: p, minWidth: m = 280, minHeight: h = 120, resizable: g = !1, backdrop: _ = !1, className: v = "" }) {
	let y = o(null), [b, x] = s(() => Ut.getState().next()), S = o(!1), C = o({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0
	}), w = o(!1), T = o(!1), E = o(""), D = o({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0,
		ww: 0,
		wh: 0
	}), O = t(() => {
		x(Ut.getState().next());
	}, []), k = t(() => {
		let e = y.current;
		if (!e || w.current) return;
		let t = e.getBoundingClientRect();
		e.style.transform = "none", e.style.left = `${t.left}px`, e.style.top = `${t.top}px`, w.current = !0;
	}, []), A = t((e) => {
		if (e.target.closest("button,a,input,select,textarea")) return;
		let t = y.current;
		if (!t) return;
		O(), k();
		let n = t.getBoundingClientRect();
		S.current = !0, C.current = {
			mx: e.clientX,
			my: e.clientY,
			wx: n.left,
			wy: n.top
		}, e.preventDefault();
	}, [O, k]), j = t((e) => {
		let t = y.current;
		if (!t) return;
		O(), k();
		let n = t.getBoundingClientRect();
		T.current = !0, E.current = e.currentTarget.dataset.edge ?? "", D.current = {
			mx: e.clientX,
			my: e.clientY,
			wx: n.left,
			wy: n.top,
			ww: n.width,
			wh: n.height
		}, e.preventDefault(), e.stopPropagation();
	}, [O, k]);
	n(() => {
		let e = (e) => {
			let t = y.current;
			if (t) {
				if (S.current) {
					let { mx: n, my: r, wx: i, wy: a } = C.current, o = i + e.clientX - n, s = a + e.clientY - r, c = window.innerWidth - 100, l = window.innerHeight - 40;
					t.style.left = `${Math.max(-t.offsetWidth + 100, Math.min(c, o))}px`, t.style.top = `${Math.max(0, Math.min(l, s))}px`;
					return;
				}
				if (T.current) {
					let { mx: n, my: r, wx: i, wy: a, ww: o, wh: s } = D.current, c = e.clientX - n, l = e.clientY - r, u = E.current, d = o, f = s, p = i, g = a;
					u.includes("e") && (d = Math.max(m, o + c)), u.includes("s") && (f = Math.max(h, s + l)), u.includes("w") && (d = Math.max(m, o - c), p = i + (o - d)), u.includes("n") && (f = Math.max(h, s - l), g = a + (s - f)), t.style.width = `${d}px`, t.style.height = `${f}px`, t.style.left = `${p}px`, t.style.top = `${g}px`;
				}
			}
		}, t = () => {
			S.current = !1, T.current = !1;
		};
		return window.addEventListener("mousemove", e), window.addEventListener("mouseup", t), () => {
			window.removeEventListener("mousemove", e), window.removeEventListener("mouseup", t);
		};
	}, [m, h]), n(() => {
		let e = (e) => {
			e.key === "Escape" && d();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [d]);
	let M = g ? /* @__PURE__ */ u(c, { children: [
		/* @__PURE__ */ l("div", {
			"data-edge": "n",
			onMouseDown: j,
			className: "absolute top-0    left-2  right-2  h-1   cursor-n-resize  z-10"
		}),
		/* @__PURE__ */ l("div", {
			"data-edge": "s",
			onMouseDown: j,
			className: "absolute bottom-0 left-2  right-2  h-1   cursor-s-resize  z-10"
		}),
		/* @__PURE__ */ l("div", {
			"data-edge": "w",
			onMouseDown: j,
			className: "absolute top-2   left-0  bottom-2  w-1   cursor-w-resize  z-10"
		}),
		/* @__PURE__ */ l("div", {
			"data-edge": "e",
			onMouseDown: j,
			className: "absolute top-2   right-0 bottom-2  w-1   cursor-e-resize  z-10"
		}),
		/* @__PURE__ */ l("div", {
			"data-edge": "nw",
			onMouseDown: j,
			className: "absolute top-0    left-0  w-3 h-3  cursor-nw-resize z-20"
		}),
		/* @__PURE__ */ l("div", {
			"data-edge": "ne",
			onMouseDown: j,
			className: "absolute top-0    right-0 w-3 h-3  cursor-ne-resize z-20"
		}),
		/* @__PURE__ */ l("div", {
			"data-edge": "sw",
			onMouseDown: j,
			className: "absolute bottom-0 left-0  w-3 h-3  cursor-sw-resize z-20"
		}),
		/* @__PURE__ */ l("div", {
			"data-edge": "se",
			onMouseDown: j,
			className: "absolute bottom-0 right-0 w-3 h-3  cursor-se-resize z-20"
		})
	] }) : null;
	return R(/* @__PURE__ */ u(c, { children: [_ && /* @__PURE__ */ l("div", {
		className: "fixed inset-0 bg-black/30 backdrop-blur-[1px] no-print",
		style: { zIndex: b - 1 },
		onClick: d
	}), /* @__PURE__ */ u("div", {
		ref: y,
		role: "dialog",
		"aria-modal": _,
		className: `fixed bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)]
                    flex flex-col overflow-hidden no-print ${v}`,
		style: {
			width: f,
			height: p,
			minWidth: `min(${m}px, calc(100vw - 16px))`,
			minHeight: `min(${h}px, calc(100vh - 16px))`,
			maxWidth: "calc(100vw - 16px)",
			maxHeight: "calc(100vh - 16px)",
			zIndex: b,
			left: "50%",
			top: "33%",
			transform: "translate(-50%, -33%)"
		},
		onMouseDown: O,
		children: [
			M,
			/* @__PURE__ */ u("div", {
				className: "flex items-center gap-2.5 px-4 py-3 border-b border-border\n                     flex-shrink-0 cursor-move select-none",
				onMouseDown: A,
				children: [
					r && /* @__PURE__ */ l("div", {
						className: "flex-shrink-0 text-text-secondary",
						children: r
					}),
					/* @__PURE__ */ l("div", {
						className: "flex-1 min-w-0 text-sm font-medium text-text-primary truncate",
						children: e
					}),
					a && /* @__PURE__ */ l("div", {
						className: "flex items-center gap-1 flex-shrink-0",
						onMouseDown: (e) => e.stopPropagation(),
						children: a
					}),
					/* @__PURE__ */ l("button", {
						onClick: d,
						onMouseDown: (e) => e.stopPropagation(),
						title: "Fermer (Échap)",
						className: "flex-shrink-0 p-1.5 -mr-1 rounded-lg text-text-tertiary\n                       hover:text-text-primary hover:bg-surface-2 transition-colors",
						children: /* @__PURE__ */ l(ee, { size: 15 })
					})
				]
			}),
			/* @__PURE__ */ l("div", {
				className: "flex-1 flex flex-col min-h-0 overflow-hidden",
				children: i
			})
		]
	})] }), document.body);
}
//#endregion
//#region ../../src/ui/ConfirmDialog.tsx
function Gt({ title: e, message: t, confirmLabel: r = "Confirmer", cancelLabel: i = "Annuler", variant: a = "default", hideCancel: s = !1, onConfirm: c, onCancel: f }) {
	let p = o(null);
	n(() => {
		p.current?.focus();
	}, []), n(() => {
		let e = (e) => {
			e.key === "Enter" && c();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [c]);
	let m = a === "danger" ? "bg-red-100" : a === "warning" ? "bg-amber-100" : "bg-gray-100", h = a === "danger" ? "text-red-600" : a === "warning" ? "text-amber-600" : "text-gray-600", g = a === "danger" ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white" : a === "warning" ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white";
	return /* @__PURE__ */ l(Wt, {
		title: e,
		onClose: f,
		defaultWidth: 380,
		backdrop: !0,
		children: /* @__PURE__ */ u("div", {
			className: "p-6 flex flex-col gap-4",
			children: [
				/* @__PURE__ */ l("div", {
					className: `w-12 h-12 rounded-full ${m} flex items-center justify-center flex-shrink-0`,
					children: l(a === "danger" ? N : d, { className: `w-6 h-6 ${h}` })
				}),
				/* @__PURE__ */ l("p", {
					className: "text-sm text-gray-500 leading-relaxed whitespace-pre-line",
					children: t
				}),
				/* @__PURE__ */ u("div", {
					className: "flex gap-3 mt-1",
					children: [!s && /* @__PURE__ */ l("button", {
						type: "button",
						onClick: f,
						className: "flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300\n                       rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors whitespace-nowrap",
						children: i
					}), /* @__PURE__ */ l("button", {
						ref: p,
						type: "button",
						onClick: c,
						className: `flex-1 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none
                        focus:ring-2 focus:ring-offset-1 transition-colors whitespace-nowrap ${g}`,
						children: r
					})]
				})
			]
		})
	});
}
//#endregion
//#region ../../src/ui/ConflictDialog.tsx
function Kt({ type: e, name: t, onChoice: n }) {
	let r = e === "folder";
	return /* @__PURE__ */ l(Wt, {
		title: "Conflit de nom",
		onClose: () => n("cancel"),
		defaultWidth: 400,
		backdrop: !0,
		children: /* @__PURE__ */ u("div", {
			className: "p-6 flex flex-col gap-5",
			children: [
				/* @__PURE__ */ u("p", {
					className: "text-sm text-text-secondary leading-relaxed",
					children: [
						"Un ",
						r ? "dossier" : "fichier",
						" nommé",
						" ",
						/* @__PURE__ */ u("span", {
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
				/* @__PURE__ */ u("button", {
					type: "button",
					onClick: () => n("overwrite"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ l("div", {
						className: "w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ l(T, {
							size: 15,
							className: "text-danger"
						})
					}), /* @__PURE__ */ u("div", { children: [/* @__PURE__ */ l("p", {
						className: "text-sm font-medium text-text-primary",
						children: r ? "Fusionner" : "Écraser"
					}), /* @__PURE__ */ l("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: r ? "Les deux dossiers seront fusionnés. Les fichiers en conflit seront remplacés." : "Le fichier existant sera remplacé par le nouveau."
					})] })]
				}),
				/* @__PURE__ */ u("button", {
					type: "button",
					onClick: () => n("keep_both"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ l("div", {
						className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ l(x, {
							size: 15,
							className: "text-primary"
						})
					}), /* @__PURE__ */ u("div", { children: [/* @__PURE__ */ l("p", {
						className: "text-sm font-medium text-text-primary",
						children: "Conserver les deux"
					}), /* @__PURE__ */ u("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: [
							"Le nouvel élément sera renommé automatiquement (ex.\xA0: «\xA0",
							t,
							" (2)\xA0»)."
						]
					})] })]
				}),
				/* @__PURE__ */ l("button", {
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
//#region ../../src/ui/gradient.ts
function qt(e, t = 100) {
	let [n, r, i] = X(e);
	return `rgba(${n}, ${r}, ${i}, ${Math.max(0, Math.min(100, t)) / 100})`;
}
function Jt(e) {
	let t = [...e.stops].sort((e, t) => e.position - t.position).map((e) => `${qt(e.color, e.opacity ?? 100)} ${Math.round(e.position * 100)}%`).join(", ");
	return e.type === "radial" ? `radial-gradient(circle, ${t})` : `linear-gradient(${Math.round(e.angle)}deg, ${t})`;
}
var Yt = {
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
}, Xt = {
	gradient_linear: "Linéaire",
	gradient_radial: "Radial",
	gradient_angle: "Angle",
	gradient_position: "Position",
	gradient_opacity: "Opacité",
	gradient_add_stop: "Ajouter un arrêt"
};
function Zt(e, t) {
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
	let i = n[r], a = n[r + 1], o = (t - i.position) / (a.position - i.position || 1), [s, c, l] = X(i.color), [u, d, f] = X(a.color);
	return {
		color: Z(s + (u - s) * o, c + (d - c) * o, l + (f - l) * o),
		position: t,
		opacity: Math.round(i.opacity + (a.opacity - i.opacity) * o)
	};
}
function Qt({ t: e, value: t, onChange: r, onClose: i, C: a }) {
	let c = At(), d = a ?? c, f = (t) => e ? e(t) : Xt[t] ?? t, p = t ?? Yt, [m, h] = s(0), g = o(null), _ = o(null), v = [...p.stops].map((e, t) => ({
		s: e,
		i: t
	})).sort((e, t) => e.s.position - t.s.position), y = p.stops[Math.min(m, p.stops.length - 1)] ?? p.stops[0], b = (e) => r({
		...p,
		...e
	}), x = (e, t) => b({ stops: p.stops.map((n, r) => r === e ? {
		...n,
		...t
	} : n) }), S = (e) => {
		let t = g.current;
		if (!t) return 0;
		let n = t.getBoundingClientRect();
		return Math.max(0, Math.min(1, (e - n.left) / n.width));
	};
	n(() => {
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
		let t = Zt(p.stops, e), n = [...p.stops, t];
		r({
			...p,
			stops: n
		}), h(n.length - 1);
	}, w = (e) => {
		p.stops.length <= 2 || (b({ stops: p.stops.filter((t, n) => n !== e) }), h(0));
	}, T = Jt(p);
	return /* @__PURE__ */ u("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 260,
			background: d.toolbar,
			border: `1px solid ${d.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ l("div", {
					className: "flex gap-1",
					children: ["linear", "radial"].map((e) => /* @__PURE__ */ l("button", {
						onClick: () => b({ type: e }),
						className: "px-2 py-0.5 text-[10px] font-medium",
						style: {
							borderRadius: 3,
							background: p.type === e ? d.accent : d.surface ?? "#2c2c2c",
							color: p.type === e ? "#fff" : d.textDim,
							border: `1px solid ${d.border}`
						},
						children: f(e === "linear" ? "gradient_linear" : "gradient_radial")
					}, e))
				}), i && /* @__PURE__ */ l("button", {
					onClick: i,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: d.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ u("div", {
				className: "relative mb-3",
				style: { height: 22 },
				children: [/* @__PURE__ */ l("div", {
					ref: g,
					onPointerDown: (e) => {
						C(S(e.clientX));
					},
					className: "absolute inset-0 cursor-copy",
					style: {
						borderRadius: 3,
						border: `1px solid ${d.border}`,
						backgroundImage: `${T}, repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%)`,
						backgroundSize: "auto, 10px 10px"
					}
				}), v.map(({ s: e, i: t }) => /* @__PURE__ */ l("div", {
					onPointerDown: (e) => {
						e.stopPropagation(), _.current = t, h(t);
					},
					title: `${Math.round(e.position * 100)}%`,
					className: "absolute -bottom-1 cursor-ew-resize",
					style: {
						left: `calc(${e.position * 100}% - 6px)`,
						width: 12,
						height: 12,
						background: e.color,
						borderRadius: 2,
						border: `2px solid ${t === m ? d.accent : "#fff"}`,
						boxShadow: "0 0 0 1px rgba(0,0,0,.5)"
					}
				}, t))]
			}),
			p.type === "linear" && /* @__PURE__ */ u("label", {
				className: "flex items-center gap-2 mb-2",
				children: [
					/* @__PURE__ */ l("span", {
						className: "text-[9px] uppercase flex-shrink-0",
						style: {
							color: d.textDim,
							width: 48
						},
						children: f("gradient_angle")
					}),
					/* @__PURE__ */ l(_e, {
						min: 0,
						max: 360,
						className: "flex-1",
						value: p.angle,
						onChange: (e) => b({ angle: e }),
						accent: d.accent,
						trackColor: d.border,
						"aria-label": f("gradient_angle")
					}),
					/* @__PURE__ */ l("input", {
						type: "number",
						min: 0,
						max: 360,
						value: Math.round(p.angle),
						onChange: (e) => b({ angle: Math.max(0, Math.min(360, Number(e.target.value))) }),
						className: "w-14 px-1.5 py-0.5 text-[11px] outline-none",
						style: {
							background: d.surface,
							color: d.text,
							border: `1px solid ${d.border}`,
							borderRadius: 2
						}
					})
				]
			}),
			y && /* @__PURE__ */ u("div", {
				className: "flex flex-col gap-2 pt-2",
				style: { borderTop: `1px solid ${d.border}` },
				children: [/* @__PURE__ */ u("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ l(It, {
							t: e,
							C: d,
							width: 32,
							height: 24,
							className: "flex-shrink-0",
							color: y.color,
							onChange: (e) => x(p.stops.indexOf(y), { color: e })
						}),
						/* @__PURE__ */ u("label", {
							className: "flex items-center gap-1 flex-1",
							children: [/* @__PURE__ */ l("span", {
								className: "text-[9px] uppercase",
								style: { color: d.textDim },
								children: f("gradient_position")
							}), /* @__PURE__ */ l("input", {
								type: "number",
								min: 0,
								max: 100,
								value: Math.round(y.position * 100),
								onChange: (e) => x(p.stops.indexOf(y), { position: Math.max(0, Math.min(1, Number(e.target.value) / 100)) }),
								className: "w-12 px-1.5 py-0.5 text-[11px] outline-none",
								style: {
									background: d.surface,
									color: d.text,
									border: `1px solid ${d.border}`,
									borderRadius: 2
								}
							})]
						}),
						p.stops.length > 2 && /* @__PURE__ */ l("button", {
							onClick: () => w(p.stops.indexOf(y)),
							title: "",
							style: { color: d.textDim },
							children: /* @__PURE__ */ l(N, { size: 13 })
						})
					]
				}), /* @__PURE__ */ u("label", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ l("span", {
							className: "text-[9px] uppercase flex-shrink-0",
							style: {
								color: d.textDim,
								width: 48
							},
							children: f("gradient_opacity")
						}),
						/* @__PURE__ */ l(_e, {
							min: 0,
							max: 100,
							className: "flex-1",
							value: y.opacity,
							onChange: (e) => x(p.stops.indexOf(y), { opacity: e }),
							accent: d.accent,
							trackColor: d.border,
							"aria-label": f("gradient_opacity")
						}),
						/* @__PURE__ */ l("input", {
							type: "number",
							min: 0,
							max: 100,
							value: Math.round(y.opacity),
							onChange: (e) => x(p.stops.indexOf(y), { opacity: Math.max(0, Math.min(100, Number(e.target.value))) }),
							className: "w-14 px-1.5 py-0.5 text-[11px] outline-none",
							style: {
								background: d.surface,
								color: d.text,
								border: `1px solid ${d.border}`,
								borderRadius: 2
							}
						})
					]
				})]
			}),
			/* @__PURE__ */ u("button", {
				onClick: () => C(),
				className: "flex items-center gap-1 px-1.5 py-1 mt-2 text-[10px] rounded",
				style: {
					background: d.surface,
					color: d.textDim
				},
				children: [
					/* @__PURE__ */ l(A, { size: 11 }),
					" ",
					f("gradient_add_stop")
				]
			})
		]
	});
}
function $t({ t: e, C: t, value: r, onChange: a, className: d, style: f, width: p = 32, height: m = 24 }) {
	let h = t ?? At(), [g, _] = s(!1), v = o(null), y = o(null), [b, x] = s(null), S = () => {
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
	return i(() => {
		if (!g) {
			x(null);
			return;
		}
		S();
	}, [g]), n(() => {
		if (!g) return;
		let e = () => S();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [g]), /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("button", {
		ref: v,
		type: "button",
		onClick: () => _((e) => !e),
		className: d,
		style: {
			width: p,
			height: m,
			backgroundImage: Jt(r),
			backgroundColor: "#fff",
			border: `1px solid ${g ? h.accent : h.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...f
		}
	}), g && R(/* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => _(!1)
	}), /* @__PURE__ */ l("div", {
		ref: y,
		className: "fixed",
		style: {
			left: b?.left ?? 0,
			top: b?.top ?? 0,
			zIndex: 200,
			visibility: b ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ l(Qt, {
			t: e,
			C: h,
			value: r,
			onChange: a,
			onClose: () => _(!1)
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/interaction.ts
function en() {
	return typeof window < "u" && typeof window.matchMedia == "function" && (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches);
}
function tn(e) {
	return {
		onClick: (t) => {
			en() ? e.open(t) : e.select?.(t);
		},
		onDoubleClick: (t) => {
			en() || e.open(t);
		}
	};
}
function nn(e, n = {}) {
	let { ms: r = 500, moveTolerance: i = 12 } = n, a = o(null), s = o(null), c = t(() => {
		a.current &&= (clearTimeout(a.current), null), s.current = null;
	}, []);
	return {
		onTouchStart: t((t) => {
			if (t.touches.length !== 1) {
				c();
				return;
			}
			let n = t.touches[0];
			s.current = {
				x: n.clientX,
				y: n.clientY
			}, a.current = setTimeout(() => {
				a.current = null;
				let t = (e) => {
					e.stopPropagation(), e.preventDefault();
				};
				window.addEventListener("click", t, {
					capture: !0,
					once: !0
				}), setTimeout(() => window.removeEventListener("click", t, { capture: !0 }), 700), e({
					clientX: n.clientX,
					clientY: n.clientY,
					preventDefault() {},
					stopPropagation() {}
				});
			}, r);
		}, [
			e,
			r,
			c
		]),
		onTouchMove: t((e) => {
			if (!s.current) return;
			let t = e.touches[0];
			(Math.abs(t.clientX - s.current.x) > i || Math.abs(t.clientY - s.current.y) > i) && c();
		}, [c, i]),
		onTouchEnd: c,
		onTouchCancel: c
	};
}
//#endregion
export { Vt as AnchoredPopover, Xe as Badge, fe as Button, Be as Checkbox, It as ColorField, Ft as ColorPicker, Bt as ColorSwatchPicker, Gt as ConfirmDialog, Kt as ConflictDialog, Yt as DEFAULT_GRADIENT, Et as DEFAULT_PICKER_THEME, dt as DatePicker, Se as Dropdown, Ge as FloatCheckbox, Wt as FloatingWindow, je as FontPicker, $t as GradientField, Qt as GradientPicker, ve as Input, bt as KubunoLogo, Dt as LIGHT_PICKER_THEME, Pe as MenuDropdown, pe as NumberInput, We as Radio, _e as RangeSlider, pt as ResizeHandle, be as RichText, he as RollingNumber, et as Separator, Qe as Spinner, $e as SpinnerOverlay, yt as StartPage, ft as Tabs, ye as Textarea, Ke as Toggle, kt as appPickerTheme, $ as cmykToRgb, ke as dedupeFontFamilies, Jt as gradientToCss, Mt as harmonyColors, X as hexToRgb, Ct as hslToRgb, Q as hsvToRgb, en as isCoarsePointer, tn as openable, Oe as parseFontMeta, Tt as rgbToCmyk, Z as rgbToHex, xt as rgbToHsl, wt as rgbToHsv, qt as rgbaFromHex, At as useAppPickerTheme, nn as useLongPress, Ie as useMenuDropdown, mt as useResizableWidth, Ut as useWindowZStore };
