// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";
import { Store, makeInitialState, Provider } from "./efx";
import { applyGlobalStyles } from "./styles";

applyGlobalStyles();

const store = new Store(makeInitialState());
window.store = store;

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  (document.getElementById("react-root"): any)
);
