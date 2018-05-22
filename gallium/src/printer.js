// @flow

import { type With, Name, HApp, NumLit, VApp, Paren } from "./AST";

export function print(node: With<*>): string {
  if (node instanceof Name) {
    return node.value;
  }
  if (node instanceof NumLit) {
    return `${node.value}`;
  }
  if (node instanceof Paren) {
    let str = "(";
    str += node.spaces[0];
    str += print(node.children[0]);
    str += node.spaces[1];
    str += ")";
    return str;
  }
  if (node instanceof HApp) {
    let str = "";
    for (let i = 0; i < node.children.length; i += 1) {
      str += print(node.children[i]);
      if (i < node.children.length - 1) {
        str += node.spaces[i];
      }
    }
    return str;
  }
  if (node instanceof VApp) {
    let str = print(node.children[0]);
    str += node.extraSpaces[0];
    for (let i = 1; i < node.children.length; i += 1) {
      str += "\n";
      str += node.extraSpaces[2 * i - 1];
      str += " ".repeat(node.indent);
      str += print(node.children[i]);
      str += node.extraSpaces[2 * i];
    }
    return str;
  }
  throw new Error("Non exhaustive match");
}
