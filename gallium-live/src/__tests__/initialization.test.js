// @flow
import * as React from "react";
import { Editor } from "../Editor.js";
import * as MIDI from "../midi";
import * as MIDIActions from "../midi_actions";
import * as TestUtils from "../test_utils";

const dummyDevice = MIDI.makeDummyDevice("foo");

beforeEach(() => {
  TestUtils.stubMIDIOutputDevices([dummyDevice, MIDI.makeDummyDevice("bar")]);
});

test("first device is used by default", async () => {
  const { wrapper, store } = await TestUtils.mountWithStore(<Editor />);
  await MIDIActions.selectInitialPort.toFinish();
  expect(store.state.output).toBe(dummyDevice);
});
