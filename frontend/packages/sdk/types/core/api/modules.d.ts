import type { ActiveModule } from '../types';
export declare const modulesApi: {
    list: () => Promise<import("axios").AxiosResponse<{
        modules: ActiveModule[];
    }, any, {}>>;
    publicConfig: () => Promise<import("axios").AxiosResponse<{
        config: Record<string, unknown>;
    }, any, {}>>;
};
