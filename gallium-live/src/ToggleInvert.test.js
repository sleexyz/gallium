// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import * as ToggleInvert from "./ToggleInvert";
import { App, Container } from "./App";

test("invert is initialized as false", async () => {
  const { wrapper } = await TestUtils.mountWithStore(<App />);
  expect(wrapper.find(Container).props().style.filter).toBe("");
});

test("toggling invert inverts the screen", async () => {
  const { wrapper } = await TestUtils.mountWithStore(<App />);
  wrapper.find(ToggleInvert.Box).simulate("change");
  expect(wrapper.find(Container).props().style.filter).toBe("invert(100%)");
});

test("invert on is preserved across reloads", async () => {
  {
    const { wrapper } = await TestUtils.mountWithStore(<App />);
    wrapper.find(ToggleInvert.Box).simulate("change");
    wrapper.unmount();
  }
  {
    const { wrapper } = await TestUtils.mountWithStore(<App />);
    expect(wrapper.find(Container).props().style.filter).toBe("invert(100%)");
  }
});

test("invert off is preserved across reloads", async () => {
  {
    const { wrapper } = await TestUtils.mountWithStore(<App />);
    wrapper.find(ToggleInvert.Box).simulate("change");
    wrapper.find(ToggleInvert.Box).simulate("change");
    wrapper.unmount();
  }
  {
    const { wrapper } = await TestUtils.mountWithStore(<App />);
    expect(wrapper.find(Container).props().style.filter).not.toBe(
      "invert(100%)"
    );
  }
});
