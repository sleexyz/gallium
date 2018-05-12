// @flow
import * as React from "react";
import { App } from "../App.js";
import { getText, setText } from "../Editor_test_utils";
import { getBPM, setBPM } from "../playback_test_utils";
import * as TestUtils from "../test_utils";

beforeEach(() => {
  TestUtils.stubMIDIOutputDevices([]);
});

test("text is preserved across reloads", () => {
  {
    const { wrapper } = TestUtils.mountWithStore(<App />);
    setText({ wrapper, value: "note 1 2 3" });
    expect(getText({ wrapper })).toBe("note 1 2 3");
    wrapper.unmount();
  }
  {
    const { wrapper } = TestUtils.mountWithStore(<App />);
    expect(getText({ wrapper })).toBe("note 1 2 3");
  }
});

test("bpm is preserved across reloads", () => {
  {
    const { wrapper } = TestUtils.mountWithStore(<App />);
    setBPM({ wrapper, value: 120 });
    wrapper.unmount();
  }
  {
    const { wrapper } = TestUtils.mountWithStore(<App />);
    expect(getBPM({ wrapper })).toBe(120);
  }
});
