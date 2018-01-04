// @flow
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import "jest-enzyme";
import * as React from "react";

import * as MIDI from "./midi";
import { Provider, Store, makeInitialState } from "./store";

configure({ adapter: new Adapter() });

beforeAll(() => {
  const rootNode = document.createElement("div");
  rootNode.id = "react-root";
  (document.body: any).appendChild(rootNode);
});

let cleanupFns: Array<(void) => void> = [];
export function cleanupWith(fn: void => void) {
  cleanupFns.push(fn);
}
afterEach(() => {
  for (const cleanupFn of cleanupFns) {
    cleanupFn();
  }
  cleanupFns = [];
});

export function stubGlobalProperty(object: Object, path: string, value: any) {
  const oldValue = object[path];
  object[path] = value;
  cleanupWith(() => {
    object[path] = oldValue;
  });
}

export function modifyGlobalProperty(
  object: Object,
  path: string,
  modify: any => any
) {
  const oldValue = object[path];
  object[path] = modify(oldValue);
  cleanupWith(() => {
    object[path] = oldValue;
  });
}

export function mockPerformanceNow(n: number) {
  modifyGlobalProperty(performance, "now", realNow => () => n);
}

export function spyOn(object: any, path: string): void {
  modifyGlobalProperty(object, path, jest.fn);
}

export function spyOnAsync(object: any, path: string): void {
  modifyGlobalProperty(object, path, fn => {
    const wrappedFunction = async function() {
      const lastCall = fn.call(this);
      await lastCall;
      wrappedFunction.onFinish();
    };

    wrappedFunction.onFinish = () => {
      wrappedFunction.finished = true;
    };

    wrappedFunction.toFinish = () =>
      new Promise(async resolve => {
        if (wrappedFunction.finished) {
          resolve();
          return;
        }
        wrappedFunction.onFinish = () => {
          wrappedFunction.finished = true;
          resolve();
        };
      });
    return wrappedFunction;
  });
}

export function withAsyncSpy(object: any, path: string): void {
  beforeEach(() => {
    spyOnAsync(object, path);
  });
}

export function stubMIDIOutputDevices(devices: Array<MIDI.Device>) {
  stubGlobalProperty(navigator, "requestMIDIAccess", async () => ({
    outputs: {
      values: () => devices
    }
  }));
}

export function withMIDIOutputDevices(devices: Array<MIDI.Device>) {
  beforeEach(() => {
    stubMIDIOutputDevices(devices);
  });
}

type MountWithStoreOptions = {
  store?: Store
};

export function mountWithStore(
  element: React.Node,
  options: MountWithStoreOptions = {}
) {
  const store = options.store || new Store(makeInitialState());
  const wrapper = mount(<Provider store={store}>{element}</Provider>);
  return { wrapper, store };
}
