// @flow
import { type Action, makeAction } from "./store";
import * as LocalStorage from "./local_storage";

const updateAvailableOutputs: Action<
  void,
  Promise<void>
> = () => async store => {
  if (!navigator.requestMIDIAccess) {
    throw new Error("Your browser does not seem to support WebMIDI");
  }
  const access = await navigator.requestMIDIAccess();
  store.state.outputs = {};
  for (const output of access.outputs.values()) {
    store.state.outputs[output.name] = output;
  }
};

export const usePreviousPort: Action<void, boolean> = () => store => {
  const lastPortName = LocalStorage.loadOutputPortName();
  if (!lastPortName) {
    return false;
  }

  for (const portName in store.state.outputs) {
    const output = store.state.outputs[portName];
    if (portName === lastPortName) {
      store.state.output = output;
      return true;
    }
  }
  return false;
};

export const useFirstPort: Action<void, boolean> = () => store => {
  const portNames = Object.keys(store.state.outputs);
  if (portNames.length < 1) {
    return false;
  }
  const portName = portNames[0];
  const output = store.state.outputs[portName];
  store.state.output = output;
  LocalStorage.saveOutputPortName(portName);
  return true;
};

export const selectInitialPort: Action<void, Promise<void>> = makeAction(
  () => async store => {
    await store.dispatch(updateAvailableOutputs());
    store.dispatch(usePreviousPort()) || store.dispatch(useFirstPort());
  }
);

export const changePort: Action<string, void> = makeAction(
  (portName: string) => store => {
    store.state.output = store.state.outputs[portName];
    LocalStorage.saveOutputPortName(portName);
  }
);
