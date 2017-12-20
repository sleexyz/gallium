// @flow

export interface ASTxF<P, X> {
  type: string;
  payload: P;
  children?: Array<X>;
  copy(): ASTxF<P, X>;
  mapPayload<Q>(f: (P) => Q): ASTxF<Q, X>;
}

export type ASTx<P> = ASTxF<P, ASTx<P>>;

export type AST = ASTx<void>;

class ASTxF_Abstract<P, X> {
  type: string;
  payload: P;
  children: Array<X>;
  copy(): ASTxF<P, X> {
    throw new Error("abstract class");
  }
  mapPayload<Q>(f: P => Q): ASTxF<Q, X> {
    const node: any = this.copy();
    node.payload = f(node.payload);
    return node;
  }
}

export class Name<P, X> extends ASTxF_Abstract<P, X> implements ASTxF<P, X> {
  type = "Name";
  value: string;
  constructor(value: string, payload: P) {
    super();
    this.value = value;
    this.payload = payload;
  }
  copy(): Name<P, X> {
    return new Name(this.value, this.payload);
  }
}

export class NumLit<P, X> extends ASTxF_Abstract<P, X> implements ASTxF<P, X> {
  type = "NumLit";
  value: number;
  constructor(value: number, payload: P) {
    super();
    this.value = value;
    this.payload = payload;
  }
  copy(): NumLit<P, X> {
    return new NumLit(this.value, this.payload);
  }
}

export class SExp<P, X> extends ASTxF_Abstract<P, X> implements ASTxF<P, X> {
  type = "SExp";
  children: Array<X>;
  spaces: Array<string>;

  constructor(children: Array<X>, spaces: Array<string>, payload: P) {
    super();
    this.children = [...children];
    this.spaces = spaces;
    this.payload = payload;
  }
  copy(): SExp<P, X> {
    return new SExp(this.children, this.spaces, this.payload);
  }
}

export class IExp<P, X> extends ASTxF_Abstract<P, X> implements ASTxF<P, X> {
  type = "IExp";
  children: Array<X>;
  indent: number;
  extraSpaces: Array<string>;
  constructor(
    children: Array<X>,
    extraSpaces: Array<string>,
    indent: number,
    payload: P
  ) {
    super();
    this.children = [...children];
    this.indent = indent;
    this.extraSpaces = extraSpaces;
    this.payload = payload;
  }
  copy(): IExp<P, X> {
    return new IExp(this.children, this.extraSpaces, this.indent, this.payload);
  }
}

export function traverse<P, Q>(
  step: (ASTx<P>) => ASTxF<Q, ASTx<P>>
): (ASTx<P>) => ASTx<Q> {
  const recurse = node => {
    const ret: any = step(node);
    if (ret.children) {
      const newChildren = [];
      for (const child of ret.children) {
        const newChild: any = recurse(child);
        newChildren.push(newChild);
      }
      ret.children = newChildren;
    }
    return ret;
  };
  return recurse;
}
