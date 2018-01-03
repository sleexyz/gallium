// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import { mount } from "enzyme";
import { Editor } from "./Editor.js";
import * as Playback from "./playback";

function setText({ wrapper, value }: { wrapper: any, value: string }): void {
  wrapper.find("textarea").simulate("change", { target: { value } });
  wrapper.update();
}

function setCursor({ wrapper, pos }: { wrapper: any, pos: number }): void {
  const ref = wrapper.instance().textarea;
  ref.setSelectionRange(pos, pos);
}
function pressKey({ wrapper, key }: { wrapper: any, key: string }): void {
  wrapper.find("textarea").simulate("keyPress", { key });
  wrapper.update();
}

describe("Editor", () => {
  beforeEach(() => {
    TestUtils.stubMIDIOutputDevices([]);
  });

  it("starts playback once mounted", () => {
    const wrapper = mount(<Editor />);
    expect(Playback.isPlaying()).toBe(true);
  });

  it("stops playback when unmounted", () => {
    const wrapper = mount(<Editor />);
    wrapper.unmount();
    expect(Playback.isPlaying()).toBe(false);
  });

  describe("indentation", () => {
    it("continues indentation level with one Enter", () => {
      const wrapper = mount(<Editor />);
      const value = "alt\n  i";
      setText({ wrapper, value });
      setCursor({ wrapper, pos: value.length });
      pressKey({ wrapper, key: "Enter" });
      expect(wrapper.find("textarea").text()).toBe("alt\n  i\n  ");
    });

    it("continues indentation level with two Enters", () => {
      const wrapper = mount(<Editor />);
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
    const wrapper = mount(<Editor />);
    expect(wrapper.find("h1").text()).toEqual("gallium");
  });
});
