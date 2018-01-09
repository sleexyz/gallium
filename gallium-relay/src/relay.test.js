// @flow
import * as TestUtils from "./test_utils";
import {
  connectToWebsocket,
  startMockOSCServer,
  runRelay
} from "./relay_test_utils";

describe("main", () => {
  const oscPort = 57110;
  const websocketPort = 58121;

  it("makes a websocket server that relays text", async () => {
    const oscServer = startMockOSCServer({ oscPort });
    await runRelay();
    const ws = await connectToWebsocket(`ws://localhost:${websocketPort}`);

    ws.send("note 60");
    const message = await oscServer.getOSCMessage();
    expect(message.address).toBe("/text");
    expect(message.args).toEqual(["note 60"]);
  });
});
