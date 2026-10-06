// A module's entry: its routes, and what it gives the host's slots.
import { lazy } from 'react'
import { RouteRegistry, SlotRegistry } from './host'
import SidePanel from './SidePanel'

const SettingsPage = lazy(() => import('./SettingsPage'))
RouteRegistry.register('x/settings', SettingsPage)
SlotRegistry.register('sidebar', 'x', SidePanel)
export const navItems = [{ path: '/x', Icon: SidePanel }]
