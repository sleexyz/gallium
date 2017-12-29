// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import { mount } from "enzyme";
import { Editor, globalPlaybackState } from "./Editor.js";

describe("Editor", () => {
  beforeEach(() => {
    TestUtils.stubMIDIOutputDevices([]);
  });

  it("starts playback once mounted", () => {
    const wrapper = mount(<Editor />);
    expect(globalPlaybackState.isPlaying).toBe(true);
  });

  it("stops playback when unmounted", () => {
    const wrapper = mount(<Editor />);
    wrapper.unmount();
    expect(globalPlaybackState.isPlaying).toBe(false);
  });
});

describe("when no devices are loaded", () => {
  it("still renders the editor", () => {
    const wrapper = mount(<Editor />);
    expect(wrapper.find("h1").text()).toEqual("gallium");
  });
});
