import { type StoreApi } from 'zustand';
interface WsMessage {
    type: string;
    module?: string;
    payload: unknown;
}
interface WsState {
    connected: boolean;
    messages: WsMessage[];
    connect: (token: string) => void;
    disconnect: () => void;
}
export declare const useWsStore: import("zustand").UseBoundStore<StoreApi<WsState>>;
export {};
