// @flow

import * as AST from "./AST";
import { type ABT } from "./resolver";
import * as Types from "./types";

type Context = {
  type: Types.Type
};

export const infer = (node: ABT): Types.Type => {
  if (node instanceof AST.HApp || node instanceof AST.VApp) {
    const funType = infer(node.children[0]);
    return funType.output;
  }
  if (node instanceof AST.Paren) {
    return infer(node.children[0]);
  }
  if (node instanceof AST.Name) {
    return node.data.type;
  }
}

export const check = (node: ABT, ctx: Context): void => {
  if (node instanceof AST.HApp || node instanceof AST.VApp) {
    const funType = infer(node.children[0]);
    if (funType.tag === "listProcessor") {
      const outputType = funType.output;
      const inputType = funType.input;

      if (outputType !== ctx.type) {
        throw new Error("type error");
      }

      for (const input of node.children.slice(1)) {
        check(input, { type: inputType });
      }
    } else if (funType.tag == "func") {
      const outputType = funType.output;
      const inputType = funType.input;

      if (outputType !== ctx.type) {
        throw new Error("type error");
      }

      if (node.children.length > 2) {
        throw new Error("too many arguments: expected just one");
      }

      check(node.children[1], { type: inputType });
    }
  }

  if (node instanceof AST.Name) {
    if (node.data.type !== ctx.type) {
      throw new Error("type error");
    }
  }

  if (node instanceof AST.Paren) {
    check(node.children[0], ctx);
  }
};
