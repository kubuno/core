// Facade ESM stable pour `react` (CJS) : ré-export explicite des exports nommés,
// car `export *` ne propage que `default` pour un module CommonJS.
import React from 'react'
export default React
export const {
  Activity, Children, Component, Fragment, Profiler, PureComponent, StrictMode, Suspense,
  act, cache, cacheSignal, captureOwnerStack, cloneElement, createContext, createElement,
  createRef, forwardRef, isValidElement, lazy, memo, startTransition, unstable_useCacheRefresh,
  use, useActionState, useCallback, useContext, useDebugValue, useDeferredValue, useEffect,
  useEffectEvent, useId, useImperativeHandle, useInsertionEffect, useLayoutEffect, useMemo,
  useOptimistic, useReducer, useRef, useState, useSyncExternalStore, useTransition, version,
} = React
