// @flow
import { type AST, type ASTxF, type ASTx, Name, traverse } from "./AST";

type BindingContext = { [string]: string };

type ABT = ASTx<?string>;

export const resolveStep = (context: BindingContext) => (
  node: AST
): ASTxF<?string, AST> => {
  if (node instanceof Name) {
    if (!(node.value in context)) {
      throw new Error(`Could not resolve variable ${node.value}`);
    }
    const resolved = context[node.value];
    return node.mapPayload(() => resolved);
  }
  return (node.copy(): any);
};

export const resolve = (context: BindingContext) =>
  traverse(resolveStep(context));
