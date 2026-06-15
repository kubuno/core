export declare const ExtensionRegistry: {
    /** Enregistre (ou remplace) la contribution d'un module à un point d'extension. */
    register(point: string, moduleId: string, entry: unknown): void;
    /** Retire la contribution d'un module. */
    unregister(point: string, moduleId: string): void;
    /** Toutes les contributions enregistrées pour un point (ordre d'insertion). */
    getAll<T = unknown>(point: string): T[];
};
