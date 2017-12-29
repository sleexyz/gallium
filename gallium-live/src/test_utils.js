import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import "jest-enzyme";

configure({ adapter: new Adapter() });

beforeAll(() => {
  const rootNode = document.createElement("div");
  rootNode.id = "react-root";
  document.body.appendChild(rootNode);
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

export function stubMIDIOutputDevices(devices: Array<any>) {
  stubGlobalProperty(navigator, "requestMIDIAccess", async () => ({
    outputs: {
      values: () => devices
    }
  }));
}
