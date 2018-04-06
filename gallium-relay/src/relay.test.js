// @flow
import * as TestUtils from "./test_utils";
import {
  connectToWebsocket,
  runRelay
} from "./relay_test_utils";

describe("main", () => {
  const websocketPort = 58121;

  it("makes a websocket server that relays text", async () => {
    await runRelay();
    const { ws, getMessage } = await connectToWebsocket(`ws://localhost:${websocketPort}`);
    ws.send("note 60");
    const message = await getMessage();
    console.log("message");

  });
});
