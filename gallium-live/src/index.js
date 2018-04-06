// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Editor } from "./Editor";
import { Store, makeInitialState, Provider } from "./efx";
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

if (window.location.pathname === "/control") {
  new RelayConnection({
    id: "gallium-textarea",
    destination: `ws://${window.location.hostname}:58121`,
    mode: "control"
  });
} else if (window.location.pathname === "/listen") {
  new RelayConnection({
    id: "gallium-textarea",
    destination: `ws://${window.location.hostname}:58121`,
    mode: "listen"
  });
}
