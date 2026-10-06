import type { ComponentType, LazyExoticComponent } from 'react';
type AnyComponent = ComponentType<any> | LazyExoticComponent<any>;
interface RegistryRoute {
    path: string;
    Component: AnyComponent;
    props?: Record<string, unknown>;
}
export declare const RouteRegistry: {
    register(path: string, Component: AnyComponent, props?: Record<string, unknown>): void;
    registerPublic(path: string, Component: AnyComponent, props?: Record<string, unknown>): void;
    getShellRoutes(): readonly RegistryRoute[];
    getPublicRoutes(): readonly RegistryRoute[];
};
export {};
