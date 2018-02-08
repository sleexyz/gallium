// @flow
import { makeInitialState, type AppState } from "./efx";
import { Store, type Action } from "./efx";
import { type Event } from "gallium/lib/semantics";
import { type Parameters } from "gallium/lib/top_level";
import * as MIDIUtils from "gallium/lib/midi_utils";

function getBeatLength(bpm: number): number {
  return 1000 * 60 / bpm;
}

export class Player {
  +state: AppState;

  constructor(state: AppState) {
    this.state = state;
  }

  sendEvent(event: Event<Parameters>): void {
    const now = performance.now();
    const timestampOn =
      now + (event.start - this.state.beat) * getBeatLength(this.state.bpm);
    const timestampOff =
      now + (event.end - this.state.beat) * getBeatLength(this.state.bpm) - 1;

    this.state.output.send(
      MIDIUtils.noteOn({
        channel: event.value.channel,
        pitch: event.value.pitch & 127,
        velocity: 127
      }),
      timestampOn
    );

    this.state.output.send(
      MIDIUtils.noteOff({
        channel: event.value.channel,
        pitch: event.value.pitch & 127,
        velocity: 0
      }),
      timestampOff
    );
  }

  queryAndSend(): void {
    const events = this.state.pattern(this.state.beat, this.state.beat + 1);
    for (let i = 0; i < events.length; i++) {
      this.sendEvent(events[i]);
    }
    this.state.beat += 1;
  }
}

export const start: Action<void, void> = () => store => {
  const player = new Player(store.state);
  store.state.intervalId = setInterval(
    () => player.queryAndSend(),
    getBeatLength(store.state.bpm)
  );
};

export const stop: Action<void, void> = () => store => {
  if (store.state.intervalId) {
    clearInterval(store.state.intervalId);
    store.state.intervalId = undefined;
  }
};

export const isPlaying: Action<void, boolean> = () => store => {
  return !!store.state.intervalId;
};
