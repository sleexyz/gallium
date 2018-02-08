// @flow
import * as AST from "./AST";
import { type Transformer } from "./semantics";
import { IContext } from "./interpreter";
import * as Types from "./types";

export type Impure<A> = IContext => A;

export const pure = <A>(x: A): Impure<A> => {
  return () => x;
};

export const pureFn = <A, B>(f: A => B): (A => Impure<B>) => {
  return x => pure(f(x));
};

export type Term<A> = {
  type?: Types.Type,
  value?: A,
  impureValue?: Impure<A>
};

export type ABT = AST.With<Term<any>>;

export type BindingContext = { [string]: Term<any> };

type Step = AST.Base => AST.PartiallyWith<Term<any>, AST.Base>;

export const resolve = (context: BindingContext, node: AST.Base): ABT => {
  return AST.traverse(resolveStep(context))(node);
};

const resolveStep = (context: BindingContext) => (
  node: AST.Base
): AST.PartiallyWith<Term<*>, AST.Base> => {
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
