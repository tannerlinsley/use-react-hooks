# Changelog

## 1.0.4

- Allow useState setters to replace state values if a non-function is passed

## 1.0.3

- Always use bracket/property notation to avoid stale instance variables

## 1.0.2

- Removed a stray console.log()

## 1.0.1

- Fixed a bug that prevented react-hot-loader from working correctly (I guess it also overrides class lifecycle events, so there was a clash)

## 1.0.0

- Renamed project to `use-react-hooks`
- An HOC and functions are now used instead of a class
- Added `useImperativeMethods` and proxies for `useMutationEffect => useEffect` and `useLayoutEffect => useEffect`
- Custom hooks are now supported out of the box

## 0.2.4

- Actually add `this.useHook` to the source ;)

## 0.2.3

- Also patch `React.PureComponent`

## 0.2.2

- Warn if not running version 16.6 when using `this.useContext()`

## 0.2.1

- Require at least version 16.6 of React

## 0.2.0

- Added `this.useRef` hook!

## 0.1.0

Initial Commit. Yay!
