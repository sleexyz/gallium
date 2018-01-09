// @flow

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
