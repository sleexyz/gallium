// @flow
require("babel-register");
const Relay = require("./relay");
Relay.main({ websocketPort: 58121, oscPort: 57110 });
