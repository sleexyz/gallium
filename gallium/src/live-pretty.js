#!/usr/bin/env node
require("babel-register");
const { print } = require("./printer");
const { pretty } = require("./pretty");
const { parse } = require("./parser");

const inputChunks = [];
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => {
  inputChunks.push(chunk);
});
process.stdin.on("end", chunk => {
  const joined = inputChunks.join();
  // process.stdout.write(JSON.stringify(parse(joined), null, 2));
  process.stdout.write(print(pretty(parse(joined))));
});
