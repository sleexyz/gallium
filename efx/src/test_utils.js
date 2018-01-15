// @flow
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import "jest-enzyme";

configure({ adapter: new Adapter() });

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

export function spyOn(object: any, path: string): void {
  modifyGlobalProperty(object, path, jest.fn);
}
