// @flow
import {
  type AST,
  type ASTxF,
  type ASTx,
  Name,
  NumLit,
  Paren,
  HApp,
  VApp,
  traverse
} from "./AST";
import { type Transformer } from "./semantics";

type TermConstructor =
  | {
      value: any
    }
  | {
      thunkValue: () => any
    };

export class Term {
  value: any;
  thunkValue: () => any;
  evaluated: boolean;
  constructor(data: TermConstructor) {
    if (data.value != null) {
      this.value = data.value;
      Object.defineProperty(this, "evaluated", { value: true });
    } else {
      this.thunkValue = (data: any).thunkValue;
      Object.defineProperty(this, "evaluated", {
        value: false,
        writable: true
      });
    }
  }
  getValue() {
    if (this.evaluated) {
      return this.value;
    }
    const value = this.thunkValue();
    Object.defineProperty(this, "evaluated", { value: true });
    this.value = value;
    return value;
  }
}

type BindingContext<T> = { [string]: T };

export type ABT = ASTx<Term>;

function assert(x: boolean, reason: string) {
  if (!x) {
    throw new Error(reason);
  }
}

type Step<T> = AST => ASTxF<T, AST>;

type StepMiddleware<T> = (BindingContext<T>, Step<T>) => Step<T>;

function composeMiddleware<V, T>(
  middlewareStack: Array<StepMiddleware<T>>
): StepMiddleware<T> {
  return (context, fallback) => {
    let ret = fallback;
    for (const middleware of middlewareStack.reverse()) {
      ret = middleware(context, ret);
    }
    return ret;
  };
}

const runMiddleware = <T>(
  context: BindingContext<T>,
  middleware: StepMiddleware<T>
): Step<T> => middleware(context, failure);

const resolveParenMiddleware = <T>(
  context: BindingContext<T>,
  fallback: Step<T>
): Step<T> => (node: any): ASTxF<T, AST> => {
  if (node instanceof Paren) {
    const boundNode = node.setPayload(
      new Term({
        thunkValue: () => {
          return (boundNode: any).children[0].payload.getValue();
        }
      })
    );
    return boundNode;
  }
  return fallback(node);
};

const resolveNameMiddleware = <T>(
  context: BindingContext<T>,
  fallback: Step<T>
): Step<T> => (node: AST): ASTxF<T, AST> => {
  if (node instanceof Name) {
    if (!(node.value in context)) {
      throw new Error(`Could not resolve variable ${node.value}`);
    }
    const resolved = context[node.value];
    return node.setPayload(resolved);
  }
  return fallback(node);
};

const resolveNumLitMiddleware: StepMiddleware<Term> = (
  context,
  fallback
) => node => {
  if (node instanceof NumLit) {
    return node.setPayload(
      new Term({
        type: "number",
        value: node.value
      })
    );
  }
  return fallback(node);
};

const resolveFunctionApplicationMiddleware: StepMiddleware<Term> = (
  context,
  fallback
) => (node: any) => {
  if (node instanceof VApp || node instanceof HApp) {
    const boundNode = node.setPayload(
      new Term({
        type: { type: "list", param: "number" },
        thunkValue: () => {
          const [fn, ...args] = (boundNode: any).children.map(x => {
            return x.payload.getValue();
          });
          return fn(args);
        }
      })
    );
    return boundNode;
  }
  return fallback(node);
};

const failure = <T>(node: AST): ASTxF<T, AST> => {
  throw new Error("unknown failure");
};

export const resolve = (context: BindingContext<Term>, node: AST): ABT => {
  const step = runMiddleware(
    context,
    composeMiddleware([
      resolveNameMiddleware,
      resolveNumLitMiddleware,
      resolveParenMiddleware,
      resolveFunctionApplicationMiddleware
    ])
  );
  return traverse(step)(node);
};
