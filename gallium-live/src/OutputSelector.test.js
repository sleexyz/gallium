// @flow
import * as React from "react";
import { mount } from "enzyme";
import * as TestUtils from "./test_utils";
import { OutputSelector } from "./OutputSelector";

describe("when navigator.requestMIDIAccess doesn't exist", () => {
  it("shows an error message", async () => {
    TestUtils.spyOnAsync(OutputSelector.prototype, "loadOptions");

    const wrapper = mount(<OutputSelector onChange={async () => {}} />);
    await wrapper.instance().loadOptions.toFinish();
    expect(wrapper.text()).toEqual(
      "Your browser does not seem to support WebMIDI"
    );
  });
});
