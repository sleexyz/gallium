// @flow
import * as AST from "./AST";
import { type Transformer } from "./semantics";

type Term = { value?: any };

export type ABT = AST.With<Term>;

export type BindingContext = { [string]: Term };

type Step = AST.Base => AST.PartiallyWith<Term, AST.Base>;

export const resolve = (context: BindingContext, node: AST.Base): ABT => {
  return AST.traverse(resolveStep(context))(node);
};

const resolveStep = (context: BindingContext) => (
  node: AST.Base
): AST.PartiallyWith<{ value?: any }, AST.Base> => {
  if (node instanceof AST.Name) {
    if (!(node.value in context)) {
      throw new Error(`Could not resolve variable ${node.value}`);
    }
    const resolved = context[node.value];
    return node.mapData(() => resolved);
  }

  if (node instanceof AST.NumLit) {
    const value = node.value;
    return node.mapData(() => ({ value }));
  }

  return node.mapData(data => ({ ...data }));
};
