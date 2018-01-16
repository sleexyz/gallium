// @flow
import { type Action, makeAction } from "./efx";
import * as Playback from "./playback";
import * as MIDIActions from "./midi_actions.js";

export const initialize: Action<void, Promise<void>> = makeAction(
  () => async store => {
    store.dispatch(Playback.start());
    try {
      await store.dispatch(MIDIActions.selectInitialPort());
    } catch (e) {
      store.state.error = e;
    }
  }
);
