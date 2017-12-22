// @flow

import { type ASTx, Name, NumLit, IExpr, SExpr, OpenSExpr } from "./AST";

function _pretty<X>(indent: number, node: ASTx<X>): ASTx<X> {
  if (node instanceof Name) {
    return node.copy();
  }
  if (node instanceof NumLit) {
    return node.copy();
  }
  if (node instanceof SExpr) {
    const spaces = Array(node.children.length + 1).fill(" ");
    spaces[0] = "";
    spaces[node.children.length] = "";
    return new SExpr(
      node.children.map(x => _pretty(indent, x)),
      spaces,
      node.payload
    );
  }
  if (node instanceof OpenSExpr) {
    const spaces = Array(node.children.length).fill(" ");
    spaces[node.children.length - 1] = "";
    return new OpenSExpr(
      node.children.map(x => _pretty(indent, x)),
      spaces,
      node.payload
    );
  }
  if (node instanceof IExpr) {
    const children = node.children.map(x => _pretty(indent + 2, x));
    const newIndent = indent + 2;
    const extraSpaces = Array(node.extraSpaces.length).fill("");
    return new IExpr(children, extraSpaces, newIndent, node.payload);
  }
  throw new Error("Non exhaustive match");
}

export function pretty<X>(node: ASTx<X>): ASTx<X> {
  return _pretty(0, node);
}
