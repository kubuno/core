import e, { useCallback as t, useEffect as n, useLayoutEffect as r, useMemo as i, useRef as a, useState as o } from "react";
import { Fragment as s, jsx as c, jsxs as l } from "react/jsx-runtime";
import { AlertTriangle as u, Bold as d, Calendar as f, ChevronDown as p, ChevronLeft as m, ChevronRight as h, ChevronUp as g, Circle as _, Clock as v, Copy as y, Eraser as b, GripVertical as x, Italic as S, Layers as C, Link2 as w, List as T, ListOrdered as E, Pipette as D, Plus as O, Square as k, Trash2 as A, Triangle as j, Underline as ee, X as M } from "lucide-react";
import { clsx as N } from "clsx";
import { twMerge as P } from "tailwind-merge";
import { createPortal as F } from "react-dom";
import { addMonths as I, eachDayOfInterval as te, endOfMonth as L, endOfWeek as R, format as z, getMonth as B, getYear as V, isAfter as H, isBefore as U, isSameDay as W, isSameMonth as ne, isToday as G, isValid as re, parseISO as ie, startOfMonth as ae, startOfWeek as oe, subMonths as se } from "date-fns";
import { fr as ce } from "date-fns/locale";
import { create as K } from "zustand";
//#region ../../src/ui/Button.tsx
var q = [
	"inline-flex items-center justify-center font-medium select-none",
	"transition-colors rounded-md",
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
	"disabled:opacity-50 disabled:cursor-not-allowed"
].join(" "), le = {
	primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
	secondary: "bg-white border border-border text-text-primary hover:bg-surface-1 active:bg-surface-2",
	ghost: "bg-transparent text-text-secondary hover:bg-surface-2 active:bg-surface-3",
	danger: "bg-danger text-white hover:opacity-90 active:opacity-80"
}, ue = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-9 px-4 text-sm gap-2",
	lg: "h-11 px-5 text-sm gap-2"
};
function de({ variant: e = "primary", size: t = "md", icon: n, loading: r = !1, className: i, disabled: a, children: o, type: u = "button", ...d }) {
	return /* @__PURE__ */ c("button", {
		type: u,
		className: [
			q,
			le[e],
			ue[t],
			i
		].filter(Boolean).join(" "),
		disabled: a || r,
		...d,
		children: r ? /* @__PURE__ */ c("span", { className: "h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" }) : /* @__PURE__ */ l(s, { children: [n, o] })
	});
}
//#endregion
//#region ../../src/ui/NumberInput.tsx
function fe({ value: e, onChange: n, min: r, max: i, step: a = 1, disabled: o = !1, label: s, error: u, hint: d, className: f, id: m }) {
	let h = m ?? s?.toLowerCase().replace(/\s+/g, "-"), _ = t((e) => r !== void 0 && e < r ? r : i !== void 0 && e > i ? i : e, [r, i]), v = () => n(_(e + a)), y = () => n(_(e - a)), b = (e) => {
		let t = parseFloat(e.target.value);
		isNaN(t) || n(_(t));
	}, x = r !== void 0 && e <= r, S = i !== void 0 && e >= i;
	return /* @__PURE__ */ l("div", {
		className: "flex flex-col gap-1",
		children: [
			s && /* @__PURE__ */ c("label", {
				htmlFor: h,
				className: "text-sm font-medium text-text-primary",
				children: s
			}),
			/* @__PURE__ */ l("div", {
				className: N("inline-flex items-stretch h-9 rounded-md border bg-white overflow-hidden", "focus-within:ring-2 focus-within:ring-primary focus-within:border-primary", u ? "border-danger focus-within:ring-danger" : "border-border", o && "opacity-50 cursor-not-allowed", f),
				children: [/* @__PURE__ */ c("input", {
					id: h,
					type: "number",
					value: e,
					onChange: b,
					min: r,
					max: i,
					step: a,
					disabled: o,
					className: N("flex-1 min-w-0 px-3 text-sm text-text-primary bg-transparent", "focus:outline-none", "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none")
				}), /* @__PURE__ */ l("div", {
					className: "flex flex-col border-l border-border w-6 flex-shrink-0",
					children: [/* @__PURE__ */ c("button", {
						type: "button",
						tabIndex: -1,
						onClick: v,
						disabled: o || S,
						className: N("flex-1 flex items-center justify-center border-b border-border", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ c(g, {
							size: 11,
							strokeWidth: 2.5
						})
					}), /* @__PURE__ */ c("button", {
						type: "button",
						tabIndex: -1,
						onClick: y,
						disabled: o || x,
						className: N("flex-1 flex items-center justify-center", "text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors", "disabled:opacity-40 disabled:cursor-not-allowed"),
						children: /* @__PURE__ */ c(p, {
							size: 11,
							strokeWidth: 2.5
						})
					})]
				})]
			}),
			u && /* @__PURE__ */ c("p", {
				className: "text-xs text-danger",
				children: u
			}),
			d && !u && /* @__PURE__ */ c("p", {
				className: "text-xs text-text-secondary",
				children: d
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Input.tsx
var pe = e.forwardRef(function({ label: e, error: t, hint: n, leftIcon: r, rightIcon: i, className: a, id: o, ...s }, u) {
	let d = o ?? (typeof e == "string" ? e.toLowerCase().replace(/\s+/g, "-") : void 0);
	return /* @__PURE__ */ l("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ c("label", {
				htmlFor: d,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ l("div", {
				className: "relative flex items-center",
				children: [
					r && /* @__PURE__ */ c("span", {
						className: "absolute left-3 text-text-secondary pointer-events-none",
						children: r
					}),
					/* @__PURE__ */ c("input", {
						ref: u,
						id: d,
						className: P(N("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-9", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r && "pl-9", i && "pr-9", a)),
						...s
					}),
					i && /* @__PURE__ */ c("span", {
						className: "absolute right-3 text-text-secondary pointer-events-none",
						children: i
					})
				]
			}),
			t && /* @__PURE__ */ c("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ c("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
});
//#endregion
//#region ../../src/ui/Textarea.tsx
function me({ label: e, error: t, hint: n, className: r, id: i, ...a }) {
	let o = i ?? e?.toLowerCase().replace(/\s+/g, "-");
	return /* @__PURE__ */ l("div", {
		className: "flex flex-col gap-1",
		children: [
			e && /* @__PURE__ */ c("label", {
				htmlFor: o,
				className: "text-sm font-medium text-text-primary",
				children: e
			}),
			/* @__PURE__ */ c("textarea", {
				id: o,
				className: P(N("w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary", "px-3 py-2 h-36 min-h-36 resize-y", "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", "disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", t ? "border-danger focus:ring-danger" : "border-border", r)),
				...a
			}),
			t && /* @__PURE__ */ c("p", {
				className: "text-xs text-danger",
				children: t
			}),
			n && !t && /* @__PURE__ */ c("p", {
				className: "text-xs text-text-secondary",
				children: n
			})
		]
	});
}
//#endregion
//#region ../../src/ui/RichText.tsx
function he({ value: e, onChange: t, placeholder: r, className: i, minHeight: s = 96, disabled: u }) {
	let f = a(null), [p, m] = o(!1), [h, g] = o(""), [_, v] = o(!e), y = a(null);
	n(() => {
		f.current && (f.current.innerHTML = e || ""), v(!f.current?.textContent?.trim() && !f.current?.querySelector("img,ul,ol"));
	}, []);
	let x = () => {
		let e = f.current?.innerHTML ?? "", n = !f.current?.textContent?.trim() && !f.current?.querySelector("img,ul,ol,li");
		v(n), t(n ? "" : e);
	}, C = (e, t) => {
		f.current?.focus(), document.execCommand(e, !1, t), x();
	}, D = () => {
		let e = window.getSelection();
		e && e.rangeCount && (y.current = e.getRangeAt(0).cloneRange());
	}, O = () => {
		let e = window.getSelection();
		e && y.current && (e.removeAllRanges(), e.addRange(y.current));
	}, k = () => {
		O();
		let e = h.trim();
		e && C("createLink", /^https?:\/\//i.test(e) ? e : `https://${e}`), m(!1), g("");
	}, A = ({ on: e, title: t, children: n }) => /* @__PURE__ */ c("button", {
		type: "button",
		title: t,
		"aria-label": t,
		onMouseDown: (e) => e.preventDefault(),
		onClick: e,
		className: "w-8 h-8 flex items-center justify-center rounded text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors",
		children: n
	});
	return /* @__PURE__ */ l("div", {
		className: `rounded-md border border-border bg-white overflow-hidden ${i ?? ""}`,
		children: [
			/* @__PURE__ */ l("div", {
				className: "flex items-center gap-0.5 px-1.5 py-1 border-b border-border",
				children: [
					/* @__PURE__ */ c(A, {
						title: "Gras",
						on: () => C("bold"),
						children: /* @__PURE__ */ c(d, { size: 15 })
					}),
					/* @__PURE__ */ c(A, {
						title: "Italique",
						on: () => C("italic"),
						children: /* @__PURE__ */ c(S, { size: 15 })
					}),
					/* @__PURE__ */ c(A, {
						title: "Souligné",
						on: () => C("underline"),
						children: /* @__PURE__ */ c(ee, { size: 15 })
					}),
					/* @__PURE__ */ c("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ c(A, {
						title: "Liste numérotée",
						on: () => C("insertOrderedList"),
						children: /* @__PURE__ */ c(E, { size: 15 })
					}),
					/* @__PURE__ */ c(A, {
						title: "Liste à puces",
						on: () => C("insertUnorderedList"),
						children: /* @__PURE__ */ c(T, { size: 15 })
					}),
					/* @__PURE__ */ c("span", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ c(A, {
						title: "Insérer un lien",
						on: () => {
							D(), m((e) => !e);
						},
						children: /* @__PURE__ */ c(w, { size: 15 })
					}),
					/* @__PURE__ */ c(A, {
						title: "Effacer la mise en forme",
						on: () => C("removeFormat"),
						children: /* @__PURE__ */ c(b, { size: 15 })
					})
				]
			}),
			p && /* @__PURE__ */ l("div", {
				className: "flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-surface-1",
				children: [/* @__PURE__ */ c("input", {
					autoFocus: !0,
					value: h,
					onChange: (e) => g(e.target.value),
					placeholder: "https://…",
					onKeyDown: (e) => {
						e.key === "Enter" && (e.preventDefault(), k()), e.key === "Escape" && m(!1);
					},
					className: "flex-1 text-sm px-2 py-1 rounded border border-border outline-none focus:border-primary"
				}), /* @__PURE__ */ c("button", {
					type: "button",
					onClick: k,
					className: "text-sm font-medium text-primary px-2",
					children: "OK"
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "relative",
				children: [/* @__PURE__ */ c("div", {
					ref: f,
					contentEditable: !u,
					onInput: x,
					suppressContentEditableWarning: !0,
					className: "px-3 py-2 text-sm text-text-primary outline-none leading-relaxed\n                     [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-5 [&_ol]:ml-5",
					style: { minHeight: s }
				}), _ && r && /* @__PURE__ */ c("div", {
					className: "absolute top-2 left-3 text-sm text-text-tertiary pointer-events-none select-none",
					children: r
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/Dropdown.tsx
var ge = {
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
function _e({ value: e, onChange: t, options: i, width: s, dropdownMinWidth: u, placeholder: d, disabled: f = !1, height: m = 36, fontSize: h = 14, className: g, variant: _ = "default" }) {
	let [v, y] = o(!1), [b, x] = o(null), S = a(null), C = a(null), w = ge[_], T = i.find((t) => t.value === e)?.label ?? d ?? e, E = () => {
		if (!f) {
			if (S.current) {
				let e = S.current.getBoundingClientRect();
				x({
					top: e.bottom + 2,
					left: e.left,
					minWidth: Math.max(u ?? 0, e.width)
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
	}, [v]), r(() => {
		let e = C.current;
		if (!e || !v || !b) return;
		let t = e.getBoundingClientRect(), n = window.innerWidth, r = window.innerHeight, i = b.left, a = b.top;
		t.right > n - 8 && (i = n - 8 - t.width), t.bottom > r - 8 && (a = r - 8 - t.height), i < 8 && (i = 8), a < 8 && (a = 8), e.style.left = `${i}px`, e.style.top = `${a}px`;
	}, [v, b]);
	let D = {};
	return s !== void 0 && (D.width = s), /* @__PURE__ */ l("div", {
		className: `relative ${g ?? ""}`,
		style: D,
		children: [/* @__PURE__ */ l("button", {
			type: "button",
			ref: S,
			onClick: E,
			onMouseDown: (e) => e.preventDefault(),
			disabled: f,
			className: "w-full flex items-center justify-between gap-1 select-none",
			style: {
				height: m,
				padding: "0 4px 0 8px",
				fontSize: h,
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
			children: [/* @__PURE__ */ c("span", {
				className: "truncate flex-1 text-left",
				children: T
			}), /* @__PURE__ */ c(p, {
				size: 12,
				style: {
					color: w.chevron,
					flexShrink: 0
				}
			})]
		}), v && b && F(/* @__PURE__ */ c("div", {
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
			children: i.map((n) => /* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => {
					t(n.value), y(!1);
				},
				className: "w-full text-left flex items-center gap-2",
				style: {
					padding: "5px 16px",
					fontSize: h,
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
					n.value === e ? /* @__PURE__ */ c("span", {
						style: {
							color: w.checkColor,
							fontSize: 14,
							marginLeft: -4
						},
						children: "✓"
					}) : /* @__PURE__ */ c("span", { style: { width: 14 } }),
					n.icon && /* @__PURE__ */ c("span", {
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
//#region ../../src/ui/MenuDropdown.tsx
var ve = {
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
function ye({ items: t, pos: i, onClose: o, minWidth: s = 200, theme: u = "light" }) {
	let d = i.minWidth ?? s, f = ve[u], p = a(null);
	return n(() => {
		let e = (e) => {
			p.current && !p.current.contains(e.target) && o();
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [o]), r(() => {
		let e = p.current;
		if (!e) return;
		let t = e.getBoundingClientRect(), n = window.innerWidth, r = window.innerHeight, a = i.left, o = i.top;
		t.right > n - 8 && (a = n - 8 - t.width), t.bottom > r - 8 && (o = r - 8 - t.height), a < 8 && (a = 8), o < 8 && (o = 8), e.style.left = `${a}px`, e.style.top = `${o}px`;
	}, [i]), F(/* @__PURE__ */ c("div", {
		ref: p,
		onMouseDown: (e) => {
			e.preventDefault(), e.stopPropagation();
		},
		style: {
			position: "fixed",
			top: i.top,
			left: i.left,
			minWidth: d,
			zIndex: 9999,
			background: f.bg,
			borderRadius: 4,
			padding: "4px 0",
			boxShadow: f.shadow
		},
		children: t.map((t, n) => {
			if (t.type === "separator") return /* @__PURE__ */ c("div", { style: {
				background: f.sep,
				height: 1,
				margin: "4px 0"
			} }, n);
			if (t.type === "label") return /* @__PURE__ */ c("div", {
				style: {
					padding: "4px 16px",
					fontSize: 11,
					color: f.label,
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: "0.05em"
				},
				children: t.text
			}, n);
			if (t.type === "submenu") return /* @__PURE__ */ c(be, {
				item: t,
				onClose: o,
				theme: u
			}, n);
			if (t.type === "custom") return /* @__PURE__ */ c(e.Fragment, { children: t.render(o) }, n);
			let r = t.danger ? f.danger : f.text;
			return /* @__PURE__ */ l("button", {
				disabled: t.disabled,
				onClick: () => {
					t.onClick(), o();
				},
				className: "w-full flex items-center gap-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
				style: {
					padding: "6px 24px 6px 16px",
					fontSize: 13,
					color: r,
					lineHeight: "20px"
				},
				onMouseEnter: (e) => {
					t.disabled || (e.currentTarget.style.background = f.hover);
				},
				onMouseLeave: (e) => {
					e.currentTarget.style.background = "";
				},
				children: [
					/* @__PURE__ */ c("span", {
						style: {
							width: 20,
							flexShrink: 0,
							color: t.danger ? f.danger : f.accent,
							fontSize: 14,
							display: "inline-flex",
							alignItems: "center"
						},
						children: t.checked ? "✓" : t.icon ? t.icon : ""
					}),
					/* @__PURE__ */ c("span", {
						className: "flex-1",
						children: t.label
					}),
					t.shortcut && /* @__PURE__ */ c("span", {
						style: {
							color: f.shortcut,
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
function be({ item: t, onClose: n, theme: r }) {
	let [i, o] = e.useState(null), s = ve[r], u = a(null), d = a(void 0), f = () => {
		d.current && clearTimeout(d.current);
		let e = u.current?.getBoundingClientRect();
		e && o({
			top: e.top - 4,
			left: e.right - 2,
			minWidth: 220
		});
	}, p = () => {
		d.current && clearTimeout(d.current), d.current = setTimeout(() => o(null), 180);
	};
	return /* @__PURE__ */ l("div", {
		onMouseEnter: f,
		onMouseLeave: p,
		style: { position: "relative" },
		children: [/* @__PURE__ */ l("button", {
			ref: u,
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
				/* @__PURE__ */ c("span", {
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
				/* @__PURE__ */ c("span", {
					className: "flex-1",
					children: t.label
				}),
				/* @__PURE__ */ c("span", {
					style: {
						color: s.label,
						fontSize: 12,
						marginLeft: 24,
						flexShrink: 0
					},
					children: "▸"
				})
			]
		}), i && /* @__PURE__ */ c("div", {
			onMouseEnter: f,
			onMouseLeave: p,
			children: /* @__PURE__ */ c(ye, {
				items: t.items,
				pos: i,
				onClose: n,
				theme: r
			})
		})]
	});
}
function xe() {
	let [t, n] = e.useState(null);
	return {
		pos: t,
		open: (e) => {
			let t = e.currentTarget.getBoundingClientRect();
			n({
				top: t.bottom + 2,
				left: t.left
			});
		},
		close: () => n(null),
		isOpen: t !== null
	};
}
//#endregion
//#region ../../src/ui/Checkbox.tsx
var Se = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-sm border-2 cursor-pointer transition-colors checked:bg-[var(--ck)] checked:border-[var(--ck)] before:content-[''] before:w-[11px] before:h-[11px] before:scale-0 before:origin-center before:transition-transform before:duration-100 checked:before:scale-100 before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)] before:shadow-[inset_1em_1em_#fff] disabled:cursor-not-allowed disabled:opacity-50", Ce = {
	default: "border-[#dadce0] hover:border-[#5f6368]",
	dark: "border-[#555] hover:border-[#808080] bg-[#3c3c3c]"
}, we = {
	default: {
		label: "text-sm text-[#202124]",
		desc: "text-xs text-[#5f6368]"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function Te({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: u }) {
	let d = a ?? (i === "dark" ? "#007acc" : "#1a73e8");
	return /* @__PURE__ */ l("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--ck": d
		},
		children: [/* @__PURE__ */ c("input", {
			type: "checkbox",
			checked: e,
			disabled: o,
			onChange: (e) => t(e.target.checked),
			className: N(Se, Ce[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ l("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ c("span", {
				className: P("leading-snug", we[i].label, u),
				children: n
			}), r && /* @__PURE__ */ c("span", {
				className: P("leading-snug mt-0.5", we[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/Radio.tsx
var Ee = "appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-full border-2 cursor-pointer transition-colors checked:border-[var(--rb)] before:content-[''] before:w-[10px] before:h-[10px] before:rounded-full before:bg-[var(--rb)] before:scale-0 before:transition-transform before:duration-100 checked:before:scale-100 disabled:cursor-not-allowed disabled:opacity-50", De = {
	default: "border-[#dadce0] hover:border-[#5f6368]",
	dark: "border-[#555] hover:border-[#808080]"
}, Oe = {
	default: {
		label: "text-sm text-[#202124]",
		desc: "text-xs text-[#5f6368]"
	},
	dark: {
		label: "text-xs text-[#cccccc]",
		desc: "text-[11px] text-[#808080]"
	}
};
function ke({ checked: e, onChange: t, label: n, description: r, variant: i = "default", color: a, disabled: o = !1, className: s, labelClassName: u }) {
	let d = a ?? (i === "dark" ? "#007acc" : "#1a73e8");
	return /* @__PURE__ */ l("label", {
		className: `inline-flex items-start gap-2 select-none ${s ?? ""}`,
		style: {
			cursor: o ? "not-allowed" : "pointer",
			opacity: o ? .5 : 1,
			"--rb": d
		},
		children: [/* @__PURE__ */ c("input", {
			type: "radio",
			checked: e,
			disabled: o,
			onClick: () => {
				o || t(!e);
			},
			onChange: () => {},
			className: N(Ee, De[i], "mt-px")
		}), (n || r) && /* @__PURE__ */ l("div", {
			className: "flex flex-col mt-px min-w-0",
			children: [n && /* @__PURE__ */ c("span", {
				className: P("leading-snug", Oe[i].label, u),
				children: n
			}), r && /* @__PURE__ */ c("span", {
				className: P("leading-snug mt-0.5", Oe[i].desc),
				children: r
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/FloatCheckbox.tsx
function Ae({ selected: e, onToggle: t, className: n }) {
	return /* @__PURE__ */ c("div", {
		role: "checkbox",
		"aria-checked": e,
		onClick: (e) => {
			e.stopPropagation(), t();
		},
		className: N("transition-opacity cursor-pointer", e ? "opacity-100" : "opacity-0 group-hover:opacity-100", n),
		children: /* @__PURE__ */ c("div", {
			className: N("w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors", e ? "bg-primary border-primary" : "bg-black/30 border-white"),
			children: e && /* @__PURE__ */ c("span", {
				className: "text-white text-[10px] font-bold leading-none",
				children: "✓"
			})
		})
	});
}
//#endregion
//#region ../../src/ui/Toggle.tsx
function je({ label: e, description: t, size: n = "md", className: r, id: i, ...a }) {
	let o = i ?? e?.toLowerCase().replace(/\s+/g, "-"), s = n === "sm" ? "h-4 w-7" : "h-5 w-9", u = n === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", d = n === "sm" ? "peer-checked:translate-x-3" : "peer-checked:translate-x-4";
	return /* @__PURE__ */ l("label", {
		htmlFor: o,
		className: N("inline-flex items-start gap-2.5 cursor-pointer select-none", a.disabled && "cursor-not-allowed opacity-50", r),
		children: [/* @__PURE__ */ l("div", {
			className: "relative flex-shrink-0 mt-0.5",
			children: [
				/* @__PURE__ */ c("input", {
					type: "checkbox",
					id: o,
					className: "peer sr-only",
					...a
				}),
				/* @__PURE__ */ c("div", { className: N(s, "rounded-full border border-border bg-surface-3 transition-colors", "peer-checked:bg-primary peer-checked:border-primary", "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1") }),
				/* @__PURE__ */ c("div", { className: N(u, "absolute top-[3px] left-[3px] rounded-full bg-white shadow-sm transition-transform", d) })
			]
		}), (e || t) && /* @__PURE__ */ l("div", {
			className: "flex flex-col gap-0.5",
			children: [e && /* @__PURE__ */ c("span", {
				className: "text-sm text-text-primary leading-5",
				children: e
			}), t && /* @__PURE__ */ c("span", {
				className: "text-xs text-text-secondary",
				children: t
			})]
		})]
	});
}
//#endregion
//#region ../../src/ui/Badge.tsx
var Me = {
	default: "bg-surface-2 text-text-secondary",
	primary: "bg-primary-light text-primary",
	success: "bg-success-light text-success",
	warning: "bg-warning-light text-warning",
	danger: "bg-danger-light text-danger",
	neutral: "bg-surface-3 text-text-primary"
}, Ne = {
	default: "bg-text-tertiary",
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
	danger: "bg-danger",
	neutral: "bg-text-secondary"
}, Pe = {
	sm: "text-[10px] px-1.5 py-0.5",
	md: "text-xs px-2 py-0.5"
};
function Fe({ children: e, variant: t = "default", size: n = "md", className: r, dot: i = !1 }) {
	return /* @__PURE__ */ l("span", {
		className: N("inline-flex items-center gap-1 rounded-full font-medium", Me[t], Pe[n], r),
		children: [i && /* @__PURE__ */ c("span", { className: N("h-1.5 w-1.5 rounded-full flex-shrink-0", Ne[t]) }), e]
	});
}
//#endregion
//#region ../../src/ui/Spinner.tsx
var Ie = {
	xs: "h-3 w-3 border",
	sm: "h-4 w-4 border-2",
	md: "h-6 w-6 border-2",
	lg: "h-8 w-8 border-[3px]"
};
function Le({ size: e = "md", className: t, label: n = "Chargement…" }) {
	return /* @__PURE__ */ c("span", {
		role: "status",
		"aria-label": n,
		className: N("inline-block rounded-full border-border border-t-primary animate-spin", Ie[e], t)
	});
}
function Re({ label: e = "Chargement…" }) {
	return /* @__PURE__ */ c("div", {
		className: "absolute inset-0 flex items-center justify-center bg-white/70 z-10",
		children: /* @__PURE__ */ c(Le, {
			size: "lg",
			label: e
		})
	});
}
//#endregion
//#region ../../src/ui/Separator.tsx
function ze({ orientation: e = "horizontal", className: t }) {
	return /* @__PURE__ */ c("div", {
		role: "separator",
		"aria-orientation": e,
		className: N("bg-border flex-shrink-0", e === "horizontal" ? "h-px w-full" : "w-px self-stretch", t)
	});
}
//#endregion
//#region ../../src/ui/DatePicker.tsx
var Be = [
	"L",
	"M",
	"M",
	"J",
	"V",
	"S",
	"D"
], Ve = [
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
function He(e, t) {
	if (!e) return null;
	try {
		if (t === "time") {
			let [t, n] = e.split(":").map(Number);
			if (isNaN(t) || isNaN(n)) return null;
			let r = /* @__PURE__ */ new Date();
			return r.setHours(t, n, 0, 0), r;
		}
		let n = ie(e);
		return re(n) ? n : null;
	} catch {
		return null;
	}
}
function Ue(e, t) {
	return e ? t === "date" ? z(e, "dd/MM/yyyy") : t === "time" ? z(e, "HH:mm") : t === "datetime" ? z(e, "dd/MM/yyyy HH:mm") : "" : "";
}
function J(e, t) {
	return e ? t === "date" ? z(e, "yyyy-MM-dd") : t === "time" ? z(e, "HH:mm") : t === "datetime" ? z(e, "yyyy-MM-dd'T'HH:mm") : null : null;
}
function We(e) {
	return te({
		start: oe(ae(e), { weekStartsOn: 1 }),
		end: R(L(e), { weekStartsOn: 1 })
	});
}
function Ge(e) {
	let t = e - e % 12;
	return Array.from({ length: 12 }, (e, n) => t + n);
}
function Ke(e, t, n) {
	let r = e.getBoundingClientRect(), i = window.innerHeight - r.bottom - 8, a = r.top - 8;
	return {
		top: i >= t || i >= a ? r.bottom + window.scrollY + 4 : r.top + window.scrollY - t - 4,
		left: Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - n - 8))
	};
}
function qe({ values: e, selected: t, onSelect: r, label: i }) {
	let o = a(null), s = a(null);
	return n(() => {
		let e = s.current, t = o.current;
		!e || !t || (t.scrollTop = e.offsetTop - t.clientHeight / 2 + e.clientHeight / 2);
	}, [t, i]), /* @__PURE__ */ l("div", {
		className: "flex flex-col items-center w-14",
		children: [/* @__PURE__ */ c("span", {
			className: "text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1",
			children: i
		}), /* @__PURE__ */ c("div", {
			ref: o,
			className: "relative overflow-y-auto h-40",
			style: { scrollbarWidth: "none" },
			children: e.map((e) => /* @__PURE__ */ c("button", {
				ref: e === t ? s : void 0,
				type: "button",
				onClick: () => r(e),
				className: N("w-14 h-8 flex items-center justify-center text-sm rounded transition-colors", e === t ? "bg-primary/10 text-primary font-semibold" : "text-text-primary hover:bg-surface-2"),
				children: String(e).padStart(2, "0")
			}, e))
		})]
	});
}
function Je({ viewDate: e, setViewDate: n, view: r, setView: a, selected: o, onSelect: s, rangeStart: u, rangeEnd: d, hoverDate: f, setHoverDate: p, isRange: g, minDate: _, maxDate: v, disabledDate: y }) {
	let b = _ ? ie(_) : null, x = v ? ie(v) : null, S = t((e) => b && U(e, b) || x && H(e, x) ? !0 : y ? y(e) : !1, [
		b,
		x,
		y
	]), C = i(() => d || (u && !d && f ? f : null), [
		u,
		d,
		f
	]), w = t((e) => {
		if (!g || !u || !C) return !1;
		let [t, n] = U(u, C) ? [u, C] : [C, u];
		return H(e, t) && U(e, n);
	}, [
		g,
		u,
		C
	]), T = t((e) => g ? u && W(e, u) || C && W(e, C) : !1, [
		g,
		u,
		C
	]), E = i(() => Ge(V(e)), [e]);
	if (r === "day") {
		let t = We(e), r = z(e, "MMMM", { locale: ce }), i = r.charAt(0).toUpperCase() + r.slice(1);
		return /* @__PURE__ */ l("div", { children: [
			/* @__PURE__ */ l("div", {
				className: "flex items-center gap-1 mb-2",
				children: [
					/* @__PURE__ */ c("button", {
						type: "button",
						onClick: () => n(se(e, 1)),
						className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
						children: /* @__PURE__ */ c(m, { size: 14 })
					}),
					/* @__PURE__ */ l("div", {
						className: "flex-1 flex items-center justify-center gap-1",
						children: [/* @__PURE__ */ c("button", {
							type: "button",
							onClick: () => a("month"),
							className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
							children: i
						}), /* @__PURE__ */ c("button", {
							type: "button",
							onClick: () => a("year"),
							className: "text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1",
							children: V(e)
						})]
					}),
					/* @__PURE__ */ c("button", {
						type: "button",
						onClick: () => n(I(e, 1)),
						className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors",
						children: /* @__PURE__ */ c(h, { size: 14 })
					})
				]
			}),
			/* @__PURE__ */ c("div", {
				className: "grid grid-cols-7 mb-0.5",
				children: Be.map((e, t) => /* @__PURE__ */ c("div", {
					className: "h-7 flex items-center justify-center text-[11px] font-medium text-text-tertiary",
					children: e
				}, t))
			}),
			/* @__PURE__ */ c("div", {
				className: "grid grid-cols-7",
				onMouseLeave: () => p?.(null),
				children: t.map((t, n) => {
					let r = ne(t, e), i = !g && o && W(t, o), a = T(t), l = w(t), u = S(t), d = G(t);
					return /* @__PURE__ */ c("button", {
						type: "button",
						disabled: u,
						onClick: () => !u && s(t),
						onMouseEnter: () => p?.(t),
						className: N("h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium transition-colors", i || a ? "rounded-full bg-primary text-white" : "", !i && !a && l ? "bg-primary/10 text-primary" : "", !i && !a && !l && !u && d ? "rounded-full border border-primary text-primary hover:bg-primary-light" : "", !i && !a && !l && !u && !d && r ? "rounded-full text-text-primary hover:bg-surface-2" : "", !i && !a && !l && !u && !d && !r ? "rounded-full text-text-tertiary hover:bg-surface-2" : "", u ? "opacity-30 cursor-not-allowed rounded-full" : ""),
						children: z(t, "d")
					}, n);
				})
			})
		] });
	}
	return r === "month" ? /* @__PURE__ */ l("div", { children: [/* @__PURE__ */ l("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ c("button", {
				type: "button",
				onClick: () => n((e) => {
					let t = new Date(e);
					return t.setFullYear(V(e) - 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ c(m, { size: 14 })
			}),
			/* @__PURE__ */ c("button", {
				type: "button",
				onClick: () => a("year"),
				className: "flex-1 text-sm font-semibold text-center text-text-primary hover:text-primary transition-colors rounded hover:bg-surface-1 py-0.5",
				children: V(e)
			}),
			/* @__PURE__ */ c("button", {
				type: "button",
				onClick: () => n((e) => {
					let t = new Date(e);
					return t.setFullYear(V(e) + 1), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ c(h, { size: 14 })
			})
		]
	}), /* @__PURE__ */ c("div", {
		className: "grid grid-cols-3 gap-1",
		children: Ve.map((t, r) => /* @__PURE__ */ c("button", {
			type: "button",
			onClick: () => {
				n((e) => {
					let t = new Date(e);
					return t.setMonth(r), t;
				}), a("day");
			},
			className: N("h-9 rounded-lg text-sm font-medium transition-colors", o && B(o) === r && V(o) === V(e) ? "bg-primary text-white" : "text-text-primary hover:bg-surface-2"),
			children: t
		}, r))
	})] }) : /* @__PURE__ */ l("div", { children: [/* @__PURE__ */ l("div", {
		className: "flex items-center gap-1 mb-3",
		children: [
			/* @__PURE__ */ c("button", {
				type: "button",
				onClick: () => n((e) => {
					let t = new Date(e);
					return t.setFullYear(V(e) - 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ c(m, { size: 14 })
			}),
			/* @__PURE__ */ l("span", {
				className: "flex-1 text-sm font-semibold text-center text-text-primary",
				children: [
					E[0],
					" – ",
					E[E.length - 1]
				]
			}),
			/* @__PURE__ */ c("button", {
				type: "button",
				onClick: () => n((e) => {
					let t = new Date(e);
					return t.setFullYear(V(e) + 12), t;
				}),
				className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary",
				children: /* @__PURE__ */ c(h, { size: 14 })
			})
		]
	}), /* @__PURE__ */ c("div", {
		className: "grid grid-cols-3 gap-1",
		children: E.map((e) => {
			let t = o && V(o) === e, r = V(/* @__PURE__ */ new Date()) === e;
			return /* @__PURE__ */ c("button", {
				type: "button",
				onClick: () => {
					n((t) => {
						let n = new Date(t);
						return n.setFullYear(e), n;
					}), a("month");
				},
				className: N("h-9 rounded-lg text-sm font-medium transition-colors", t ? "bg-primary text-white" : r ? "border border-primary text-primary hover:bg-primary-light" : "text-text-primary hover:bg-surface-2"),
				children: e
			}, e);
		})
	})] });
}
function Ye({ mode: e = "date", value: r, onChange: s, startValue: u, endValue: d, onRangeChange: p, label: m, placeholder: h, disabled: g = !1, readOnly: _ = !1, clearable: y = !1, required: b, error: x, hint: S, minDate: C, maxDate: w, disabledDate: T, minuteStep: E = 5, size: D = "md", className: O, id: k, name: A }) {
	let j = a(null), ee = a(null), [P, I] = o(!1), [te, L] = o("day"), [R, z] = o(/* @__PURE__ */ new Date()), B = i(() => He(r, e), [r, e]), V = i(() => He(u, "date"), [u]), H = i(() => He(d, "date"), [d]), [W, ne] = o(() => B?.getHours() ?? 0), [G, re] = o(() => B?.getMinutes() ?? 0), [ie, ae] = o("first"), [oe, se] = o(null), [ce, K] = o(null), [q, le] = o({
		top: 0,
		left: 0
	}), ue = k ?? (typeof m == "string" ? m.toLowerCase().replace(/\s+/g, "-") : void 0), de = i(() => {
		if (e === "daterange") {
			let e = V, t = H;
			return e ? t ? `${Ue(e, "date")} – ${Ue(t, "date")}` : Ue(e, "date") : "";
		}
		return Ue(B, e);
	}, [
		e,
		B,
		V,
		H
	]), fe = t(() => {
		if (g || _) return;
		let t = j.current;
		t && (le(Ke(t, e === "time" ? 230 : e === "datetime" ? 480 : 340, e === "time" ? 172 : 284)), z(e === "daterange" ? V ?? /* @__PURE__ */ new Date() : B ?? /* @__PURE__ */ new Date()), L("day"), B && (e === "time" || e === "datetime") && (ne(B.getHours()), re(B.getMinutes())), e === "daterange" && (ae("first"), se(null), K(null)), I(!0));
	}, [
		g,
		_,
		e,
		B,
		V
	]);
	n(() => {
		if (!P) return;
		let e = (e) => {
			ee.current && !ee.current.contains(e.target) && j.current && !j.current.contains(e.target) && I(!1);
		}, t = (e) => {
			e.key === "Escape" && I(!1);
		};
		return document.addEventListener("mousedown", e), document.addEventListener("keydown", t), () => {
			document.removeEventListener("mousedown", e), document.removeEventListener("keydown", t);
		};
	}, [P]);
	let pe = t((t) => {
		if (e === "daterange") {
			if (ie === "first") se(t), ae("second"), p?.(J(t, "date"), null);
			else {
				let e = oe ?? t, [n, r] = U(e, t) ? [e, t] : [t, e];
				p?.(J(n, "date"), J(r, "date")), I(!1);
			}
			return;
		}
		if (e === "date") {
			s?.(J(t, "date")), I(!1);
			return;
		}
		if (e === "datetime") {
			let e = new Date(t);
			e.setHours(W, G, 0, 0), s?.(J(e, "datetime"));
		}
	}, [
		e,
		ie,
		oe,
		W,
		G,
		s,
		p
	]), me = t((t, n) => {
		let r = e === "datetime" && B ? new Date(B) : /* @__PURE__ */ new Date();
		r.setHours(t, n, 0, 0), s?.(J(r, e));
	}, [
		e,
		B,
		s
	]), he = t((e) => {
		ne(e), me(e, G);
	}, [G, me]), ge = t((e) => {
		re(e), me(W, e);
	}, [W, me]), _e = (t) => {
		t.stopPropagation(), e === "daterange" ? p?.(null, null) : s?.(null);
	}, ve = y && (e === "daterange" ? !!(u || d) : !!r) && !g && !_, ye = D === "sm" ? "h-7 text-xs" : "h-9 text-sm", be = c(e === "time" ? v : f, { size: 14 }), xe = {
		date: "jj/mm/aaaa",
		time: "hh:mm",
		datetime: "jj/mm/aaaa hh:mm",
		daterange: "jj/mm/aaaa – jj/mm/aaaa"
	}[e], Se = Array.from({ length: 24 }, (e, t) => t), Ce = Array.from({ length: Math.ceil(60 / E) }, (e, t) => t * E), we = e !== "time", Te = e === "time" || e === "datetime", Ee = e === "time" ? 172 : 284, De = oe ?? V, Oe = oe ? null : H;
	return /* @__PURE__ */ l("div", {
		className: N("flex flex-col gap-1", O),
		children: [
			m && /* @__PURE__ */ l("label", {
				htmlFor: ue,
				className: "text-sm font-medium text-text-primary",
				children: [m, b && /* @__PURE__ */ c("span", {
					className: "text-danger ml-0.5",
					children: "*"
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "relative",
				children: [A && /* @__PURE__ */ c("input", {
					type: "hidden",
					name: A,
					value: r ?? "",
					readOnly: !0
				}), /* @__PURE__ */ l("button", {
					ref: j,
					id: ue,
					type: "button",
					onClick: fe,
					disabled: g,
					"aria-haspopup": "dialog",
					"aria-expanded": P,
					className: N("w-full flex items-center gap-2 px-3 rounded border bg-white text-left", "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", x ? "border-danger focus:ring-danger" : "border-border", g && "bg-surface-2 cursor-not-allowed opacity-60", _ && "cursor-default", ye),
					children: [
						/* @__PURE__ */ c("span", {
							className: "text-text-tertiary shrink-0",
							children: be
						}),
						/* @__PURE__ */ c("span", {
							className: N("flex-1 truncate", de ? "text-text-primary" : "text-text-tertiary"),
							children: de || (h ?? xe)
						}),
						ve ? /* @__PURE__ */ c("button", {
							type: "button",
							onClick: _e,
							className: "shrink-0 text-text-tertiary hover:text-text-primary transition-colors",
							tabIndex: -1,
							children: /* @__PURE__ */ c(M, { size: 13 })
						}) : null
					]
				})]
			}),
			x && /* @__PURE__ */ c("p", {
				className: "text-xs text-danger",
				children: x
			}),
			S && !x && /* @__PURE__ */ c("p", {
				className: "text-xs text-text-secondary",
				children: S
			}),
			P && F(/* @__PURE__ */ c("div", {
				ref: ee,
				role: "dialog",
				style: {
					position: "absolute",
					top: q.top,
					left: q.left,
					width: Ee,
					zIndex: 9999
				},
				className: "bg-white rounded-xl shadow-2xl border border-border",
				children: /* @__PURE__ */ l("div", {
					className: "p-3 select-none",
					children: [
						we && /* @__PURE__ */ c(Je, {
							viewDate: R,
							setViewDate: z,
							view: te,
							setView: L,
							selected: B,
							onSelect: pe,
							rangeStart: De,
							rangeEnd: Oe,
							hoverDate: ce,
							setHoverDate: K,
							isRange: e === "daterange",
							minDate: C,
							maxDate: w,
							disabledDate: T
						}),
						we && Te && /* @__PURE__ */ c("div", { className: "my-3 h-px bg-border" }),
						Te && /* @__PURE__ */ l("div", {
							className: "flex items-start justify-center gap-1",
							children: [
								/* @__PURE__ */ c(qe, {
									values: Se,
									selected: W,
									onSelect: he,
									label: "Heure"
								}),
								/* @__PURE__ */ c("span", {
									className: "mt-8 text-text-tertiary text-base font-semibold",
									children: ":"
								}),
								/* @__PURE__ */ c(qe, {
									values: Ce,
									selected: Ce.includes(G) ? G : Ce.reduce((e, t) => Math.abs(t - G) < Math.abs(e - G) ? t : e),
									onSelect: ge,
									label: "Min"
								})
							]
						}),
						Te && /* @__PURE__ */ l("div", {
							className: "flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border",
							children: [ve ? /* @__PURE__ */ c("button", {
								type: "button",
								onClick: (e) => {
									_e(e), I(!1);
								},
								className: "text-xs text-text-secondary hover:text-danger transition-colors",
								children: "Effacer"
							}) : /* @__PURE__ */ c("span", {}), /* @__PURE__ */ c("button", {
								type: "button",
								onClick: () => {
									if (!r) {
										let t = e === "datetime" && B ? new Date(B) : /* @__PURE__ */ new Date();
										t.setHours(W, G, 0, 0), s?.(J(t, e));
									}
									I(!1);
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
function Xe({ tabs: e, value: t, onChange: n, className: r, size: i = "md", variant: a = "underline" }) {
	let o = (e) => e === t, s = i === "sm" ? 14 : 16, u = N(a === "underline" && "flex gap-1 border-b border-border overflow-x-auto overflow-y-hidden", a === "pills" && "flex gap-1", a === "stretched" && "flex border-b border-border", r), d = (e) => N("flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors", i === "sm" && "px-3 py-1.5 text-xs", i === "md" && "px-4 py-2 text-sm", (a === "underline" || a === "stretched") && "-mb-px border-b-2", (a === "underline" || a === "stretched") && o(e) && "border-primary text-primary", (a === "underline" || a === "stretched") && !o(e) && "border-transparent text-text-secondary hover:text-text-primary", a === "stretched" && "flex-1 justify-center", a === "pills" && "rounded-full", a === "pills" && o(e) && "bg-primary-light text-primary", a === "pills" && !o(e) && "text-text-secondary hover:bg-surface-2");
	return /* @__PURE__ */ c("div", {
		className: u,
		children: e.map((e) => {
			let t = e.icon;
			return /* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => n(e.id),
				className: d(e.id),
				children: [
					t && /* @__PURE__ */ c(t, { size: s }),
					e.label,
					e.badge !== void 0 && /* @__PURE__ */ c("span", {
						className: N("rounded-full text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1", o(e.id) ? "bg-primary text-white" : "bg-surface-3 text-text-secondary"),
						children: e.badge
					})
				]
			}, e.id);
		})
	});
}
//#endregion
//#region ../../src/ui/ResizeHandle.tsx
function Ze({ position: e, onResize: t, min: n = 160, max: r = 560, onReset: i, title: a }) {
	return /* @__PURE__ */ l("div", {
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
		children: [/* @__PURE__ */ c("div", { className: "absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/40 transition-colors" }), /* @__PURE__ */ c("div", {
			className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center\n                      h-9 w-3.5 rounded-full bg-surface-0 border border-border text-text-tertiary shadow-sm\n                      opacity-80 group-hover:opacity-100 group-hover:bg-primary-light group-hover:text-primary\n                      group-hover:border-primary/40 transition",
			children: /* @__PURE__ */ c(x, { size: 13 })
		})]
	});
}
function Qe(e, t, r = 160, i = 560) {
	let [a, s] = o(() => {
		let n = Number(localStorage.getItem(e));
		return n >= r && n <= i ? n : t;
	});
	return n(() => {
		try {
			localStorage.setItem(e, String(a));
		} catch {}
	}, [e, a]), [a, s];
}
//#endregion
//#region ../../src/ui/StartPage.tsx
var $e = "kubuno.startpage.recentW", et = 180, tt = 520, nt = 256;
function rt({ recentTitle: e = "Récents", recentIcon: t, recentItems: n, recentEmpty: r, tabs: i, defaultTab: a, activeTab: u, onTabChange: d }) {
	let [f, p] = o(a ?? i[0]?.id ?? ""), m = u ?? f, [h, g] = Qe($e, nt, et, tt), _ = (e) => {
		d?.(e), u === void 0 && p(e);
	}, y = i.map((e) => ({
		id: e.id,
		label: e.label
	})), b = i.find((e) => e.id === m) ?? i[0], [x, S] = o(null), C = (e, t) => {
		!t.actions || t.actions.length === 0 || (e.preventDefault(), S({
			x: Math.min(e.clientX, window.innerWidth - 200),
			y: Math.min(e.clientY, window.innerHeight - (t.actions.length * 36 + 16)),
			actions: t.actions
		}));
	};
	return /* @__PURE__ */ l("div", {
		className: "relative flex h-full overflow-hidden bg-white",
		children: [
			/* @__PURE__ */ l("aside", {
				className: "flex-shrink-0 bg-surface-1 flex flex-col overflow-hidden",
				style: { width: h },
				children: [/* @__PURE__ */ l("div", {
					className: "px-4 h-[57px] flex items-center gap-2 border-b border-border flex-shrink-0",
					children: [/* @__PURE__ */ c("span", {
						className: "text-text-tertiary flex-shrink-0",
						children: t ?? /* @__PURE__ */ c(v, { size: 15 })
					}), /* @__PURE__ */ c("span", {
						className: "text-sm font-medium text-text-primary",
						children: e
					})]
				}), n.length === 0 ? /* @__PURE__ */ c("div", {
					className: "flex-1 flex items-center justify-center px-4 text-center",
					children: r ?? /* @__PURE__ */ c("p", {
						className: "text-text-tertiary text-xs",
						children: "—"
					})
				}) : /* @__PURE__ */ c("div", {
					className: "flex-1 overflow-y-auto py-1",
					children: n.map((e) => /* @__PURE__ */ l("button", {
						onClick: e.onClick,
						onContextMenu: (t) => C(t, e),
						className: `w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${e.pendingTone ? "pointer-events-none" : "hover:bg-surface-2"}`,
						style: e.pendingTone ? { backgroundColor: e.pendingTone === "permanent" ? "#fee2e2" : "#f3e8ff" } : void 0,
						children: [e.icon && /* @__PURE__ */ c("span", {
							className: "flex-shrink-0",
							children: e.icon
						}), /* @__PURE__ */ l("span", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ c("span", {
								className: "block text-sm text-text-primary truncate",
								title: e.name,
								children: e.name
							}), e.subtitle && /* @__PURE__ */ c("span", {
								className: "block text-[11px] text-text-tertiary",
								children: e.subtitle
							})]
						})]
					}, e.id))
				})]
			}),
			/* @__PURE__ */ c(Ze, {
				position: h,
				onResize: g,
				min: et,
				max: tt,
				onReset: () => g(nt),
				title: e
			}),
			/* @__PURE__ */ l("div", {
				className: "flex-1 min-w-0 flex flex-col overflow-hidden",
				children: [/* @__PURE__ */ c("div", {
					className: "px-6 h-[57px] flex items-center flex-shrink-0 border-b border-border",
					children: /* @__PURE__ */ c(Xe, {
						tabs: y,
						value: m,
						onChange: _
					})
				}), /* @__PURE__ */ c("div", {
					className: "flex-1 min-h-0 overflow-hidden flex flex-col",
					children: b?.content
				})]
			}),
			x && /* @__PURE__ */ l(s, { children: [/* @__PURE__ */ c("div", {
				className: "fixed inset-0 z-[9998]",
				onClick: () => S(null),
				onContextMenu: (e) => {
					e.preventDefault(), S(null);
				}
			}), /* @__PURE__ */ c("div", {
				className: "fixed z-[9999] min-w-[190px] bg-white border border-border rounded-lg shadow-lg py-1",
				style: {
					top: x.y,
					left: x.x
				},
				children: x.actions.map((e) => /* @__PURE__ */ l("button", {
					onClick: () => {
						S(null), e.onClick();
					},
					className: `w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                  ${e.danger ? "text-danger hover:bg-danger/10" : "text-text-primary hover:bg-surface-1"}`,
					children: [e.icon && /* @__PURE__ */ c("span", {
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
function it({ size: e = 24, className: t, title: n = "Kubuno" }) {
	return /* @__PURE__ */ l("svg", {
		width: Math.round(e * 321 / 346),
		height: e,
		viewBox: "0 0 321 346",
		fill: "currentColor",
		role: "img",
		"aria-label": n,
		className: t,
		children: [/* @__PURE__ */ c("title", { children: n }), /* @__PURE__ */ l("g", {
			transform: "translate(0,346) scale(0.1,-0.1)",
			stroke: "none",
			children: [
				/* @__PURE__ */ c("path", { d: "M264 3307 c-3 -8 -3 -434 -1 -948 3 -913 3 -936 24 -1009 70 -249 198 -454 419 -672 125 -123 303 -268 328 -268 3 0 5 654 4 1452 l-3 1453 -383 3 c-313 2 -383 0 -388 -11z" }),
				/* @__PURE__ */ c("path", { d: "M1187 3313 c-4 -3 -7 -680 -7 -1504 l0 -1498 27 -19 c38 -27 279 -165 354 -202 l61 -31 61 32 c34 17 87 47 118 65 31 19 60 34 64 34 3 0 26 14 51 30 l44 31 0 729 c0 608 2 731 14 742 7 7 112 110 233 228 120 118 343 336 496 484 l277 269 -2 306 -3 306 -204 3 -203 2 -87 -83 c-47 -47 -151 -147 -231 -225 l-145 -140 -5 -299 -5 -299 -60 -62 c-32 -34 -63 -62 -67 -62 -4 0 -9 262 -10 583 l-3 582 -381 3 c-209 1 -383 -1 -387 -5z" }),
				/* @__PURE__ */ c("path", { d: "M2217 1782 l-118 -117 1 -265 2 -265 225 -225 224 -225 61 64 c133 140 264 349 319 508 l20 58 -143 138 c-294 284 -459 442 -466 444 -4 1 -60 -51 -125 -115z" })
			]
		})]
	});
}
//#endregion
//#region ../../src/ui/color.ts
function Y(e) {
	return [
		parseInt(e.slice(1, 3), 16),
		parseInt(e.slice(3, 5), 16),
		parseInt(e.slice(5, 7), 16)
	];
}
function X(e, t, n) {
	return "#" + [
		e,
		t,
		n
	].map((e) => Math.max(0, Math.min(255, Math.round(e))).toString(16).padStart(2, "0")).join("");
}
function at(e, t, n) {
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
function ot(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function Z(e, t, n) {
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
		ot(i, r, e + 1 / 3) * 255,
		ot(i, r, e) * 255,
		ot(i, r, e - 1 / 3) * 255
	];
}
function st(e, t, n) {
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
function ct(e, t, n) {
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
var lt = {
	accent: "#5a9bdc",
	border: "#212121",
	text: "#d6d6d6",
	textDim: "#8e8e8e",
	toolbar: "#393939",
	surface: "#252525",
	title: "#c0c0c0"
}, ut = {
	accent: "#1a73e8",
	border: "#dadce0",
	text: "#202124",
	textDim: "#5f6368",
	toolbar: "#ffffff",
	surface: "#f1f3f4",
	title: "#5f6368"
};
function dt(e, t) {
	return typeof window > "u" ? t : getComputedStyle(document.documentElement).getPropertyValue(e).trim() || t;
}
function ft() {
	return {
		accent: dt("--color-primary", "#1a73e8"),
		border: dt("--color-border", "#dadce0"),
		text: dt("--color-text-primary", "#202124"),
		textDim: dt("--color-text-secondary", "#5f6368"),
		toolbar: dt("--color-surface-0", "#ffffff"),
		surface: dt("--color-surface-2", "#f1f3f4"),
		title: dt("--color-text-secondary", "#5f6368")
	};
}
function pt() {
	let [e, t] = o(ft);
	return n(() => {
		let e = new MutationObserver(() => t(ft()));
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
var mt = {
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
function ht(e, t, n, r) {
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
function gt({ size: e, h: t, s: r, v: i, shape: o, onChange: s }) {
	let u = a(null), d = a(!1), f = e / 2 - 1, p = e / 2, m = e / 2, h = .8660254, g = {
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
		if (o === "triangle") {
			let e = 1 - i, t = r * i, n = (1 - r) * i;
			return [n * g.w[0] + t * g.hue[0] + e * g.blk[0], n * g.w[1] + t * g.hue[1] + e * g.blk[1]];
		}
		let t = r * e, n = (1 - i) * e;
		if (o === "circle") {
			let r = e / 2, i = e / 2, a = e / 2, o = t - r, s = n - i, c = Math.hypot(o, s);
			c > a && (o *= a / c, s *= a / c, t = r + o, n = i + s);
		}
		return [t, n];
	};
	n(() => {
		let n = u.current;
		if (!n) return;
		let r = n.getContext("2d"), i = Math.round(e * 3);
		n.width = i, n.height = i;
		let a = r.createImageData(i, i), s = a.data, c = i / 2, l = [g.w[0] * 3, g.w[1] * 3], d = [g.hue[0] * 3, g.hue[1] * 3], f = [g.blk[0] * 3, g.blk[1] * 3];
		for (let e = 0; e < i; e++) for (let n = 0; n < i; n++) {
			let r = 0, a = 0, u = !0;
			if (o === "triangle") {
				let [t, i, o] = _(n + .5, e + .5, l, d, f);
				t < 0 || i < 0 || o < 0 ? u = !1 : (a = 1 - o, r = t + i > 0 ? i / (t + i) : 0);
			} else if (o === "circle") {
				let t = n - c, o = e - c;
				Math.hypot(t, o) > c ? u = !1 : (r = n / i, a = 1 - e / i);
			} else r = n / i, a = 1 - e / i;
			let p = (e * i + n) * 4;
			if (!u) {
				s[p + 3] = 0;
				continue;
			}
			let [m, h, g] = Q(t, r, a);
			s[p] = m, s[p + 1] = h, s[p + 2] = g, s[p + 3] = 255;
		}
		r.putImageData(a, 0, 0);
	}, [
		t,
		o,
		e
	]);
	let y = (t) => {
		let n = u.current;
		if (!n) return;
		let r = n.getBoundingClientRect(), i = t.clientX - r.left, a = t.clientY - r.top;
		if (o === "triangle") {
			let [e, t, n] = _(i, a, g.w, g.hue, g.blk);
			e = Math.max(0, e), t = Math.max(0, t), n = Math.max(0, n);
			let r = e + t + n || 1;
			e /= r, t /= r, n /= r;
			let o = 1 - n;
			s(e + t > 0 ? t / (e + t) : 0, o);
			return;
		}
		if (o === "circle") {
			let t = e / 2, n = e / 2, r = e / 2, o = i - t, s = a - n, c = Math.hypot(o, s);
			c > r && (i = t + o * r / c, a = n + s * r / c);
		}
		s(Math.max(0, Math.min(1, i / e)), Math.max(0, Math.min(1, 1 - a / e)));
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
	return /* @__PURE__ */ l("div", {
		className: "absolute",
		style: {
			left: (212 - e) / 2,
			top: (212 - e) / 2,
			width: e,
			height: e
		},
		children: [/* @__PURE__ */ c("canvas", {
			ref: u,
			onPointerDown: (e) => {
				d.current = !0, y(e);
			},
			style: {
				width: e,
				height: e,
				cursor: "crosshair",
				borderRadius: o === "circle" ? "50%" : 2
			}
		}), /* @__PURE__ */ c("div", {
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
function _t({ label: e, value: t, max: r, track: i, onInput: o, C: s }) {
	let u = a(null), d = a(!1), f = (e) => {
		let t = u.current;
		if (!t) return;
		let n = t.getBoundingClientRect();
		o(Math.max(0, Math.min(1, (e.clientX - n.left) / n.width)) * r);
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
	}), /* @__PURE__ */ l("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ c("span", {
				className: "text-[10px] w-3 text-center",
				style: { color: s.textDim },
				children: e
			}),
			/* @__PURE__ */ c("div", {
				ref: u,
				onPointerDown: (e) => {
					d.current = !0, f(e);
				},
				className: "relative flex-1 h-3 cursor-pointer",
				style: {
					background: i,
					border: `1px solid ${s.border}`,
					borderRadius: 2
				},
				children: /* @__PURE__ */ c("div", {
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
			/* @__PURE__ */ c("input", {
				type: "number",
				min: 0,
				max: Math.round(r),
				value: Math.round(t),
				onChange: (e) => o(Math.max(0, Math.min(r, +e.target.value))),
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
function vt({ t: e, color: t, onChange: r, onClose: i, C: s = lt, history: u = [], onPickHistory: d, onConfirm: f, onCancel: p, confirmLabel: m, cancelLabel: h }) {
	let g = {
		...lt,
		...s
	}, v = (t) => e ? e(t) : mt[t] ?? t, [y, b, x] = Y(t), [S, C, w] = st(y, b, x), [T, E] = o(S), [D, O] = o(C), [A, ee] = o(w), [M, N] = o("RGB"), [P, F] = o("square"), [I, te] = o("comp");
	n(() => {
		let [e, n, r] = Y(t);
		if (X(...Q(T, D, A)).toLowerCase() !== t.toLowerCase()) {
			let [t, i, a] = st(e, n, r);
			E(t), O(i), ee(a);
		}
	}, [t]);
	let L = (e, t, n) => {
		E(e), O(t), ee(n), r(X(...Q(e, t, n)));
	}, R = (e, t, n) => {
		let [r, i, a] = st(e, t, n);
		L(r, i, a);
	}, z = a(null), B = a(!1), V = (e) => {
		let t = z.current;
		if (!t) return;
		let n = t.getBoundingClientRect(), r = e.clientX - n.left - n.width / 2, i = e.clientY - n.top - n.height / 2, a = Math.atan2(r, -i) * 180 / Math.PI;
		a = (a + 360) % 360, L(a, D, A);
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
	let [H, U, W] = Q(T, D, A).map(Math.round), ne = X(...Q(T, 1, 1)), G = X(H, U, W), re = T * Math.PI / 180, ie = 212 / 2 + 95 * Math.sin(re), ae = 212 / 2 - 95 * Math.cos(re), oe = Math.round(156 / Math.SQRT2), se = P === "square" ? oe : 162, ce = ht(I, T, D, A), K = (e, t, n) => X(Math.round(e), Math.round(t), Math.round(n)), q = [];
	if (M === "RGB") q = [
		{
			l: "R",
			val: H,
			max: 255,
			track: `linear-gradient(to right,${K(0, U, W)},${K(255, U, W)})`,
			set: (e) => R(e, U, W)
		},
		{
			l: "G",
			val: U,
			max: 255,
			track: `linear-gradient(to right,${K(H, 0, W)},${K(H, 255, W)})`,
			set: (e) => R(H, e, W)
		},
		{
			l: "B",
			val: W,
			max: 255,
			track: `linear-gradient(to right,${K(H, U, 0)},${K(H, U, 255)})`,
			set: (e) => R(H, U, e)
		}
	];
	else if (M === "HSV") q = [
		{
			l: "H",
			val: T,
			max: 360,
			track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
			set: (e) => L(e, D, A)
		},
		{
			l: "S",
			val: D * 100,
			max: 100,
			track: `linear-gradient(to right,${K(...Q(T, 0, A))},${K(...Q(T, 1, A))})`,
			set: (e) => L(T, e / 100, A)
		},
		{
			l: "V",
			val: A * 100,
			max: 100,
			track: `linear-gradient(to right,#000,${K(...Q(T, D, 1))})`,
			set: (e) => L(T, D, e / 100)
		}
	];
	else if (M === "HSL") {
		let [e, t, n] = at(H, U, W);
		q = [
			{
				l: "H",
				val: e,
				max: 360,
				track: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
				set: (e) => R(...Z(e, t, n))
			},
			{
				l: "S",
				val: t * 100,
				max: 100,
				track: `linear-gradient(to right,${K(...Z(e, 0, n))},${K(...Z(e, 1, n))})`,
				set: (t) => R(...Z(e, t / 100, n))
			},
			{
				l: "L",
				val: n * 100,
				max: 100,
				track: `linear-gradient(to right,#000,${K(...Z(e, t, .5))},#fff)`,
				set: (n) => R(...Z(e, t, n / 100))
			}
		];
	} else if (M === "CMYK") {
		let [e, t, n, r] = ct(H, U, W);
		q = [
			{
				l: "C",
				val: e,
				max: 100,
				track: `linear-gradient(to right,${K(...$(0, t, n, r))},${K(...$(100, t, n, r))})`,
				set: (e) => R(...$(e, t, n, r))
			},
			{
				l: "M",
				val: t,
				max: 100,
				track: `linear-gradient(to right,${K(...$(e, 0, n, r))},${K(...$(e, 100, n, r))})`,
				set: (t) => R(...$(e, t, n, r))
			},
			{
				l: "Y",
				val: n,
				max: 100,
				track: `linear-gradient(to right,${K(...$(e, t, 0, r))},${K(...$(e, t, 100, r))})`,
				set: (n) => R(...$(e, t, n, r))
			},
			{
				l: "K",
				val: r,
				max: 100,
				track: `linear-gradient(to right,${K(...$(e, t, n, 0))},#000)`,
				set: (r) => R(...$(e, t, n, r))
			}
		];
	} else q = [{
		l: "K",
		val: Math.round((H + U + W) / 3) / 255 * 100,
		max: 100,
		track: "linear-gradient(to right,#000,#fff)",
		set: (e) => {
			let t = Math.round(e / 100 * 255);
			R(t, t, t);
		}
	}];
	return /* @__PURE__ */ l("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 236,
			background: g.toolbar,
			border: `1px solid ${g.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ l("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ c("span", {
					className: "text-[10px] font-medium",
					style: { color: g.title },
					children: v("layer_color_picker")
				}), /* @__PURE__ */ c("button", {
					onClick: i,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: g.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "relative mx-auto",
				style: {
					width: 212,
					height: 212
				},
				children: [
					/* @__PURE__ */ c("div", {
						ref: z,
						onPointerDown: (e) => {
							B.current = !0, V(e);
						},
						className: "absolute inset-0 rounded-full cursor-pointer",
						style: { background: "conic-gradient(#f00 0deg,#ff0 60deg,#0f0 120deg,#0ff 180deg,#00f 240deg,#f0f 300deg,#f00 360deg)" }
					}),
					/* @__PURE__ */ c("div", {
						className: "absolute rounded-full",
						style: {
							inset: 22,
							background: g.toolbar
						}
					}),
					/* @__PURE__ */ c("div", {
						className: "absolute rounded-full pointer-events-none",
						style: {
							width: 14,
							height: 14,
							border: "2px solid #fff",
							boxShadow: "0 0 0 1px rgba(0,0,0,.6)",
							background: ne,
							left: ie - 7,
							top: ae - 7
						}
					}),
					ce.slice(1).map((e, t) => {
						let n = e[0] * Math.PI / 180, r = 212 / 2 + 95 * Math.sin(n), i = 212 / 2 - 95 * Math.cos(n);
						return /* @__PURE__ */ c("div", {
							className: "absolute rounded-full pointer-events-none",
							style: {
								width: 10,
								height: 10,
								border: "2px solid rgba(255,255,255,.85)",
								background: X(...Q(e[0], e[1], e[2])),
								left: r - 5,
								top: i - 5
							}
						}, t);
					}),
					/* @__PURE__ */ c(gt, {
						size: se,
						h: T,
						s: D,
						v: A,
						shape: P,
						onChange: (e, t) => L(T, e, t)
					})
				]
			}),
			/* @__PURE__ */ l("div", {
				className: "flex items-center gap-1 mt-2",
				children: [
					[
						"square",
						"triangle",
						"circle"
					].map((e) => /* @__PURE__ */ c("button", {
						onClick: () => F(e),
						title: e,
						className: "w-6 h-6 flex items-center justify-center",
						style: {
							borderRadius: 3,
							background: P === e ? g.accent : g.surface,
							color: P === e ? "#fff" : g.textDim,
							border: `1px solid ${g.border}`
						},
						children: c(e === "square" ? k : e === "triangle" ? j : _, { size: 12 })
					}, e)),
					/* @__PURE__ */ c("div", { style: {
						width: 1,
						height: 16,
						background: g.border,
						margin: "0 2px"
					} }),
					/* @__PURE__ */ l("select", {
						value: I,
						onChange: (e) => te(e.target.value),
						className: "flex-1 h-6 text-[10px] px-1 outline-none",
						style: {
							background: g.surface,
							color: g.text,
							border: `1px solid ${g.border}`,
							borderRadius: 3
						},
						children: [
							/* @__PURE__ */ c("option", {
								value: "comp",
								children: v("layer_harmony_comp")
							}),
							/* @__PURE__ */ c("option", {
								value: "analog",
								children: v("layer_harmony_analog")
							}),
							/* @__PURE__ */ c("option", {
								value: "triad",
								children: v("layer_harmony_triad")
							}),
							/* @__PURE__ */ c("option", {
								value: "tetrad",
								children: v("layer_harmony_tetrad")
							}),
							/* @__PURE__ */ c("option", {
								value: "split",
								children: v("layer_harmony_split")
							}),
							/* @__PURE__ */ c("option", {
								value: "mono",
								children: v("layer_harmony_mono")
							})
						]
					})
				]
			}),
			/* @__PURE__ */ c("div", {
				className: "flex gap-1 mt-1.5",
				children: ce.map((e, t) => {
					let n = X(...Q(e[0], e[1], e[2]));
					return /* @__PURE__ */ c("button", {
						onClick: () => L(e[0], e[1], e[2]),
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
			/* @__PURE__ */ l("div", {
				className: "flex items-center gap-2 mt-2",
				children: [
					/* @__PURE__ */ c("div", { style: {
						width: 28,
						height: 24,
						background: G,
						border: `1px solid ${g.border}`,
						borderRadius: 2,
						flexShrink: 0
					} }),
					/* @__PURE__ */ c("span", {
						className: "text-[10px]",
						style: { color: g.textDim },
						children: "#"
					}),
					/* @__PURE__ */ c("input", {
						value: G.replace("#", "").toUpperCase(),
						onChange: (e) => {
							let t = "#" + e.target.value.trim();
							if (/^#[0-9a-fA-F]{6}$/.test(t)) {
								let [e, n, r] = Y(t);
								R(e, n, r);
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
			/* @__PURE__ */ c("div", {
				className: "flex mt-2.5 mb-1.5",
				style: { borderBottom: `1px solid ${g.border}` },
				children: [
					"RGB",
					"HSV",
					"HSL",
					"CMYK",
					"GRAY"
				].map((e) => /* @__PURE__ */ c("button", {
					onClick: () => N(e),
					className: "px-1.5 py-0.5 text-[9px] font-medium",
					style: {
						color: M === e ? g.accent : g.textDim,
						borderBottom: M === e ? `2px solid ${g.accent}` : "2px solid transparent"
					},
					children: e
				}, e))
			}),
			/* @__PURE__ */ c("div", {
				className: "space-y-1.5",
				children: q.map((e) => /* @__PURE__ */ c(_t, {
					label: e.l,
					value: e.val,
					max: e.max,
					track: e.track,
					onInput: e.set,
					C: g
				}, e.l))
			}),
			/* @__PURE__ */ c("div", {
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
				].map((e) => /* @__PURE__ */ c("button", {
					onClick: () => {
						let [t, n, r] = Y(e);
						R(t, n, r);
					},
					title: e,
					style: {
						width: 16,
						height: 16,
						background: e,
						borderRadius: 2,
						border: `1px solid ${e.toLowerCase() === G.toLowerCase() ? g.accent : g.border}`
					}
				}, e))
			}),
			u.length > 0 && /* @__PURE__ */ l("div", {
				className: "mt-3 pt-2",
				style: { borderTop: `1px solid ${g.border}` },
				children: [/* @__PURE__ */ c("div", {
					className: "text-[9px] uppercase tracking-wide mb-1.5",
					style: { color: g.textDim },
					children: v("layer_color_recent")
				}), /* @__PURE__ */ c("div", {
					className: "grid gap-1",
					style: { gridTemplateColumns: "repeat(10, 1fr)" },
					children: u.slice(0, 30).map((e, t) => /* @__PURE__ */ c("button", {
						title: e,
						onClick: () => {
							let [t, n, r] = Y(e);
							R(t, n, r), d?.(e);
						},
						className: "aspect-square transition-transform hover:scale-110",
						style: {
							background: e,
							borderRadius: 3,
							border: `1px solid ${e.toLowerCase() === G.toLowerCase() ? g.accent : g.border}`,
							boxShadow: e.toLowerCase() === G.toLowerCase() ? `0 0 0 1px ${g.accent}` : "none"
						}
					}, e + t))
				})]
			}),
			(f || p) && /* @__PURE__ */ l("div", {
				className: "flex items-center justify-end gap-2 mt-3 pt-2.5",
				style: { borderTop: `1px solid ${g.border}` },
				children: [p && /* @__PURE__ */ c("button", {
					onClick: p,
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: g.text,
						background: "transparent",
						border: `1px solid ${g.border}`
					},
					children: h ?? v("layer_color_cancel")
				}), f && /* @__PURE__ */ c("button", {
					onClick: () => f(G),
					className: "px-3 h-7 text-[11px] font-medium rounded transition-colors",
					style: {
						color: "#fff",
						background: g.accent,
						border: `1px solid ${g.accent}`
					},
					children: m ?? v("layer_color_confirm")
				})]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/ColorField.tsx
function yt({ t: e, C: t, color: i, onChange: u, history: d, onPickHistory: f, className: p, style: m, width: h = 32, height: g = 24 }) {
	let _ = pt(), v = t ?? _, [y, b] = o(!1), x = a(null), S = a(null), [C, w] = o(null), T = () => {
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
	return r(() => {
		if (!y) {
			w(null);
			return;
		}
		T();
	}, [y]), n(() => {
		if (!y) return;
		let e = () => T();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [y]), /* @__PURE__ */ l(s, { children: [/* @__PURE__ */ c("button", {
		ref: x,
		type: "button",
		onClick: () => b((e) => !e),
		className: p,
		style: {
			width: h,
			height: g,
			background: i,
			border: `1px solid ${y ? v.accent : v.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...m
		}
	}), y && F(/* @__PURE__ */ l(s, { children: [/* @__PURE__ */ c("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => b(!1)
	}), /* @__PURE__ */ c("div", {
		ref: S,
		className: "fixed",
		style: {
			left: C?.left ?? 0,
			top: C?.top ?? 0,
			zIndex: 200,
			visibility: C ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ c(vt, {
			t: e,
			C: v,
			color: i,
			onChange: u,
			onClose: () => b(!1),
			history: d,
			onPickHistory: f
		})
	})] }), document.body)] });
}
//#endregion
//#region ../../src/ui/ColorSwatchPicker.tsx
var bt = "kubuno:picker:custom-swatches";
function xt() {
	if (typeof localStorage > "u") return [];
	try {
		let e = JSON.parse(localStorage.getItem(bt) || "[]");
		return Array.isArray(e) ? e.slice(0, 20) : [];
	} catch {
		return [];
	}
}
var St = /* @__PURE__ */ "#000000.#434343.#666666.#999999.#b7b7b7.#cccccc.#d9d9d9.#efefef.#f3f3f3.#ffffff.#980000.#ff0000.#ff9900.#ffff00.#00ff00.#00ffff.#4a86e8.#0000ff.#9900ff.#ff00ff.#e6b8af.#f4cccc.#fce5cd.#fff2cc.#d9ead3.#d0e0e3.#c9daf8.#cfe2f3.#d9d2e9.#ead1dc.#dd7e6b.#ea9999.#f9cb9c.#ffe599.#b6d7a8.#a2c4c9.#a4c2f4.#9fc5e8.#b4a7d6.#d5a6bd.#cc4125.#e06666.#f6b26b.#ffd966.#93c47d.#76a5af.#6d9eeb.#6fa8dc.#8e7cc3.#c27ba0.#a61c00.#cc0000.#e69138.#f1c232.#6aa84f.#45818e.#3c78d8.#3d85c6.#674ea7.#a64d79.#85200c.#990000.#b45f06.#bf9000.#38761d.#134f5c.#1155cc.#0b5394.#351c75.#741b47.#5b0f00.#660000.#783f04.#7f6000.#274e13.#0c343d.#1c4587.#073763.#20124d.#4c1130".split(".");
function Ct({ color: e, onChange: t, onClose: n, t: r, theme: i, customLabel: a = "Personnalisé", confirmLabel: s, cancelLabel: u }) {
	let d = pt(), f = i ?? d, [p, m] = o(!1), [h, g] = o(e), [_, v] = o(xt), y = (e) => v((t) => {
		let n = [e, ...t.filter((t) => t.toLowerCase() !== e.toLowerCase())].slice(0, 20);
		try {
			localStorage.setItem(bt, JSON.stringify(n));
		} catch {}
		return n;
	}), b = s ?? (r ? r("color_add", { defaultValue: "Ajouter" }) : "Ajouter"), x = u ?? (r ? r("color_cancel", { defaultValue: "Annuler" }) : "Annuler");
	if (p) return /* @__PURE__ */ c(vt, {
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
	return /* @__PURE__ */ l("div", {
		className: "p-3 rounded-lg shadow-lg border",
		style: {
			width: 232,
			background: f.toolbar,
			borderColor: f.border
		},
		children: [
			/* @__PURE__ */ c("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: St.map((e) => {
					let r = e.toLowerCase() === w;
					return /* @__PURE__ */ c("button", {
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
			/* @__PURE__ */ c("div", {
				className: "mt-3 mb-1 text-[11px] font-semibold uppercase tracking-wide",
				style: { color: f.title },
				children: a
			}),
			/* @__PURE__ */ l("div", {
				className: "grid gap-1",
				style: { gridTemplateColumns: "repeat(10, 1fr)" },
				children: [
					_.map((e) => /* @__PURE__ */ c("button", {
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
					/* @__PURE__ */ c("button", {
						onClick: S,
						title: a,
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: f.border,
							color: f.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = f.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ c(O, { size: 12 })
					}),
					typeof window < "u" && "EyeDropper" in window && /* @__PURE__ */ c("button", {
						onClick: C,
						title: "Pipette",
						className: "aspect-square flex items-center justify-center rounded-full border transition-colors",
						style: {
							borderColor: f.border,
							color: f.textDim
						},
						onMouseEnter: (e) => e.currentTarget.style.background = f.surface ?? "transparent",
						onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
						children: /* @__PURE__ */ c(D, { size: 11 })
					})
				]
			})
		]
	});
}
//#endregion
//#region ../../src/ui/AnchoredPopover.tsx
function wt({ anchorRef: e, open: t, onClose: i, children: u, gap: d = 4, align: f = "left" }) {
	let p = a(null), [m, h] = o(null), g = () => {
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
	return r(() => {
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
	}, [t]), t ? F(/* @__PURE__ */ l(s, { children: [/* @__PURE__ */ c("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onMouseDown: i
	}), /* @__PURE__ */ c("div", {
		ref: p,
		className: "fixed",
		style: {
			left: m?.left ?? 0,
			top: m?.top ?? 0,
			zIndex: 200,
			visibility: m ? "visible" : "hidden"
		},
		children: u
	})] }), document.body) : null;
}
//#endregion
//#region ../../src/ui/windowZStore.ts
var Tt = 1e3, Et = K((e, t) => ({
	counter: Tt,
	next: () => {
		let n = t().counter + 1;
		return e({ counter: n }), n;
	}
}));
//#endregion
//#region ../../src/ui/FloatingWindow.tsx
function Dt({ title: e, icon: r, children: i, titleActions: u, onClose: d, defaultWidth: f = 560, defaultHeight: p, minWidth: m = 280, minHeight: h = 120, resizable: g = !1, backdrop: _ = !1, className: v = "" }) {
	let y = a(null), [b, x] = o(() => Et.getState().next()), S = a(!1), C = a({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0
	}), w = a(!1), T = a(!1), E = a(""), D = a({
		mx: 0,
		my: 0,
		wx: 0,
		wy: 0,
		ww: 0,
		wh: 0
	}), O = t(() => {
		x(Et.getState().next());
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
	let ee = g ? /* @__PURE__ */ l(s, { children: [
		/* @__PURE__ */ c("div", {
			"data-edge": "n",
			onMouseDown: j,
			className: "absolute top-0    left-2  right-2  h-1   cursor-n-resize  z-10"
		}),
		/* @__PURE__ */ c("div", {
			"data-edge": "s",
			onMouseDown: j,
			className: "absolute bottom-0 left-2  right-2  h-1   cursor-s-resize  z-10"
		}),
		/* @__PURE__ */ c("div", {
			"data-edge": "w",
			onMouseDown: j,
			className: "absolute top-2   left-0  bottom-2  w-1   cursor-w-resize  z-10"
		}),
		/* @__PURE__ */ c("div", {
			"data-edge": "e",
			onMouseDown: j,
			className: "absolute top-2   right-0 bottom-2  w-1   cursor-e-resize  z-10"
		}),
		/* @__PURE__ */ c("div", {
			"data-edge": "nw",
			onMouseDown: j,
			className: "absolute top-0    left-0  w-3 h-3  cursor-nw-resize z-20"
		}),
		/* @__PURE__ */ c("div", {
			"data-edge": "ne",
			onMouseDown: j,
			className: "absolute top-0    right-0 w-3 h-3  cursor-ne-resize z-20"
		}),
		/* @__PURE__ */ c("div", {
			"data-edge": "sw",
			onMouseDown: j,
			className: "absolute bottom-0 left-0  w-3 h-3  cursor-sw-resize z-20"
		}),
		/* @__PURE__ */ c("div", {
			"data-edge": "se",
			onMouseDown: j,
			className: "absolute bottom-0 right-0 w-3 h-3  cursor-se-resize z-20"
		})
	] }) : null;
	return F(/* @__PURE__ */ l(s, { children: [_ && /* @__PURE__ */ c("div", {
		className: "fixed inset-0 bg-black/30 backdrop-blur-[1px]",
		style: { zIndex: b - 1 },
		onClick: d
	}), /* @__PURE__ */ l("div", {
		ref: y,
		role: "dialog",
		"aria-modal": _,
		className: `fixed bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)]
                    flex flex-col overflow-hidden ${v}`,
		style: {
			width: f,
			height: p,
			minWidth: m,
			minHeight: h,
			maxWidth: "calc(100vw - 16px)",
			maxHeight: "calc(100vh - 16px)",
			zIndex: b,
			left: "50%",
			top: "33%",
			transform: "translate(-50%, -33%)"
		},
		onMouseDown: O,
		children: [
			ee,
			/* @__PURE__ */ l("div", {
				className: "flex items-center gap-2.5 px-4 py-3 border-b border-border\n                     flex-shrink-0 cursor-move select-none",
				onMouseDown: A,
				children: [
					r && /* @__PURE__ */ c("div", {
						className: "flex-shrink-0 text-text-secondary",
						children: r
					}),
					/* @__PURE__ */ c("div", {
						className: "flex-1 min-w-0 text-sm font-medium text-text-primary truncate",
						children: e
					}),
					u && /* @__PURE__ */ c("div", {
						className: "flex items-center gap-1 flex-shrink-0",
						onMouseDown: (e) => e.stopPropagation(),
						children: u
					}),
					/* @__PURE__ */ c("button", {
						onClick: d,
						onMouseDown: (e) => e.stopPropagation(),
						title: "Fermer (Échap)",
						className: "flex-shrink-0 p-1.5 -mr-1 rounded-lg text-text-tertiary\n                       hover:text-text-primary hover:bg-surface-2 transition-colors",
						children: /* @__PURE__ */ c(M, { size: 15 })
					})
				]
			}),
			/* @__PURE__ */ c("div", {
				className: "flex-1 flex flex-col min-h-0 overflow-hidden",
				children: i
			})
		]
	})] }), document.body);
}
//#endregion
//#region ../../src/ui/ConfirmDialog.tsx
function Ot({ title: e, message: t, confirmLabel: r = "Confirmer", cancelLabel: i = "Annuler", variant: o = "default", hideCancel: s = !1, onConfirm: d, onCancel: f }) {
	let p = a(null);
	n(() => {
		p.current?.focus();
	}, []), n(() => {
		let e = (e) => {
			e.key === "Enter" && d();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [d]);
	let m = o === "danger" ? "bg-red-100" : o === "warning" ? "bg-amber-100" : "bg-gray-100", h = o === "danger" ? "text-red-600" : o === "warning" ? "text-amber-600" : "text-gray-600", g = o === "danger" ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white" : o === "warning" ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white";
	return /* @__PURE__ */ c(Dt, {
		title: e,
		onClose: f,
		defaultWidth: 380,
		backdrop: !0,
		children: /* @__PURE__ */ l("div", {
			className: "p-6 flex flex-col gap-4",
			children: [
				/* @__PURE__ */ c("div", {
					className: `w-12 h-12 rounded-full ${m} flex items-center justify-center flex-shrink-0`,
					children: c(o === "danger" ? A : u, { className: `w-6 h-6 ${h}` })
				}),
				/* @__PURE__ */ c("p", {
					className: "text-sm text-gray-500 leading-relaxed whitespace-pre-line",
					children: t
				}),
				/* @__PURE__ */ l("div", {
					className: "flex gap-3 mt-1",
					children: [!s && /* @__PURE__ */ c("button", {
						type: "button",
						onClick: f,
						className: "flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300\n                       rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors whitespace-nowrap",
						children: i
					}), /* @__PURE__ */ c("button", {
						ref: p,
						type: "button",
						onClick: d,
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
function kt({ type: e, name: t, onChoice: n }) {
	let r = e === "folder";
	return /* @__PURE__ */ c(Dt, {
		title: "Conflit de nom",
		onClose: () => n("cancel"),
		defaultWidth: 400,
		backdrop: !0,
		children: /* @__PURE__ */ l("div", {
			className: "p-6 flex flex-col gap-5",
			children: [
				/* @__PURE__ */ l("p", {
					className: "text-sm text-text-secondary leading-relaxed",
					children: [
						"Un ",
						r ? "dossier" : "fichier",
						" nommé",
						" ",
						/* @__PURE__ */ l("span", {
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
				/* @__PURE__ */ l("button", {
					type: "button",
					onClick: () => n("overwrite"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ c("div", {
						className: "w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ c(C, {
							size: 15,
							className: "text-danger"
						})
					}), /* @__PURE__ */ l("div", { children: [/* @__PURE__ */ c("p", {
						className: "text-sm font-medium text-text-primary",
						children: r ? "Fusionner" : "Écraser"
					}), /* @__PURE__ */ c("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: r ? "Les deux dossiers seront fusionnés. Les fichiers en conflit seront remplacés." : "Le fichier existant sera remplacé par le nouveau."
					})] })]
				}),
				/* @__PURE__ */ l("button", {
					type: "button",
					onClick: () => n("keep_both"),
					className: "flex items-start gap-3 p-3 rounded-xl border border-border\n                     hover:border-primary hover:bg-primary/5 transition-colors text-left group",
					children: [/* @__PURE__ */ c("div", {
						className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5",
						children: /* @__PURE__ */ c(y, {
							size: 15,
							className: "text-primary"
						})
					}), /* @__PURE__ */ l("div", { children: [/* @__PURE__ */ c("p", {
						className: "text-sm font-medium text-text-primary",
						children: "Conserver les deux"
					}), /* @__PURE__ */ l("p", {
						className: "text-xs text-text-tertiary mt-0.5",
						children: [
							"Le nouvel élément sera renommé automatiquement (ex.\xA0: «\xA0",
							t,
							" (2)\xA0»)."
						]
					})] })]
				}),
				/* @__PURE__ */ c("button", {
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
function At(e, t = 100) {
	let [n, r, i] = Y(e);
	return `rgba(${n}, ${r}, ${i}, ${Math.max(0, Math.min(100, t)) / 100})`;
}
function jt(e) {
	let t = [...e.stops].sort((e, t) => e.position - t.position).map((e) => `${At(e.color, e.opacity ?? 100)} ${Math.round(e.position * 100)}%`).join(", ");
	return e.type === "radial" ? `radial-gradient(circle, ${t})` : `linear-gradient(${Math.round(e.angle)}deg, ${t})`;
}
var Mt = {
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
}, Nt = {
	gradient_linear: "Linéaire",
	gradient_radial: "Radial",
	gradient_angle: "Angle",
	gradient_position: "Position",
	gradient_opacity: "Opacité",
	gradient_add_stop: "Ajouter un arrêt"
};
function Pt(e, t) {
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
	let i = n[r], a = n[r + 1], o = (t - i.position) / (a.position - i.position || 1), [s, c, l] = Y(i.color), [u, d, f] = Y(a.color);
	return {
		color: X(s + (u - s) * o, c + (d - c) * o, l + (f - l) * o),
		position: t,
		opacity: Math.round(i.opacity + (a.opacity - i.opacity) * o)
	};
}
function Ft({ t: e, value: t, onChange: r, onClose: i, C: s }) {
	let u = pt(), d = s ?? u, f = (t) => e ? e(t) : Nt[t] ?? t, p = t ?? Mt, [m, h] = o(0), g = a(null), _ = a(null), v = [...p.stops].map((e, t) => ({
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
		let t = Pt(p.stops, e), n = [...p.stops, t];
		r({
			...p,
			stops: n
		}), h(n.length - 1);
	}, w = (e) => {
		p.stops.length <= 2 || (b({ stops: p.stops.filter((t, n) => n !== e) }), h(0));
	}, T = jt(p);
	return /* @__PURE__ */ l("div", {
		className: "shadow-2xl p-3",
		style: {
			width: 260,
			background: d.toolbar,
			border: `1px solid ${d.border}`,
			borderRadius: 4
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ l("div", {
				className: "flex items-center justify-between mb-2",
				children: [/* @__PURE__ */ c("div", {
					className: "flex gap-1",
					children: ["linear", "radial"].map((e) => /* @__PURE__ */ c("button", {
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
				}), i && /* @__PURE__ */ c("button", {
					onClick: i,
					className: "text-[11px] px-1 rounded hover:bg-white/10",
					style: { color: d.textDim },
					children: "✕"
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "relative mb-3",
				style: { height: 22 },
				children: [/* @__PURE__ */ c("div", {
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
				}), v.map(({ s: e, i: t }) => /* @__PURE__ */ c("div", {
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
			p.type === "linear" && /* @__PURE__ */ l("label", {
				className: "flex items-center gap-2 mb-2",
				children: [
					/* @__PURE__ */ c("span", {
						className: "text-[9px] uppercase flex-shrink-0",
						style: {
							color: d.textDim,
							width: 48
						},
						children: f("gradient_angle")
					}),
					/* @__PURE__ */ c("input", {
						type: "range",
						min: 0,
						max: 360,
						className: "flex-1",
						value: p.angle,
						onChange: (e) => b({ angle: Number(e.target.value) })
					}),
					/* @__PURE__ */ c("input", {
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
			y && /* @__PURE__ */ l("div", {
				className: "flex flex-col gap-2 pt-2",
				style: { borderTop: `1px solid ${d.border}` },
				children: [/* @__PURE__ */ l("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ c(yt, {
							t: e,
							C: d,
							width: 32,
							height: 24,
							className: "flex-shrink-0",
							color: y.color,
							onChange: (e) => x(p.stops.indexOf(y), { color: e })
						}),
						/* @__PURE__ */ l("label", {
							className: "flex items-center gap-1 flex-1",
							children: [/* @__PURE__ */ c("span", {
								className: "text-[9px] uppercase",
								style: { color: d.textDim },
								children: f("gradient_position")
							}), /* @__PURE__ */ c("input", {
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
						p.stops.length > 2 && /* @__PURE__ */ c("button", {
							onClick: () => w(p.stops.indexOf(y)),
							title: "",
							style: { color: d.textDim },
							children: /* @__PURE__ */ c(A, { size: 13 })
						})
					]
				}), /* @__PURE__ */ l("label", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ c("span", {
							className: "text-[9px] uppercase flex-shrink-0",
							style: {
								color: d.textDim,
								width: 48
							},
							children: f("gradient_opacity")
						}),
						/* @__PURE__ */ c("input", {
							type: "range",
							min: 0,
							max: 100,
							className: "flex-1",
							value: y.opacity,
							onChange: (e) => x(p.stops.indexOf(y), { opacity: Number(e.target.value) })
						}),
						/* @__PURE__ */ c("input", {
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
			/* @__PURE__ */ l("button", {
				onClick: () => C(),
				className: "flex items-center gap-1 px-1.5 py-1 mt-2 text-[10px] rounded",
				style: {
					background: d.surface,
					color: d.textDim
				},
				children: [
					/* @__PURE__ */ c(O, { size: 11 }),
					" ",
					f("gradient_add_stop")
				]
			})
		]
	});
}
function It({ t: e, C: t, value: i, onChange: u, className: d, style: f, width: p = 32, height: m = 24 }) {
	let h = t ?? pt(), [g, _] = o(!1), v = a(null), y = a(null), [b, x] = o(null), S = () => {
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
	return r(() => {
		if (!g) {
			x(null);
			return;
		}
		S();
	}, [g]), n(() => {
		if (!g) return;
		let e = () => S();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [g]), /* @__PURE__ */ l(s, { children: [/* @__PURE__ */ c("button", {
		ref: v,
		type: "button",
		onClick: () => _((e) => !e),
		className: d,
		style: {
			width: p,
			height: m,
			backgroundImage: jt(i),
			backgroundColor: "#fff",
			border: `1px solid ${g ? h.accent : h.border}`,
			borderRadius: 4,
			cursor: "pointer",
			...f
		}
	}), g && F(/* @__PURE__ */ l(s, { children: [/* @__PURE__ */ c("div", {
		className: "fixed inset-0",
		style: { zIndex: 199 },
		onPointerDown: () => _(!1)
	}), /* @__PURE__ */ c("div", {
		ref: y,
		className: "fixed",
		style: {
			left: b?.left ?? 0,
			top: b?.top ?? 0,
			zIndex: 200,
			visibility: b ? "visible" : "hidden"
		},
		children: /* @__PURE__ */ c(Ft, {
			t: e,
			C: h,
			value: i,
			onChange: u,
			onClose: () => _(!1)
		})
	})] }), document.body)] });
}
//#endregion
export { wt as AnchoredPopover, Fe as Badge, de as Button, Te as Checkbox, yt as ColorField, vt as ColorPicker, Ct as ColorSwatchPicker, Ot as ConfirmDialog, kt as ConflictDialog, Mt as DEFAULT_GRADIENT, lt as DEFAULT_PICKER_THEME, Ye as DatePicker, _e as Dropdown, Ae as FloatCheckbox, Dt as FloatingWindow, It as GradientField, Ft as GradientPicker, pe as Input, it as KubunoLogo, ut as LIGHT_PICKER_THEME, ye as MenuDropdown, fe as NumberInput, ke as Radio, Ze as ResizeHandle, he as RichText, ze as Separator, Le as Spinner, Re as SpinnerOverlay, rt as StartPage, Xe as Tabs, me as Textarea, je as Toggle, ft as appPickerTheme, $ as cmykToRgb, jt as gradientToCss, ht as harmonyColors, Y as hexToRgb, Z as hslToRgb, Q as hsvToRgb, ct as rgbToCmyk, X as rgbToHex, at as rgbToHsl, st as rgbToHsv, At as rgbaFromHex, pt as useAppPickerTheme, xe as useMenuDropdown, Qe as useResizableWidth, Et as useWindowZStore };
