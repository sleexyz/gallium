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
import { type ABT, T, Term, resolve } from "gallium/lib/resolver";
import { parseTopLevel } from "gallium/lib/parser";

export function pitchMap(f: number => number): Transformer<Uint8Array> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: new Uint8Array([event.value[0], f(event.value[1]), event.value[2]])
    }));
  };
}

export const globalContext = {
  note: new Term({
    type: T.function(T.list(T.number), T.transformer),
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
  }),
  do: new Term({
    type: T.function(T.list(T.transformer), T.transformer),
    value: compose
  }),
  compose: new Term({
    type: T.function(T.list(T.transformer), T.transformer),
    value: compose
  }),
  alt: new Term({
    type: T.function(T.list(T.transformer), T.transformer),
    value: alt
  }),
  slow: new Term({
    type: T.function(T.list(T.number), T.transformer),
    value: xs => alt(xs.map(slow))
  }),
  fast: new Term({
    type: T.function(T.list(T.number), T.transformer),
    value: xs => alt(xs.map(fast))
  }),
  add: new Term({
    type: T.function(T.list(T.number), T.transformer),
    value: xs => alt(xs.map(n => pitchMap(x => x + n)))
  }),
  sub: new Term({
    type: T.function(T.list(T.number), T.transformer),
    value: xs => alt(xs.map(n => pitchMap(x => x - n)))
  }),
  i: new Term({
    type: T.transformer,
    value: x => x
  }),
  m: new Term({
    type: T.transformer,
    value: () => silence
  }),
  stack: new Term({
    type: T.function(T.list(T.transformer), T.transformer),
    value: stack
  }),
  shift: new Term({
    type: T.function(T.list(T.number), T.transformer),
    value: xs => alt(xs.map(shift))
  })
};

export function parseAndResolve(code: string): Pattern<any> {
  return resolve(globalContext, parseTopLevel(code)).payload.getValue()(
    silence
  );
}
