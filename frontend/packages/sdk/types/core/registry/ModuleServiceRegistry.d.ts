type ServiceFn = (...args: any[]) => any;
interface ServiceMap {
    [key: string]: ServiceFn;
}
export declare const ModuleServiceRegistry: {
    publish(moduleId: string, api: ServiceMap): void;
    get<T extends ServiceFn>(moduleId: string, key: string): T | undefined;
    call<T = unknown>(moduleId: string, method: string, ...args: unknown[]): T | undefined;
};
export {};
