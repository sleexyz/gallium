// @flow
import WebSocket from "ws";
import dgram from "dgram";
import OSC from "osc-js";
import * as TestUtils from "./test_utils";
import child_process from "child_process";

export async function connectToWebsocket(destination: string) {
  const ws = new WebSocket(destination);
  const messageQueue = [];
  let _resolve;
  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
    ws.on("message", (data) => {
      messageQueue.push(data);
      if (resolve) {
        resolve();
      }
    });
  });
  function getMessage() {
    return new Promise(resolve => {
      if (messageQueue.length > 0) {
        const nextItem = messageQueue.pop();
        resolve(nextItem);
      } else {
        _resolve = resolve;
      }
    });
  }
  return {
    ws,
    getMessage
  };
}

export async function runRelay() {
  const p = child_process.spawn("node", ["src/index.js"]);

  let resolveInitialization = () => {
    throw new Error("resolveInitialization not bound yet");
  };

  p.stdout.on("data", data => {
    if (data.toString() === "Gallium Relay started.\n") {
      resolveInitialization();
    }
  });

  await new Promise(resolve => {
    resolveInitialization = resolve;
  });

  TestUtils.cleanupWith(() => {
    p.kill();
  });
}
