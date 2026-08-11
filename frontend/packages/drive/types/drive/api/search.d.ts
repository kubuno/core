import type { FilesSearchFilters } from '../store';
import type { SearchHit } from './types';
/** Full-text/semantic search and perceptual image lookup. */
export declare const searchApi: {
    searchFiles: (q: string, filters: FilesSearchFilters, opts?: {
        limit?: number;
        offset?: number;
    }) => Promise<{
        results: SearchHit[];
        total: number;
        semantic: boolean;
    }>;
    searchSimilar: (image: File) => Promise<{
        results: SearchHit[];
        total: number;
        semantic: boolean;
    }>;
};
