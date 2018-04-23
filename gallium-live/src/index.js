// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Editor } from "./Editor";
import { Store, makeInitialState, Provider } from "./efx";
import { applyGlobalStyles } from "./styles";

applyGlobalStyles();

const store = new Store(makeInitialState());
window.store = store;

ReactDOM.render(
  <Provider store={store}>
    <Editor />
  </Provider>,
  (document.getElementById("react-root"): any)
);
