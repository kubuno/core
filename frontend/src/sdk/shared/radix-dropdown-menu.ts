// Facade ESM stable pour `@radix-ui/react-dropdown-menu`.
// PARTAGÉE en singleton entre le host et tous les modules runtime : le contexte
// React interne de Radix (Root ↔ Item) ne traverse PAS les frontières de bundle.
// Le bouton « Nouveau » du shell core (DropdownMenu.Root côté host) reçoit ses
// entrées via le slot `sidebar-new-actions`, rendues par les modules
// (DropdownMenu.Item côté module) → il FAUT la même instance Radix, sinon
// « `MenuItem` must be used within `Menu` ».
export * from '@radix-ui/react-dropdown-menu'
