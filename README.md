# use-class-hooks

Use react hooks in classes in React v16.5+

⚠️ WARNING: This is an experiment. Do not ship production code with this module!

## Demos

- [Codesandbox Example](https://codesandbox.io/s/wor3rxopv8)
- [Intro Video](https://www.youtube.com/watch?v=aYOVH7VY0Jc)

## Install

```bash
npm install --save use-class-hooks
# or
yarn add use-class-hooks
```

## Usage

```jsx
import React from "react";
import "use-class-hooks";

class Example extends Component {
  render() {
    const [count, setCount] = this.useState(0);
    return (
      <div>
        Count: {count}
        <button onClick={() => setCount(old => old + 1)}>Increment</button>
      </div>
    );
  }
}
```

## Documentation

The following hooks are available on the class instance and follow the official React Hooks API here: https://reactjs.org/docs/hooks-reference.html

- `this.useReducer`
- `this.useState`
- `this.useContext`
- `this.usePrevious`
- `this.useMemo`
- `this.useCallback`
- `this.useEffect`
- `this.useRef`

The following hooks are not yet available. Feel free to submit a PR!

- `this.useImperativeMethods`
- `this.useMutationEffect`
- `this.useLayoutEffect`

## Custom Hooks

You can use a custom hook via the `this.useHook` hook:

```javascript
// Custom Hook
function useTodos(a, b, c) {
  const [todos, setTodos] = this.useState([]);
  return [
    todos,
    {
      addTodo: todo => setTodos(old => [...old, todo])
    }
  ];
}

// Usage
class MyComponent extends React.Component {
  render() {
    const [todos, { addTodo }] = this.useHook(useTodos, a, b, c);
  }
}
```

Custom Hooks function are executed with the `this` context of the class instance, so you have access to all of the built in react hooks. Also, any parameters passed after the hook function are forwarded to your custom hook.

## License

MIT © [tannerlinsley](https://github.com/tannerlinsley)
