// @flow
import * as TestUtils from "./test_utils";
import * as Playback from "./playback";
import { type Pattern, silence } from "gallium/lib/semantics";

export function setup() {
  afterEach(() => {
    Object.assign(Playback.state, Playback.makeInitialState());
  });

  return { collectEventsNRT };
}

async function collectEventsNRT({
  pattern,
  numBeats
}: {
  pattern: Pattern<Uint8Array>,
  numBeats: number
}) {
  Playback.state.pattern = pattern;
  Playback.state.bpm = 60000;
  const events = [];

  let counter = 0;
  let _resolve;

  Playback.state.output.send = (midiMessage: Uint8Array, timestamp: number) => {
    events.push({ midiMessage, timestamp });
  };

  TestUtils.modifyGlobalProperty(Playback, "queryAndSend", queryAndSend => {
    return () => {
      queryAndSend();
      counter += 1;
      if (counter === numBeats) {
        _resolve();
      }
    };
  });

  Playback.start();

  await new Promise(resolve => {
    _resolve = resolve;
  });

  Playback.stop();
  return events;
}
