import { type ReactNode } from 'react';
import type { TFunction } from 'i18next';
export type CalloutVariant = 'info' | 'success' | 'warning' | 'danger';
export interface CalloutProps {
    variant?: CalloutVariant;
    title?: ReactNode;
    children?: ReactNode;
    /** Single inline action — "Retry", "Configure", "See the log"… */
    action?: {
        label: string;
        onClick: () => void;
        icon?: ReactNode;
    };
    /** Adds a close button. Pair it with `onDismiss` to be told about it. */
    dismissible?: boolean;
    onDismiss?: () => void;
    /** Replaces the variant's default glyph. Pass `null` to drop the icon. */
    icon?: ReactNode | null;
    className?: string;
    t?: TFunction;
}
export declare function Callout({ variant, title, children, action, dismissible, onDismiss, icon, className, t, }: CalloutProps): import("react").JSX.Element | null;
