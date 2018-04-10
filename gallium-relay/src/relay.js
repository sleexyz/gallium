// @flow
import WebSocket from "ws";
import http from "http";

export type Options = {
  websocketPort: number,
};

export function main(options: Options) {
  const { websocketPort } = options;

  const wsServer = new WebSocket.Server({
    port: websocketPort
  });

  wsServer.broadcast = data => {
    wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  wsServer.on("connection", ws => {
    ws.on("message", data => {
      console.log(JSON.stringify(data, null, 2));
      wsServer.broadcast(data);
    });
    ws.on("error", () => {});
  });

  console.log(`Gallium Relay started.`);
  return { wsServer };
}
