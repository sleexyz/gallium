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
    return events.map(event => {
      if (event.value.pitch == null) {
        return event;
      }
      return {
        ...event,
        value: {
          ...event.value,
          pitch: f(event.value.pitch)
        }
      };
    });
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
        const ret = alt(transformers);
        ctx.state = oldState;
        return ret;
      };
    }
  };
}

function fmap<A>(f: A => A): Transformer<A> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: f(event.value)
    }));
  };
}

export type Parameters = {
  channel?: number,
  pitch?: number,
  mute?: boolean
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

const pitch = (pitch: number): Impure<Transformer<Parameters>> => {
  return ctx => {
    const value = {
      channel: ctx.state.channel,
      mute: false,
      pitch
    };
    return fmap(oldValue => ({...oldValue, ...value}));
  };
};

const mute: Transformer<Parameters> = fmap(value => ({ ...value, mute: true }));

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
    value: mute
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
  note: altWithNumLitInterpreter(note),
  slow: altWithNumLitInterpreter(pureFn(x => slow(Math.max(x, 1 / 128)))),
  fast: altWithNumLitInterpreter(pureFn(x => fast(Math.min(x, 128)))),
  add: altWithNumLitInterpreter(pureFn(x => pitchMap(p => p + x))),
  sub: altWithNumLitInterpreter(pureFn(x => pitchMap(p => p - x))),
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

const initialPattern: Pattern<Parameters> = periodic({
  period: 1,
  duration: 1,
  phase: 0,
  value: { pitch: 0, channel: 0 }
});

export function interpret(node: ABT): Pattern<Parameters> {
  const ctx = makeDefaultInterpreterContext();
  const transform = ctx.run(Interpreter.interpret(node));
  const pattern = transform(initialPattern);
  return pattern;
}
