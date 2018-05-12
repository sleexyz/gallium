// @flow

export function throttle<A>(callback: A => void): A => void {
  let lastCallTime;
  let lastValue;
  let timeout;
  return x => {
    lastValue = x;
    const now = new Date();

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      lastCallTime = now;
      callback(lastValue);
    }, 100);
  };
}
