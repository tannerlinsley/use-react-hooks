import React from 'react'

let currentFiber

// Utils
const leaseHook = () => {
  if (!currentFiber) {
    throw new Error('You are trying to use hooks without the `useHooks()` HOC!')
  }
  const hooks = currentFiber.__hooks
  const index = currentFiber.__hookIndex
  currentFiber.__hookIndex++
  return [hooks, index, currentFiber]
}

export function useHooks(fn) {
  return class HookComponent extends React.Component {
    __hooks = {} // A home for our hooks

    // These are here to ensure effects work properly
    componentDidMount() {}
    componentDidUpdate() {}
    componentWillUnmount() {}

    render() {
      // Every render, we need to update the
      // currentFiber to the class's instance
      // and reset the instance's hookIndex
      currentFiber = this
      this.__hookIndex = 0
      const res = fn(this.props)
      currentFiber = null
      return res
    }
  }
}

export function useRef(initialValue) {
  const [hooks, hookID] = leaseHook()
  if (!hooks[hookID]) {
    hooks[hookID] = {
      current: initialValue
    }
  }
  return hooks[hookID]
}

export function useReducer(reducer, initialState) {
  const [hooks, hookID, instance] = leaseHook()
  if (!hooks[hookID]) {
    hooks[hookID] = initialState
  }
  const state = hooks[hookID]
  const dispatch = action => {
    const newState = reducer(state, action)
    if (state !== newState) {
      hooks[hookID] = newState
      instance.forceUpdate() // TODO: IS this too naive?
    }
  }
  return [state, dispatch]
}

export function useState(initialState) {
  return useReducer((state, action) => action(state), initialState)
}

export function useContext(context) {
  const dispatcher = getDispatcher()
  if (!dispatcher) {
    throw new Error(
      'Oh no! You are either trying to use this.useContext() outside of a classes render function, or you may not be running React 16.6 or higher.'
    )
  }
  return getDispatcher().readContext(context)
}

export function usePrevious(value, watchItems) {
  const [hooks, hookID] = leaseHook()
  useEffect(() => {
    hooks[hookID] = value
  }, watchItems)
  return hooks[hookID]
}

export function useMemo(memo, watchItems) {
  const [hooks, hookID] = leaseHook()
  if (!hooks[hookID]) {
    hooks[hookID] = {
      watchItems: null,
      computed: null
    }
  }
  const record = hooks[hookID]
  let needsUpdate = hasChanged(record.watchItems, watchItems)
  if (needsUpdate) {
    record.watchItems = watchItems
    record.computed = memo()
  }
  return record.computed
}

export function useCallback(callback, watchItems) {
  return useMemo(() => callback, watchItems)
}

export function useEffect(effect, watchItems) {
  const [hooks, hookID, instance] = leaseHook()
  let record
  if (hooks[hookID]) {
    record = hooks[hookID]
  } else {
    hooks[hookID] = {
      watchItems: null,
      unwind: null,
      runEffect: () => {}
    }
    record = hooks[hookID]

    const originalComponentDidMount = instance.componentDidMount
    instance.componentDidMount = (...args) => {
      originalComponentDidMount.call(this, ...args)
      record.runEffect()
    }

    const originalComponentDidUpdate = instance.componentDidUpdate
    instance.componentDidUpdate = (...args) => {
      record.doUnwind()
      originalComponentDidUpdate.call(this, ...args)
      record.runEffect()
    }

    const originalComponentWillUnmount = instance.componentWillUnmount
    instance.componentWillUnmount = (...args) => {
      record.doUnwind()
      originalComponentWillUnmount.call(this, ...args)
    }
  }

  record.runEffect = () => {
    if (record.shouldRunEffect) {
      record.unwind = effect()
    }
  }

  record.doUnwind = () => {
    if (record.shouldRunEffect && record.unwind) {
      record.unwind()
    }
  }

  record.shouldRunEffect = false

  let needsUpdate = hasChanged(record.watchItems, watchItems)
  if (needsUpdate) {
    record.shouldRunEffect = true
    record.watchItems = watchItems
  }
}

export function useImperativeMethods(ref, createFn, watchItems) {
  watchItems = watchItems ? watchItems.concat([ref]) : [ref, createFn]

  useEffect(() => {
    if (typeof ref === 'function') {
      const methodsInstance = createFn()
      ref(methodsInstance)
      return () => ref(null)
    } else if (ref !== null && ref !== undefined) {
      const methodsInstance = createFn()
      ref.current = methodsInstance
      return () => {
        ref.current = null
      }
    }
  }, watchItems)
}

export const useMutationEffect = useEffect
export const useLayoutEffect = useEffect

// Utils

function hasChanged(prev, next) {
  let needsUpdate = !prev
  if (!needsUpdate && prev.length !== next.length) {
    needsUpdate = true
  } else if (
    !needsUpdate &&
    prev.some((item, index) => {
      return item !== next[index]
    })
  ) {
    needsUpdate = true
  }
  return needsUpdate
}

function getDispatcher() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    .ReactCurrentOwner.currentDispatcher
}
