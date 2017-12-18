// @flow
import { parse } from "gallium/lib/parser";
import {
  type Pattern,
  type Transformer,
  periodic,
  silence,
  alt,
  fast,
  slow,
  shift
} from "gallium/lib/semantics";

async function setupMIDI(name: string) {
  const access = await (navigator: any).requestMIDIAccess();
  for (const output of access.outputs.values()) {
    if (name === output.name) {
      const port = await output.open();
      return port;
    }
  }
  throw new Error(`could not find device named ${JSON.stringify(name)}`);
}

type PlaybackState = {
  beat: number,
  pattern: Pattern<*>
};

const note = x =>
  periodic({
    period: 1,
    duration: 1,
    phase: 0,
    value: [0x90, x, 0x7f] //note-on
  });

function getBeatLength(bpm: number): number {
  return 1000 * 60 / bpm;
}

export function pitchMap(f: number => number): Transformer<Array<number>> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: [event.value[0], f(event.value[1]), event.value[2]]
    }));
  };
}

async function main() {
  const output = await setupMIDI("VirMIDI 2-0");
  const state = {
    beat: 0,
    bpm: 160,
    pattern: alt([
      pitchMap(x => x + 12),
      x => x,
      pitchMap(x => x + 12 + 12),
      x => x
    ])(
      fast(4)(
        alt([
          () => note(76),
          () => note(72),
          alt([() => note(62), () => silence]),
          () => fast(1.5)(note(48))
        ])(() => [])
      )
    )
  };
  function queryAndSend() {
    const events = state.pattern(state.beat, state.beat + 1);
    events.map(({ value, start, end }) => {
      const timestamp =
        performance.now() + (start - state.beat) * getBeatLength(state.bpm);
      output.send(value, timestamp);
    });
    state.beat += 1;
  }
  setInterval(() => {
    queryAndSend();
  }, getBeatLength(state.bpm));
}

main();
