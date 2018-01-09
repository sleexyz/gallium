// @flow
import WebSocket from "ws";
import dgram from "dgram";
import OSC from "osc-js";
import * as TestUtils from "./test_utils";
import child_process from "child_process";

export async function connectToWebsocket(destination: string) {
  const ws = new WebSocket(destination);
  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
  return ws;
}

export function startMockOSCServer(options: { oscPort: number }) {
  const server = dgram.createSocket("udp4");

  const defaultResolvePacketPromise = (message: any) => {
    throw new Error("not inspecting packets");
  };

  let resolvePacketPromise = defaultResolvePacketPromise;

  server.on("message", message => {
    resolvePacketPromise(message);
  });
  server.bind(57110);
  TestUtils.cleanupWith(() => {
    server.close();
  });

  async function getOSCMessage() {
    let packetPromise = new Promise(resolve => {
      resolvePacketPromise = resolve;
    });
    const packet = await packetPromise;
    const message = new OSC.Message();
    message.unpack(new DataView(packet.buffer), 0);
    resolvePacketPromise = defaultResolvePacketPromise;
    return message;
  }

  return {
    server,
    getOSCMessage
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
