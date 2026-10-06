// Entrée de build UNIQUEMENT : matérialise le chunk stable `drive-shared.js` avec
// toute la surface `@kubuno/drive` (preserveEntrySignatures → exports préservés
// même si le host n'en utilise qu'une partie ; le bundle runtime drive en a besoin).
export * from './index'
