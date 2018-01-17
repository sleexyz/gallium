// @flow
import * as AST from "./AST";
import { type Transformer } from "./semantics";

export type Term = {
  value?: any
};

export type BindingContext = { [string]: Term };

export type ABT = AST.ASTx<Term>;

type Step = AST.AST => AST.ASTxF<Term, AST.AST>;

const resolveStep = (context: BindingContext): Step => node => {
  if (node instanceof AST.Name) {
    if (!(node.value in context)) {
      throw new Error(`Could not resolve variable ${node.value}`);
    }
    const resolved = context[node.value];
    return node.mapPayload(() => resolved);
  }

  if (node instanceof AST.NumLit) {
    const value = node.value;
    return node.mapPayload(() => ({ value }));
  }

  return node.mapPayload(payload => ({ ...payload }));
};

export const resolve = (context: BindingContext, node: AST.AST): ABT => {
  return AST.traverse(resolveStep(context))(node);
};
