import { createContext, useContext } from 'react'
import type { WidgetSize } from './WidgetRegistry'

export const WidgetSizeContext = createContext<WidgetSize>('small')
export const useWidgetSize = () => useContext(WidgetSizeContext)
