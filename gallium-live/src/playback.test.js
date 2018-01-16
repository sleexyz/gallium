// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import { collectEventsNRT } from "./playback_test_utils";
import * as Playback from "./playback";
import { Store, makeInitialState } from "./efx";
import { parseAndResolve } from "./context";

describe("playback", () => {
  let store: Store;
  beforeEach(() => {
    store = new Store(makeInitialState());
  });

  it("registers a noteOn and then a noteOff", async () => {
    TestUtils.mockPerformanceNow(0);

    const pattern = parseAndResolve("note 60");
    const events = await store.dispatch(
      collectEventsNRT({ numBeats: 1, pattern })
    );

    expect(events[0]).toEqual({
      midiMessage: new Uint8Array([0x90, 60, 127]),
      timestamp: 0
    });

    expect(events[1]).toEqual({
      midiMessage: new Uint8Array([0x80, 60, 0]),
      timestamp: 10 - 1
    });
  });

  it("repeats patterns", async () => {
    const pattern = parseAndResolve("note 60");

    {
      TestUtils.mockPerformanceNow(0);

      const events = await store.dispatch(
        collectEventsNRT({ numBeats: 1, pattern })
      );

      expect(events[0]).toEqual({
        midiMessage: new Uint8Array([0x90, 60, 127]),
        timestamp: 0
      });

      expect(events[1]).toEqual({
        midiMessage: new Uint8Array([0x80, 60, 0]),
        timestamp: 10 - 1
      });
    }
    {
      TestUtils.mockPerformanceNow(10);

      const events = await store.dispatch(
        collectEventsNRT({ numBeats: 1, pattern })
      );

      expect(events[0]).toEqual({
        midiMessage: new Uint8Array([0x90, 60, 127]),
        timestamp: 10
      });

      expect(events[1]).toEqual({
        midiMessage: new Uint8Array([0x80, 60, 0]),
        timestamp: 20 - 1
      });
    }
  });

  it("wraps MIDI note values over 127", async () => {
    const pattern = parseAndResolve("note 128");
    const events = await store.dispatch(
      collectEventsNRT({ numBeats: 1, pattern })
    );
    expect(events[0].midiMessage[1]).toEqual(0);
    expect(events[1].midiMessage[1]).toEqual(0);
  });

  it("wraps negative MIDI note values", async () => {
    const pattern = parseAndResolve("do (note 0) (sub 12)");
    const events = await store.dispatch(
      collectEventsNRT({ numBeats: 1, pattern })
    );
    expect(events[0].midiMessage[1]).toEqual(116);
  });
});
