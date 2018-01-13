// @flow
import * as React from "react";
import * as PropTypes from "prop-types";

export class Store<S: {}> {
  +state: S;
  subscriptions: Array<?(S) => void> = [];
  constructor(initialState: S) {
    this.state = new Proxy(initialState, {
      set: (target, property, value) => {
        target[property] = value;
        if (!this.subscriptions) {
          return true;
        }
        for (const onChange of this.subscriptions) {
          if (onChange) {
            onChange(this.state);
          }
        }
        return true;
      }
    });
  }

  subscribe(onChange: S => void): number {
    const id = this.subscriptions.length;
    this.subscriptions.push(onChange);
    return id;
  }

  unsubscribe(subscriptionId: number): void {
    delete this.subscriptions[subscriptionId];
  }

  dispatch: <B>((Store<S>) => B) => B = <B>(fn: (Store<S>) => B): B => {
    return fn(this);
  };
}

export function connect<OP: {}, CP: {}, S: {}, DP: {}>(
  component: React.ComponentType<Connect<OP, CP, S, DP>>,
  mapStateToProps: S => CP,
  defaultProps: DP
): React.ComponentType<OP> {
  return class extends React.Component<OP, CP> {
    update: boolean = false;
    subscriptionId: number;
    store: Store<S>;
    static contextTypes = {
      store: PropTypes.object
    };
    constructor(props, context) {
      super(props, context);
      if (!context.store) {
        throw new Error(
          "You must mount EFX-connected components with a Provider"
        );
      }
      this.store = context.store;
      this.state = mapStateToProps(this.store.state);
      this.subscriptionId = this.store.subscribe(state => {
        this.setState(mapStateToProps(state));
      });
    }
    componentWillReceiveProps() {
      this.update = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
      if (this.update) {
        this.update = false;
        return true;
      }
      for (const key of Object.keys(nextState)) {
        if (nextState[key] !== this.state[key]) {
          return true;
        }
      }
      return false;
    }
    componentWillUnmount() {
      this.store.unsubscribe(this.subscriptionId);
    }
    render() {
      return React.createElement(component, {
        dispatch: this.store.dispatch,
        ...defaultProps,
        ...this.state,
        ...this.props
      });
    }
  };
}

export type Connect<OP: {}, CP: {}, S: {}, DP: {}> = {
  dispatch: <T>((Store<S>) => T) => T,
  ...$Exact<DP>,
  ...$Exact<CP>,
  ...$Exact<OP>
};

type ProviderProps<S> = {
  store: Store<S>,
  children: React.Node
};

export class Provider<S> extends React.Component<ProviderProps<S>> {
  static childContextTypes = {
    store: PropTypes.object
  };
  getChildContext() {
    return {
      store: this.props.store
    };
  }
  render() {
    return this.props.children;
  }
}

export function makeAction<Store, A, B>(
  rawAction: A => Store => B
): A => Store => B {
  if (!process.env.NODE_ENV === "test") {
    return rawAction;
  }

  let toHaveBeenCalledResolver: void => void;
  let toHaveBeenCalledPromise = new Promise(resolve => {
    toHaveBeenCalledResolver = resolve;
  });

  const action = arg => {
    return store => {
      const returnValue = rawAction(arg)(store);
      toHaveBeenCalledResolver();

      if (returnValue instanceof Promise) {
        // We reassign the method to return the promise result of the last invocation.
        action.toFinish = async () => {
          try {
            await returnValue;
          } catch (e) {}
        };
      }
      return returnValue;
    };
  };

  action.toFinish = async () => {
    await toHaveBeenCalledPromise;
    // The following is not a recursive call. The method gets reassigned on invocation of the action.
    await action.toFinish();
  };

  return action;
}
