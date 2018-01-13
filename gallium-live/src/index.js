// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Editor } from "./Editor";
import { Store, makeInitialState, Provider } from "./store";
import { type AppState } from "./state";
import { applyGlobalStyles } from "./styles";
import { RelayConnection } from "./relay_connection";

applyGlobalStyles();

const store = new Store(makeInitialState());
window.store = store;

ReactDOM.render(
  <Provider store={store}>
    <Editor />
  </Provider>,
  (document.getElementById("react-root"): any)
);

new RelayConnection({
  id: "gallium-textarea",
  destination: "ws://localhost:58121"
});
