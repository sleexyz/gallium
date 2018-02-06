// @flow

import * as AST from "./AST";
import { type ABT } from "./resolver";
import * as Types from "./types";

type Context = {
  type: Types.Type
};

export const check = (node: ABT, ctx: Context): void => {
  if (node instanceof AST.HApp || node instanceof AST.VApp) {
    const funType = node.children[0].data.type;
    if (funType.tag === "listProcessor") {
      const outputType = funType.output;
      const inputType = funType.input;

      if (outputType !== ctx.type) {
        throw new Error("type error");
      }

      for (const input of node.children.slice(1)) {
        check(input, { type: inputType });
      }
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
