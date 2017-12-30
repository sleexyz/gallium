// @flow
import * as MIDI from "./midi";
import { type Pattern, silence } from "gallium/lib/semantics";

type PlaybackState = {
  intervalId: ?number,
  output: MIDI.Device,
  beat: number,
  bpm: number,
  pattern: Pattern<*>
};

export function makeInitialState() {
  return {
    intervalId: undefined,
    output: MIDI.makeDummyDevice("mockDevice"),
    beat: 0,
    bpm: 160,
    pattern: silence
  };
}

function getBeatLength(bpm: number): number {
  return 1000 * 60 / bpm;
}

export const state: PlaybackState = makeInitialState();

function sendEvent(event): void {
  const timestamp =
    performance.now() + (event.start - state.beat) * getBeatLength(state.bpm);
  const message = new Uint8Array([
    event.value[0],
    event.value[1] & 127,
    event.value[2]
  ]);
  state.output.send(message, timestamp);
}

export function queryAndSend(): void {
  const events = state.pattern(state.beat, state.beat + 1);
  for (let i = 0; i < events.length; i++) {
    sendEvent(events[i]);
  }
  state.beat += 1;
}

export function start(): void {
  state.intervalId = setInterval(
    module.exports.queryAndSend, // for hijacking during tests
    getBeatLength(state.bpm)
  );
}

export function stop() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = undefined;
  }
}

export function isPlaying(): boolean {
  return !!state.intervalId;
}
