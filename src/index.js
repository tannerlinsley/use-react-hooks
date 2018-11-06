import React from 'react'

// Only patch react once
if (!React.Component.__hookPatched) {
  patch('Component')
  patch('PureComponent')
}

function patch(name) {
  // Patch React.Component
  React[name] = class Component extends React[name] {
    constructor(props) {
      super(props)
      // Every render, we need to reset the instance's
      // hookIndex
      const originalRender = this.render
      this.render = (...args) => {
        this.__hookIndex = 0
        return originalRender.call(this, ...args)
      }
    }

    static __hookPatched = true

    __hooks = {} // A home for our hooks

    // These are here to ensure effects work properly
    componentDidMount() {}
    componentDidUpdate() {}
    componentWillUnmount() {}

    useRef = initialValue => {
      const hookID = this.leaseHookID()
      if (!this.__hooks[hookID]) {
        this.__hooks[hookID] = {
          current: initialValue
        }
      }
      return this.__hooks[hookID]
    }

    useReducer = (reducer, initialState) => {
      const hookID = this.leaseHookID()
      if (!this.__hooks[hookID]) {
        this.__hooks[hookID] = initialState
      }
      const state = this.__hooks[hookID]
      const dispatch = action => {
        const newState = reducer(state, action)
        if (state !== newState) {
          this.__hooks[hookID] = newState
          this.forceUpdate() // TODO: IS this too naive?
        }
      }
      return [state, dispatch]
    }

    useState = initialState => {
      return this.useReducer((state, action) => action(state), initialState)
    }

    useContext = context => {
      const dispatcher = getDispatcher()
      if (!dispatcher) {
        throw new Error(
          'Oh no! You are either trying to use this.useContext() outside of a classes render function, or you may not be running React 16.6 or higher.'
        )
      }
      return getDispatcher().readContext(context)
    }

    usePrevious = (value, watchItems) => {
      const hookID = this.leaseHookID()
      this.useEffect(() => {
        this.__hooks[hookID] = value
      }, watchItems)
      return this.__hooks[hookID]
    }

    useMemo = (memo, watchItems) => {
      const hookID = this.leaseHookID()
      if (!this.__hooks[hookID]) {
        this.__hooks[hookID] = {
          watchItems: null,
          computed: null
        }
      }
      const record = this.__hooks[hookID]
      let needsUpdate = hasChanged(record.watchItems, watchItems)
      if (needsUpdate) {
        record.watchItems = watchItems
        record.computed = memo()
      }
      return record.computed
    }

    useCallback = (callback, watchItems) => {
      return this.useMemo(() => callback, watchItems)
    }

    useEffect = (effect, watchItems) => {
      const hookID = this.leaseHookID()
      let record
      if (this.__hooks[hookID]) {
        record = this.__hooks[hookID]
      } else {
        this.__hooks[hookID] = {
          watchItems: null,
          unwind: null,
          runEffect: () => {}
        }
        record = this.__hooks[hookID]

        const originalComponentDidMount = this.componentDidMount
        this.componentDidMount = (...args) => {
          originalComponentDidMount.call(this, ...args)
          record.runEffect()
        }

        const originalComponentDidUpdate = this.componentDidUpdate
        this.componentDidUpdate = (...args) => {
          record.doUnwind()
          originalComponentDidUpdate.call(this, ...args)
          record.runEffect()
        }

        const originalComponentWillUnmount = this.componentWillUnmount
        this.componentWillUnmount = (...args) => {
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
    // Utils
    leaseHookID = () => {
      const index = this.__hookIndex
      this.__hookIndex++
      return index
    }
  }
}

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
