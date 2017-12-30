// @flow
import nowPolyfill from "performance-now";
global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

window.localStorage = (function() {
  let store = {};

  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    }
  };
})();

window.performance = {
  now: nowPolyfill
};
