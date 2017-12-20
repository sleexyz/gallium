// @flow

import { type ASTx, Name, NumLit, IExp, SExp } from "./AST";

export function print(node: ASTx<*>): string {
  if (node instanceof Name) {
    return node.value;
  }
  if (node instanceof NumLit) {
    return `${node.value}`;
  }
  if (node instanceof SExp) {
    let str = "(";
    for (let i = 0; i < node.children.length; i += 1) {
      str += node.spaces[i];
      str += print(node.children[i]);
    }
    str += node.spaces[node.children.length];
    str += ")";
    return str;
  }
  if (node instanceof IExp) {
    let str = print(node.children[0]);
    for (let i = 1; i < node.children.length; i += 1) {
      str += "\n";
      str += node.extraSpaces[i - 1];
      str += " ".repeat(node.indent);
      str += print(node.children[i]);
    }
    return str;
  }
  throw new Error("Non exhaustive match");
}
