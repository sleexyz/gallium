// @flow
import * as React from "react";
import { mount } from "enzyme";
import * as TestUtils from "./test_utils";
import { OutputSelector } from "./OutputSelector";
import * as MIDI from "./midi";

TestUtils.withAsyncSpy(OutputSelector.prototype, "loadOptions");

async function mountOutputSelector({ onChange = jest.fn() }) {
  const wrapper = mount(<OutputSelector onChange={onChange} />);
  await wrapper.instance().loadOptions.toFinish();
  wrapper.update();
  return { wrapper };
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
    const { wrapper } = await mountOutputSelector({});
    expect(wrapper.find("option").map(x => x.text())).toEqual(["foo", "bar"]);
  });

  it("fires props.onChange when selection is selected", async () => {
    const onChange = jest.fn();
    const { wrapper } = await mountOutputSelector({ onChange });
    selectOption({ wrapper, value: "foo" });
    expect(onChange).toHaveBeenCalled();
  });

  describe("behavior across mounts", () => {
    beforeEach(async () => {
      const { wrapper } = await mountOutputSelector({});
      selectOption({ wrapper, value: "foo" });
      wrapper.unmount();
    });

    it("persists choices across mounts", async () => {
      const { wrapper } = await mountOutputSelector({});
      expect(wrapper.instance().state.value).toBe("foo");
    });

    it("calls onChange when initialized to last choice", async () => {
      const onChange = jest.fn();
      const { wrapper } = await mountOutputSelector({ onChange });
      expect(onChange).toHaveBeenCalledWith("foo");
    });
  });
});

describe("when navigator.requestMIDIAccess doesn't exist", () => {
  it("shows an error message", async () => {
    const wrapper = mount(<OutputSelector onChange={async () => {}} />);
    await wrapper.instance().loadOptions.toFinish();
    expect(wrapper.text()).toEqual(
      "Your browser does not seem to support WebMIDI"
    );
  });
});
