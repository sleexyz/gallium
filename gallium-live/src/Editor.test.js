// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import { mount } from "enzyme";
import { Editor } from "./Editor.js";
import * as Playback from "./playback";

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
});

describe("when no devices are loaded", () => {
  it("still renders the editor", () => {
    const wrapper = mount(<Editor />);
    expect(wrapper.find("h1").text()).toEqual("gallium");
  });
});
