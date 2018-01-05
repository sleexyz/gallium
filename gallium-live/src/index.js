// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import Editor from "./Editor";
import { Store, makeInitialState, Provider } from "./store";
import { type AppState } from "./state";
import { applyGlobalStyles } from "./styles";

const root = document.getElementById("react-root");

if (root) {
  applyGlobalStyles();
  const store = new Store(makeInitialState());
  ReactDOM.render(
    <Provider store={store}>
      <Editor />
    </Provider>,
    root
  );
}
