// @flow
import {
  type Pattern,
  type Transformer,
  periodic,
  silence,
  alt,
  fast,
  slow,
  shift,
  stack,
  compose
} from "gallium/lib/semantics";
import { type ABT, resolve } from "gallium/lib/resolver";
import { parseTopLevel } from "gallium/lib/parser";
import * as Interpreter from "gallium/lib/interpreter";

export function pitchMap(f: number => number): Transformer<Uint8Array> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: new Uint8Array([event.value[0], f(event.value[1]), event.value[2]])
    }));
  };
}

const globalContext = {
  note: {
    value: children =>
      alt(
        children.map(x => () =>
          periodic({
            period: 1,
            duration: 1,
            phase: 0,
            value: new Uint8Array([0x90, x, 0x7f]) //note-on
          })
        )
      )
  },
  do: {
    value: compose
  },
  compose: {
    value: compose
  },
  alt: {
    value: alt
  },
  slow: {
    value: xs => alt(xs.map(slow))
  },
  fast: {
    value: xs => alt(xs.map(x => fast(Math.min(x, 256))))
  },
  add: {
    value: xs => alt(xs.map(n => pitchMap(x => x + n)))
  },
  sub: {
    value: xs => alt(xs.map(n => pitchMap(x => x - n)))
  },
  i: {
    value: x => x
  },
  m: {
    value: () => silence
  },
  stack: {
    value: stack
  },
  shift: {
    value: xs => alt(xs.map(shift))
  }
};

export function parseAndResolve(code: string): ABT {
  return resolve(globalContext, parseTopLevel(code));
}

export function interpret(code: string): Pattern<Uint8Array> {
  const abt = parseAndResolve(code);
  return Interpreter.interpret(abt)(silence);
}
