import { type ReactNode } from 'react';
import type { TFunction } from 'i18next';
export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';
export interface ToastOptions {
    message: ReactNode;
    title?: ReactNode;
    variant?: ToastVariant;
    /** Lifetime in ms. `0` keeps it until dismissed — use it for failures the
     *  user must acknowledge. Defaults to 4000 (6000 for `danger`). */
    duration?: number;
    /** One inline action: "Undo", "See details", "Retry". */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Reuse an id to REPLACE a toast instead of stacking a duplicate (e.g. a
     *  save indicator fired on every keystroke). */
    id?: string;
}
export interface ToastApi {
    toast: (opts: ToastOptions) => string;
    info: (message: ReactNode, opts?: Omit<ToastOptions, 'message' | 'variant'>) => string;
    success: (message: ReactNode, opts?: Omit<ToastOptions, 'message' | 'variant'>) => string;
    warning: (message: ReactNode, opts?: Omit<ToastOptions, 'message' | 'variant'>) => string;
    error: (message: ReactNode, opts?: Omit<ToastOptions, 'message' | 'variant'>) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
}
export interface ToastProviderProps {
    children: ReactNode;
    /** Maximum number of stacked toasts; the oldest is dropped past it. */
    max?: number;
    /** Desktop anchor. Mobile always docks to the bottom edge, full width. */
    placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center';
    t?: TFunction;
}
/**
 * ToastProvider — the transient-notification host.
 *
 * It replaces the eight copies of "set a flag, `setTimeout` it away, flip a
 * button label" scattered across the admin and settings panels, each with its
 * own delay (1500/1600/1800/2000/2200/2500 ms) and none of them announced to
 * assistive tech.
 *
 * Two live regions, not one: `polite` for info/success (they must not cut into
 * what the screen reader is currently saying) and `assertive` for
 * warning/danger. Placing them in separate containers is what lets a failure
 * jump the queue while a "Saved" stays polite.
 *
 * Timers pause while the pointer is over the stack or the focus is inside it —
 * otherwise a toast carrying an "Undo" can expire under the cursor on its way
 * to the button.
 *
 * Mount it once, high in the tree. It portals through `usePortalHost()`, so
 * inside a bounded stage (the admin theme preview) the toasts stay in the box.
 */
export declare function ToastProvider({ children, max, placement, t }: ToastProviderProps): import("react").JSX.Element;
/**
 * Access the toast API. Outside a `<ToastProvider>` it returns a no-op API and
 * warns in dev rather than throwing: a missing provider must never take down a
 * module that only wanted to say "Saved".
 */
export declare function useToast(): ToastApi;
