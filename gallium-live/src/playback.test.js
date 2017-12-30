// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import * as PlaybackTestUtils from "./playback_test_utils";
import * as Playback from "./playback";
import { parseAndResolve } from "./context";

const { collectEventsNRT } = PlaybackTestUtils.setup();

describe("playback", () => {
  it("wraps MIDI note values over 127", async () => {
    const pattern = parseAndResolve("note 127 128 350");
    const events = await collectEventsNRT({ numBeats: 3, pattern });
    expect(events[0].midiMessage[1]).toEqual(127);
    expect(events[1].midiMessage[1]).toEqual(0);
    expect(events[2].midiMessage[1]).toEqual(94);
  });

  it("wraps negative MIDI note values", async () => {
    const pattern = parseAndResolve("do (note 0) (sub 12)");
    const events = await collectEventsNRT({ numBeats: 1, pattern });
    expect(events[0].midiMessage[1]).toEqual(116);
  });
});
