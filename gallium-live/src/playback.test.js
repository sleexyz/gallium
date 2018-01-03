// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import * as PlaybackTestUtils from "./playback_test_utils";
import * as Playback from "./playback";
import { parseAndResolve } from "./context";

const { collectEventsNRT } = PlaybackTestUtils.setup();

describe("playback", () => {
  it("registers a noteOn and then a noteOff", async () => {
    TestUtils.mockPerformanceNow(0);
    const pattern = parseAndResolve("note 60");
    const events = await collectEventsNRT({ numBeats: 1, pattern });
    expect(events[0]).toEqual({
      midiMessage: new Uint8Array([0x90, 60, 127]),
      timestamp: 0
    });
    expect(events[1]).toEqual({
      midiMessage: new Uint8Array([0x80, 60, 0]),
      timestamp: 1
    });
  });

  it("repeats patterns", async () => {
    const pattern = parseAndResolve("note 60");
    {
      TestUtils.mockPerformanceNow(0);
      const events = await collectEventsNRT({ numBeats: 1, pattern });
      expect(events[0]).toEqual({
        midiMessage: new Uint8Array([0x90, 60, 127]),
        timestamp: 0
      });
      expect(events[1]).toEqual({
        midiMessage: new Uint8Array([0x80, 60, 0]),
        timestamp: 1
      });
    }
    {
      TestUtils.mockPerformanceNow(1);
      const events = await collectEventsNRT({ numBeats: 1, pattern });
      expect(events[0]).toEqual({
        midiMessage: new Uint8Array([0x90, 60, 127]),
        timestamp: 1
      });
      expect(events[1]).toEqual({
        midiMessage: new Uint8Array([0x80, 60, 0]),
        timestamp: 2
      });
    }
  });

  it("wraps MIDI note values over 127", async () => {
    const pattern = parseAndResolve("note 128");
    const events = await collectEventsNRT({ numBeats: 1, pattern });
    expect(events[0].midiMessage[1]).toEqual(0);
    expect(events[1].midiMessage[1]).toEqual(0);
  });

  it("wraps negative MIDI note values", async () => {
    const pattern = parseAndResolve("do (note 0) (sub 12)");
    const events = await collectEventsNRT({ numBeats: 1, pattern });
    expect(events[0].midiMessage[1]).toEqual(116);
  });
});
