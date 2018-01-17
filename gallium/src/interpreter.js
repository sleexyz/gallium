// @flow

import { type ABT } from "./resolver";
import * as AST from "./AST";

type IContext<State: {}> = {
  state: State
};

export const interpret = (node: ABT): any => {
  if (node instanceof AST.Paren) {
    return interpret(node.children[0]);
  }

  if (node instanceof AST.NumLit || node instanceof AST.Name) {
    return node.payload.value;
  }

  if (node instanceof AST.HApp || node instanceof AST.VApp) {
    const f = interpret(node.children[0]);
    const args = node.children.slice(1).map(interpret);
    return f(args);
  }

  throw new Error("error");
};
