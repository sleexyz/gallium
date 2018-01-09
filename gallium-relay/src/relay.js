// @flow
import WebSocket from "ws";
import http from "http";
import OSC from "osc-js";
import dgram from "dgram";

export type Options = {
  websocketPort: number,
  oscPort: number
};

export function main(options: Options) {
  const { websocketPort, oscPort } = options;

  const wsServer = new WebSocket.Server({
    port: websocketPort
  });

  const udpSocket = dgram.createSocket("udp4");

  wsServer.on("connection", ws => {
    ws.on("message", text => {
      sendText(text);
    });
    ws.on("error", () => {});
  });

  function sendText(text) {
    const message = new OSC.Message("/text", text);
    const binary = message.pack();
    udpSocket.send(
      new Buffer(binary),
      0,
      binary.byteLength,
      oscPort,
      "localhost"
    );
  }
  console.log(`Gallium Relay started.`);
  return { wsServer, udpSocket };
}
