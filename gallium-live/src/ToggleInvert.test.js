// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import * as ToggleInvert from "./ToggleInvert";
import { Editor, Container } from "./Editor";

test("invert is initialized as false", async () => {
  const { wrapper } = await TestUtils.mountWithStore(<Editor />);
  expect(wrapper.find(Container).props().style.filter).toBe("");
});

test("toggling invert inverts the screen", async () => {
  const { wrapper } = await TestUtils.mountWithStore(<Editor />);
  wrapper.find(ToggleInvert.Box).simulate("change");
  expect(wrapper.find(Container).props().style.filter).toBe("invert()");
});

test("invert state is preserved across reloads", async () => {
  {
    const { wrapper } = await TestUtils.mountWithStore(<Editor />);
    wrapper.find(ToggleInvert.Box).simulate("change");
    wrapper.unmount();
  }
  {
    const { wrapper } = await TestUtils.mountWithStore(<Editor />);
    expect(wrapper.find(Container).props().style.filter).toBe("invert()");
  }
});
