# EFX

An effectful state management system for React applications, designed for simplicity, testability and type-safety. Inspired by redux and reader monads.

**Table of Contents**

* [Installation](#installation)
* [Centralized State](#centralized-state)
* [Actions](#actions)
* [Connecting React Components to the Store](#connecting-react-components-to-the-store)
* [Testing](#testing)
* [Why not Redux?](#why-not-redux)


## Installation

```
yarn add efx
```

## Centralized State

To achieve full type coverage, EFX requires a single file of boilerplate, conventionally named `efx.js`. This file can be more or less copy-pasted with the following contents:


```js
// ./efx.js

// @flow
import * as EFX from "efx";

export type AppState = {
  foo: number
};

export const Store: Class<EFX.Store<AppState>> = EFX.Store;

export const Provider: Class<EFX.Provider<AppState>> = EFX.Provider;

export type Action<A, B> = A => Store => B;

export const makeAction: <A, B>(Action<A, B>) => Action<A, B> = EFX.makeAction;

type DefaultProps = {};

export type Connect<OP: {}, CP: {}> = EFX.Connect<OP, CP, AppState, DefaultProps>;

export function connect<CP: {}, OP: {}>(
  component: React.ComponentType<Connect<OP, CP>>,
  mapStateToProps: AppState => CP
): React.ComponentType<OP> {
  const defaultProps = {};
  return EFX.connect(component, mapStateToProps, defaultProps);
}
```

## Actions

An Action is an effectful function.

It is the single unit of abstraction in EFX; no reducers, no action creators, no constants.

### Synchronous actions:

To create an action that modifies some state:

```js
// ./AppActions.js

// @flow
import { type Action, makeAction } from "./efx";

export const addToFoo: Action<number, number> = makeAction(number => store => {
  store.state.foo += 1;
  return store.state.foo;
});
```

To dispatch an action, e.g. in the body of some other action:

```js
export const addTenToFooAndLog: Action<void, void> = makeAction(() => store => {
  const returnValue = store.dispatch(addToFoo(10));
  console.log("value of foo: " + returnValue);
});
```

### Asynchronous actions:

To create an **async** action that modifies some state:

```js
// ./AppActions.js

// @flow
import { type Action, makeAction } from "./efx";

export const addToFooAsync: Action<number, Promise<number>> = makeAction(number => async context => {

  await new Promise(resolve => setTimeout(resolve, 1000));

  context.state.foo += 1;
  return context.state.foo;
});
```

To dispatch an async action, e.g. in the body of some other async action:

```js
export const addTenToFooAndLogAsync: Action<void, Promise<void>> = makeAction(() => async store => {
  const returnValue = await store.dispatch(addToFoo(10));
  console.log("value of foo: " + returnValue);
});
```

##  Connecting React Components to the Store

The React component below does the following:

1. Renders text derived from the value of `store.state.foo`
2. On click of a button, modifies the value of `store.state.foo`

```js
// ./MyComponent.js

// @flow
import * as React from "react";
import { connect, type Connect } from "./efx";

type OwnProps = {};

type ContainerProps = {
  foo: number
};

const mapStateToProps = ({ foo }) => ({ foo });

class _MyComponent extends React.Component<Connect<OwnProps, ContainerProps>> {
  onClick = () => {
    this.props.dispatch(addToFoo(10));
  }
  render() {
    return (
      <button onClick={this.onClick}>foo: {this.props.foo} </button>
    );
  }
}

export const MyComponent = connect(_MyComponent, mapStateToProps);
```

Like react-redux, components need to be mounted within a Provider that injects a store.

```js
// ./index.js

// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, Store } from "./efx";
import { App } from "./App";

const store = new Store();
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```


## Testing

When testing React apps with Jest + Enzyme, often times we want to wait for some asynchronous computation to complete. Asynchronous actions are inspectable out of the box with a utility method called `.toFinish()`:


```js
// @flow
import * as AppActions from "./app_actions";
import { Store, Provider } from "./efx";
import { App } from "./app";
import { mount } from "enzyme";

test("displays title", () => {
  const { wrapper } = await mountApp();
  expect(wrapper.find('h1')).toBe("My App");
});

async function mountApp() {
  const store = new Store();
  const wrapper = mount(
    <Provider store={store}>
      <App />
    </Provider>
  );

  await AppActions.initialize.toFinish();

  return { wrapper, store };
}
```

```js
// ./AppActions.js
import { type Action, makeAction } from "./action";

export const initialize: Action<void, Promise<void>> = makeAction(() => async store => {

  // put some async computation here, i.e. fetching of data

});
```

## Why not Redux?

EFX started as a set of opinionated utility functions and classes built on top of redux + react-redux + redux-thunk for a simpler, more testable and more type-safe Redux stack.

Instead of publishing yet another set of opinionated design patterns and utility functions for Redux, we thought that there was enough noise in the ecosystem and that it would provide a better developer experience to put together an all-in-one solution. Therefore, we made the decision to start fresh, borrow the good parts of Redux and write a simpler yet more comprehensive state management solution.

In other words, EFX seeks to improve the developer experience for state management in the same way that [Jest](https://facebook.github.io/jest/) does for testing by packaging Mocha + Chai + Sinon into a single solution.

### Good parts of Redux:

- Centralized state
- Unidirectional data flow
- *With `redux-thunk`:* Compositionality: a way to `dispatch` actions within actions
- *With `react-redux`:* Simplicity: prop updating based on shallow equality

### Bad parts of Redux:

- Message bus/Reducers: forces you to bend over backwards to change state via messages passing with no return values.
- Too low level -> Too many abstractions -> Terminology overload (reducers, constants, actions, action creators, middleware, etc.)
- Out-of-the-box experience very lackluster: (type safety? testability? async actions?)
- Overwhelming ecosystem, maybe too extensible/flexible.
- Community flow-typings are abysmal
