import * as TestUtils from "./test_utils";
import * as MIDI from "./midi";

const mockDevice = {
  name: "foo",
  open: async () => mockDevice
};

beforeEach(() => {
  TestUtils.stubMIDIOutputDevices([mockDevice]);
});

describe("connectToOutputPort", () => {
  it("opens the given MIDI port", async () => {
    const port = await MIDI.connectToOutputPort("foo");
    expect(port).toBe(mockDevice);
  });

  it("fails if given port doesn't exist", async () => {
    await expect(MIDI.connectToOutputPort("bar")).rejects.toEqual(
      new Error('Could not find output device named "bar"')
    );
  });
});
