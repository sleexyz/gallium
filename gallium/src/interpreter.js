// @flow

import type { ABT } from "./resolver";
import * as AST from "./AST";

type IState = {
  +numLitInterpreter: number => IContext => any,
  +channel: number
};

export class IContext {
  state: IState;

  constructor(state: IState) {
    this.state = state;
  }

  run<B>(f: IContext => B): B {
    return f(this);
  }
}

const getValue: Interpreter = node => ctx => {
  if (node.data.hasOwnProperty("value")) {
    return node.data.value;
  } else if (node.data.impureValue) {
    return ctx.run(node.data.impureValue);
  }
  throw new Error("Unexpected Error");
};

type Interpreter = ABT => IContext => any;

export const interpret: Interpreter = (node: ABT): (IContext => any) => ctx => {
  if (node instanceof AST.Paren) {
    return ctx.run(interpret(node.children[0]));
  }

  if (node instanceof AST.NumLit) {
    return ctx.run(ctx.state.numLitInterpreter(node.data.value));
  }

  if (node instanceof AST.Name) {
    return ctx.run(getValue(node));
  }

  if (node instanceof AST.HApp || node instanceof AST.VApp) {
    const f = ctx.run(interpret(node.children[0]));
    let args = [];
    for (const child of node.children.slice(1)) {
      const result = ctx.run(interpret(child));
      args.push(result);
    }
    const ret = ctx.run(f(args));
    return ret;
  }

  throw new Error("Interpreter Error");
};
