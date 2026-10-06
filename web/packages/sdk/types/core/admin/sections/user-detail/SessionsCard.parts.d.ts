import type { SessionsCard } from './SessionsCard';
export declare function Part1({ t, sessions, columns, isLoading, isError, refetch, askRevoke }: {
    t: NonNullable<SessionsCard['tr']>;
    sessions: NonNullable<SessionsCard['sessions']>;
    columns: NonNullable<SessionsCard['columns']>;
    isLoading: NonNullable<SessionsCard['isLoading']>;
    isError: NonNullable<SessionsCard['isError']>;
    refetch: NonNullable<SessionsCard['refetch']>;
    askRevoke: SessionsCard['askRevoke'];
}): import("react").JSX.Element;
