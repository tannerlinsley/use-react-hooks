# use-react-hooks

`use-react-hooks` adds support for hooks in React v16.6!

- ✂️ Tiny (3kb and 200 LOC)
- ⛑ Safely reverse-engineered using class lifecycles
- 🛠 Provides a clean and clear upgrade path to 16.7 when ready.

## Demos

- [Codesandbox Example](https://codesandbox.io/s/wor3rxopv8)
- [Intro Video](https://www.youtube.com/watch?v=aYOVH7VY0Jc)

## Install

```bash
npm install --save use-react-hooks
# or
yarn add use-react-hooks
```

## Usage

To use hooks in a functional compoennt, wrap it in `useHooks` then use any hook you want!

```jsx
import React from "react";
import { useHooks, useState } from "use-react-hooks";

const App = useHooks(props => {
  const [count, setCount] = useState(0);
  return (
    <div>
      Count: {count}
      <button onClick={() => setCount(old => old + 1)}>Increment</button>
    </div>
  );
});
```

## Documentation

The following hooks are available as named exports from the `use-react-hooks` package and follow the official React Hooks API here: https://reactjs.org/docs/hooks-reference.html

- `useReducer`
- `useState`
- `useContext`
- `useMemo`
- `useCallback`
- `useEffect`
- `useRef`
- `useImperativeMethods`
- `useMutationEffect` _Note: currently identical to `useEffect`_
- `useLayoutEffect` _Note: currently identical to `useEffect`_

## Additional Hooks

The following hooks are also provided for convenience:

- `usePrevious` - Returns the previously rendered value you pass it

## License

MIT © [tannerlinsley](https://github.com/tannerlinsley)
