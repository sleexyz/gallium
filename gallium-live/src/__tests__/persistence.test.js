// @flow
import * as React from "react";
import Editor from "../Editor.js";
import { getText, setText } from "../Editor_test_utils";
import * as TestUtils from "../test_utils";

beforeEach(() => {
  TestUtils.stubMIDIOutputDevices([]);
});

test("text is preserved across reloads", () => {
  {
    const { wrapper } = TestUtils.mountWithStore(<Editor />);
    setText({ wrapper, value: "note 1 2 3" });
    expect(getText({ wrapper })).toBe("note 1 2 3");
    wrapper.unmount();
  }
  {
    const { wrapper } = TestUtils.mountWithStore(<Editor />);
    expect(getText({ wrapper })).toBe("note 1 2 3");
  }
});
