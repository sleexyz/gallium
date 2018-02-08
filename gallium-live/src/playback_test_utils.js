// @flow
import * as TestUtils from "./test_utils";
import * as Playback from "./playback";
import { type Pattern, silence } from "gallium/lib/semantics";
import { type Parameters } from "gallium/lib/top_level";
import { type Action } from "./efx";

export const collectEventsNRT: Action<
  {
    pattern: Pattern<Parameters>,
    numBeats: number
  },
  Promise<Array<any>>
> = input => async store => {
  const { pattern, numBeats } = input;
  store.state.pattern = pattern;
  store.state.bpm = 6000;
  const events = [];

  let counter = 0;
  let _resolve;

  store.state.output.send = (midiMessage: Uint8Array, timestamp: number) => {
    events.push({ midiMessage, timestamp });
  };

  TestUtils.modifyGlobalProperty(
    Playback.Player.prototype,
    "queryAndSend",
    queryAndSend => {
      return function mockQueryAndSend() {
        queryAndSend.call(this);
        counter += 1;
        if (counter === numBeats) {
          _resolve();
        }
      };
    }
  );

  store.dispatch(Playback.start());

  await new Promise(resolve => {
    _resolve = resolve;
  });

  store.dispatch(Playback.stop());
  return events;
};
