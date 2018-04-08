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
import {
  type Term,
  type BindingContext,
  type ABT,
  resolve,
  pureFn,
  type Impure
} from "./resolver";
import { parseTopLevel } from "./parser";
import * as Interpreter from "./interpreter";
import { IContext } from "./interpreter";
import * as Types from "./types";
import * as TypeChecker from "./type_checker";

export function pitchMap(f: number => number): Transformer<Parameters> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: {
        ...event.value,
        pitch: f(event.value.pitch)
      }
    }));
  };
}

export function chanMap(f: number => number): Transformer<Parameters> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: {
        ...event.value,
        channel: f(event.value.channel)
      }
    }));
  };
}

function altWithNumLitInterpreter<A>(
  numLitInterpreter: number => IContext => A
): Term<(Array<Transformer<A>>) => Impure<Transformer<A>>> {
  return {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    impureValue: (ctx: IContext) => {
      const oldState = ctx.state;
      ctx.state = { ...ctx.state, numLitInterpreter };
      return transformers => ctx => {
        ctx.state = oldState;
        return alt(transformers);
      };
    }
  };
}

function altWithZoom<A>( n: number): Term<(Array<Transformer<A>>) => Transformer<A>> {
  return {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    value: transformers => {
      return () => p => slow(n)(alt(transformers.map(t => p => fast(n)(t(p))))(p));
    }
  }
}

export type Parameters = {
  channel: number,
  pitch: number
};

const note = (pitch: number): Impure<Transformer<Parameters>> => {
  return ctx => {
    const value = {
      channel: ctx.state.channel,
      pitch
    };
    return () =>
      periodic({
        period: 1,
        duration: 1,
        phase: 0,
        value
      });
  };
};

const backtrackPureFn = f => ctx => {
  const oldState = ctx.state;
  return x => {
    return ctx => {
      const ret = f(x);
      ctx.state = oldState;
      return ret;
    };
  };
};

const globalContext: BindingContext = {
  i: {
    type: Types.transformer,
    value: x => x
  },
  m: {
    type: Types.transformer,
    value: () => silence
  },
  do: {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    impureValue: backtrackPureFn(compose)
  },
  compose: {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    impureValue: backtrackPureFn(compose)
  },
  stack: {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    impureValue: backtrackPureFn(stack)
  },
  alt: {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    impureValue: backtrackPureFn(alt)
  },
  out1: altWithZoom(1),
  out2: altWithZoom(2),
  out3: altWithZoom(4),
  out3: altWithZoom(8),
  out4: altWithZoom(16),
  out5: altWithZoom(32),
  out6: altWithZoom(64),
  in1: altWithZoom(1/1),
  in2: altWithZoom(1/2),
  in3: altWithZoom(1/4),
  in3: altWithZoom(1/8),
  in4: altWithZoom(1/16),
  in5: altWithZoom(1/32),
  in5: altWithZoom(1/64),
  note: altWithNumLitInterpreter(note),
  slow: altWithNumLitInterpreter(pureFn(x => slow(Math.max(x, 1 / 128)))),
  fast: altWithNumLitInterpreter(pureFn(x => fast(Math.min(x, 128)))),
  add: altWithNumLitInterpreter(pureFn(x => pitchMap(p => p + x))),
  sub: altWithNumLitInterpreter(pureFn(x => pitchMap(p => p - x))),
  chan: altWithNumLitInterpreter(pureFn(x => chanMap(() => x))),
  shift: altWithNumLitInterpreter(pureFn(shift)),
  channel: {
    type: Types.func(Types.number, Types.transformer),
    impureValue: ctx => {
      const oldState = ctx.state;
      ctx.state = { ...ctx.state, numLitInterpreter: x => () => x };
      return ([channel]) => ctx => {
        ctx.state = {
          ...ctx.state,
          channel: channel,
          numLitInterpreter: oldState.numLitInterpreter
        };
        return x => x;
      };
    }
  }
};

const numberNumLitInterpreter: number => IContext => number = n => () => n;

const makeDefaultInterpreterContext = () => {
  return new IContext({
    numLitInterpreter: note,
    channel: 0
  });
};

export function parseAndResolve(code: string): ABT {
  const node = resolve(globalContext, parseTopLevel(code));
  TypeChecker.check(node, { type: Types.transformer });
  return node;
}

export function interpret(node: ABT): Pattern<Parameters> {
  const ctx = makeDefaultInterpreterContext();
  const transform = ctx.run(Interpreter.interpret(node));
  const pattern = transform(silence);
  return pattern;
}
