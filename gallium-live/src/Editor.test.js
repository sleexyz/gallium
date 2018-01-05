// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import Editor, { Editor as EditorInner, Textarea } from "./Editor.js";
import * as Playback from "./playback";
import { setText, setCursor, pressKey } from "./Editor_test_utils";

describe("Editor", () => {
  beforeEach(() => {
    TestUtils.stubMIDIOutputDevices([]);
  });

  it("starts playback once mounted", () => {
    const { wrapper, store } = TestUtils.mountWithStore(<Editor />);
    expect(store.dispatch(Playback.isPlaying())).toBe(true);
  });

  it("stops playback when unmounted", () => {
    const { wrapper, store } = TestUtils.mountWithStore(<Editor />);
    wrapper.unmount();
    expect(store.dispatch(Playback.isPlaying())).toBe(false);
  });

  describe("indentation", () => {
    it("continues indentation level with one Enter", () => {
      const { wrapper } = TestUtils.mountWithStore(<Editor />);
      const value = "alt\n  i";
      setText({ wrapper, value });
      setCursor({ wrapper, pos: value.length });
      pressKey({ wrapper, key: "Enter" });
      expect(wrapper.find("textarea").text()).toBe("alt\n  i\n  ");
    });

    it("continues indentation level with two Enters", () => {
      const { wrapper } = TestUtils.mountWithStore(<Editor />);
      const value = "alt\n  i";
      setText({ wrapper, value });
      setCursor({ wrapper, pos: value.length });
      pressKey({ wrapper, key: "Enter" });
      pressKey({ wrapper, key: "Enter" });
      expect(wrapper.find("textarea").text()).toBe("alt\n  i\n  \n  ");
    });
  });
});

describe("when no devices are loaded", () => {
  it("still renders the editor", () => {
    const { wrapper } = TestUtils.mountWithStore(<Editor />);
    expect(wrapper.find(Textarea)).toBePresent();
  });
});
