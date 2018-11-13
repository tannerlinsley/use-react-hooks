import React from 'react'

let currentFiber

// Utils
const leaseHook = () => {
  if (!currentFiber) {
    throw new Error('You are trying to use hooks without the `useHooks()` HOC!')
  }
  const hooks = currentFiber.hooks
  const index = currentFiber.hookIndex
  currentFiber.hookIndex++
  return [hooks, index, currentFiber]
}

export function useHooks(fn) {
  class HookComponent extends React.Component {
    static displayName = fn.displayName || fn.name

    hooks = [] // A home for our hooks

    // These are here to ensure effects work properly
    componentDidMount() {
      this.hooks.forEach(hook => {
        if (hook.didMount) {
          hook.didMount()
        }
      })
    }
    componentDidUpdate() {
      this.hooks.forEach(hook => {
        if (hook.didUpdate) {
          hook.didUpdate()
        }
      })
    }
    componentWillUnmount() {
      this.hooks.forEach(hook => {
        if (hook.willUnmount) {
          hook.willUnmount()
        }
      })
      this.hooks = undefined
    }

    render() {
      const { innerRef, ...rest } = this.props
      // Every render, we need to update the
      // currentFiber to the class's instance
      // and reset the instance's hookIndex
      currentFiber = this
      this.hookIndex = 0
      const res = fn(rest, innerRef)
      currentFiber = null
      return res
    }
  }
  function HookWrapper(props, ref) {
    return <HookComponent {...props} innerRef={ref} />
  }
  Object.keys(fn).forEach(key => {
    HookWrapper[key] = fn[key]
  })
  return HookWrapper
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
    hooks[hookID] = {
      state: initialState,
      dispatch: action => {
        hooks[hookID].state = reducer(hooks[hookID].state, action)
        instance.forceUpdate()
      }
    }
  }
  return [hooks[hookID].state, hooks[hookID].dispatch]
}

export function useState(initialState) {
  return useReducer(
    (state, action) => (typeof action === 'function' ? action(state) : action),
    initialState
  )
}

export function useContext(context) {
  const [hooks, hookID, instance] = leaseHook()
  if (!hooks[hookID]) {
    hooks[hookID] = context
    const originalRender = instance.render.bind(instance)
    instance.render = () => (
      <context.Consumer>{originalRender}</context.Consumer>
    )
  }
  return context._currentValue
}

export function usePrevious(value, watchItems) {
  const [hooks, hookID] = leaseHook()
  if (!hooks[hookID]) {
    hooks[hookID] = {}
  }
  useEffect(() => {
    hooks[hookID].previous = value
  }, watchItems)
  return hooks[hookID].previous
}

export function useMemo(memo, watchItems) {
  const [hooks, hookID] = leaseHook()
  if (!hooks[hookID]) {
    hooks[hookID] = {
      watchItems: null,
      computed: null
    }
  }
  let needsUpdate = hasChanged(hooks[hookID].watchItems, watchItems)
  if (needsUpdate) {
    hooks[hookID].watchItems = watchItems
    hooks[hookID].computed = memo()
  }
  return hooks[hookID].computed
}

export function useCallback(callback, watchItems) {
  return useMemo(() => callback, watchItems)
}

export function useEffect(effect, watchItems) {
  const [hooks, hookID] = leaseHook()
  if (!hooks[hookID]) {
    hooks[hookID] = {
      changed: false,
      watchItems: null,
      unwinder: null,
      effect: null,
      didMount: () => {
        hooks[hookID].unwind = hooks[hookID].effect()
      },
      didUpdate: () => {
        if (hooks[hookID].changed) {
          if (hooks[hookID].unwind) {
            hooks[hookID].unwind()
          }
          hooks[hookID].unwind = hooks[hookID].effect()
        }
      },
      willUnmount: () => {
        if (hooks[hookID].unwind) {
          hooks[hookID].unwind()
        }
      }
    }
  }

  hooks[hookID].effect = effect
  hooks[hookID].changed = false

  let changed = hasChanged(hooks[hookID].watchItems, watchItems)
  if (changed) {
    hooks[hookID].changed = true
    hooks[hookID].watchItems = watchItems
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
