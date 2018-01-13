// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import { Editor } from "./Editor";
import { OutputSelector, _OutputSelector } from "./OutputSelector";
import * as MIDI from "./midi";
import * as MIDIActions from "./midi_actions";

async function mountOutputSelector() {
  const { wrapper, store } = await TestUtils.mountWithStore(<Editor />);
  await MIDIActions.selectInitialPort.toFinish();
  wrapper.update();
  return { wrapper, store };
}

async function selectOption({ wrapper, value }): Promise<void> {
  wrapper
    .find("option")
    .first()
    .simulate("change", { target: { value } });
}

describe("OutputSelector", () => {
  TestUtils.withMIDIOutputDevices([
    MIDI.makeDummyDevice("foo"),
    MIDI.makeDummyDevice("bar")
  ]);

  it("shows a selection for each device", async () => {
    const { wrapper } = await mountOutputSelector();
    expect(wrapper.find("option").map(x => x.text())).toEqual(["foo", "bar"]);
  });

  describe("behavior across mounts", () => {
    beforeEach(async () => {
      const { wrapper } = await mountOutputSelector();
      selectOption({ wrapper, value: "foo" });
      wrapper.unmount();
    });

    it("persists choices across mounts", async () => {
      {
        const { wrapper } = await mountOutputSelector();
        selectOption({ wrapper, value: "bar" });
      }
      {
        const { store } = await mountOutputSelector();
        expect(store.state.output.name).toBe("bar");
      }
    });
  });
});

describe("when navigator.requestMIDIAccess doesn't exist", () => {
  it("shows an error message", async () => {
    TestUtils.stubGlobalProperty(navigator, "requestMIDIAccess", undefined);
    const { wrapper } = await mountOutputSelector();
    expect(wrapper.find(OutputSelector).text()).toEqual(
      "Error: Your browser does not seem to support WebMIDI"
    );
  });
});
