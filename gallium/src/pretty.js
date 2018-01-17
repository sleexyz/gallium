// @flow

import { type ASTx, Name, NumLit, VApp, Paren, HApp } from "./AST";

function _pretty<P: {}>(indent: number, node: ASTx<P>): ASTx<P> {
  if (node instanceof Name) {
    return node.copy();
  }
  if (node instanceof NumLit) {
    return node.copy();
  }
  if (node instanceof Paren) {
    return new Paren(
      node.children.map(x => _pretty(indent, x)),
      ["", ""],
      node.payload
    );
  }
  if (node instanceof HApp) {
    const spaces = Array(node.children.length).fill(" ");
    spaces[node.children.length - 1] = "";
    return new HApp(
      node.children.map(x => _pretty(indent, x)),
      spaces,
      node.payload
    );
  }
  if (node instanceof VApp) {
    const children = node.children.map(x => _pretty(indent + 2, x));
    const newIndent = indent + 2;
    const extraSpaces = Array(node.extraSpaces.length).fill("");
    return new VApp(children, extraSpaces, newIndent, node.payload);
  }
  throw new Error("Non exhaustive match");
}

export function pretty<P: {}>(node: ASTx<P>): ASTx<P> {
  return _pretty(0, node);
}
