// @flow

export function delay(callback) {
  let lastCallTime;
  let lastValue;
  let timeout;
  return x => {
    lastValue = x;
    const now = new Date()

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      lastCallTime = now;
      callback(lastValue);
    }, 100);
  };
}
