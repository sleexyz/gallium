// @flow

import {
  type Parser,
  type ParseState,
  ParseContext,
  ParseError,
  constant,
  alternate,
  regExp,
  withFallback,
  getSpaces,
  getNewline,
  maybe,
  whitespace,
  headIndent,
  pushIndent,
  popIndent
} from "./parser_combinators";

export { ParseContext } from "./parser_combinators.js";

interface AST {
  type: string;
  children?: Array<AST>;
  print(): string;
  pretty(): AST;
  _pretty(indent: number): AST;
}

class AST_ {
  pretty() {
    return this._pretty(0);
  }
  _pretty(indent: number): AST {
    throw new Error("abstract class");
  }
}

class Name extends AST_ implements AST {
  type = "Name";
  data: string;
  constructor(data: string) {
    super();
    this.data = data;
  }
  print() {
    return this.data;
  }
  _pretty(indent: number) {
    return new Name(this.data);
  }
}

class List extends AST_ implements AST {
  type = "List";
  children: Array<AST>;
  spaces: Array<string>;
  constructor(children: Array<AST>, spaces: Array<string>) {
    super();
    this.children = [...children];
    this.spaces = spaces;
  }
  print() {
    let str = "(";
    for (let i = 0; i < this.children.length; i += 1) {
      str += this.spaces[i];
      str += this.children[i].print();
    }
    str += this.spaces[this.children.length];
    str += ")";
    return str;
  }
  _pretty(indent: number) {
    const spaces = Array(this.children.length + 1).fill(" ");
    spaces[0] = "";
    spaces[this.children.length] = "";
    return new List(this.children.map(x => x._pretty(indent)), spaces);
  }
}

class IList extends AST_ implements AST {
  type = "IList";
  children: Array<AST>;
  indent: number;
  extraSpaces: Array<string>;
  constructor(
    children: Array<AST>,
    extraSpaces: Array<string>,
    indent: number
  ) {
    super();
    this.children = [...children];
    this.indent = indent;
    this.extraSpaces = extraSpaces;
  }
  print() {
    let str = this.children[0].print();
    for (let i = 1; i < this.children.length; i += 1) {
      str += "\n";
      str += this.extraSpaces[i - 1];
      str += " ".repeat(this.indent);
      str += this.children[i].print();
    }
    return str;
  }
  _pretty(indent: number) {
    const children = this.children.map(x => x._pretty(indent + 2));
    const newIndent = indent + 2;
    const extraSpaces = Array(this.extraSpaces.length).fill("");
    return new IList(children, extraSpaces, newIndent);
  }
}

class NumLit extends AST_ implements AST {
  type = "NumLit";
  data: number;
  constructor(data: number) {
    super();
    this.data = data;
  }
  print() {
    return `${this.data}`;
  }
  _pretty(indent: number) {
    return new NumLit(this.data);
  }
}

export const parseName: Parser<AST> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^[a-zA-Z]+/);
  if (!match) {
    throw new ParseError("not a name");
  }
  const name = match[0];
  ctx.setText(text.substring(name.length));
  return new Name(name);
};

export const parseNumLit: Parser<AST> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^[0-9]+/);
  if (!match) {
    throw new ParseError("not a number");
  }
  const numString = match[0];
  ctx.setText(text.substring(numString.length));
  return new NumLit(parseInt(numString));
};

const increasedIndentationNewline: Parser<{
  extraSpace: string,
  indent: number
}> = ctx => {
  const currentIndent = ctx.run(headIndent);
  ctx.run(maybe(getSpaces));
  ctx.run(getNewline);
  const extraSpace = ctx.run(withFallback(regExp(/^\s*\n+/), ""));
  const numSpaces = ctx.run(getSpaces).length;
  if (numSpaces > currentIndent) {
    ctx.run(pushIndent(numSpaces));
    return { extraSpace, indent: numSpaces };
  }
  throw new Error("no increased indentation");
};

const sameIndentationNewline: Parser<{
  extraSpace: string,
  indent: number
}> = ctx => {
  const currentIndent = ctx.run(headIndent);
  ctx.run(maybe(getSpaces));
  ctx.run(getNewline);
  const extraSpace = ctx.run(withFallback(regExp(/^\s*\n+/), ""));
  const numSpaces = ctx.run(getSpaces).length;
  if (numSpaces === currentIndent) {
    return { extraSpace, indent: numSpaces };
  }
  throw new Error("not same indentation");
};

export const parseIList: Parser<AST> = ctx => {
  const term = ctx.run(parseTerm1);
  const { extraSpace, indent } = ctx.run(increasedIndentationNewline);
  const child = ctx.run(parseTerm0);
  const { children, extraSpaces } = ctx.run(
    parseIListAux({ children: [child], extraSpaces: [extraSpace] })
  );
  return new IList([term, ...children], extraSpaces, indent);
};

function parseIListAux({
  children,
  extraSpaces
}: {
  children: Array<AST>,
  extraSpaces: Array<string>
}): Parser<{ children: Array<AST>, extraSpaces: Array<string> }> {
  return alternate([
    ctx => {
      const { extraSpace } = ctx.run(sameIndentationNewline);
      const child = ctx.run(parseTerm0);
      return ctx.run(
        parseIListAux({
          children: [...children, child],
          extraSpaces: [...extraSpaces, extraSpace]
        })
      );
    },
    ctx => {
      ctx.run(popIndent);
      return { children, extraSpaces };
    }
  ]);
}

export const parseList: Parser<AST> = ctx => {
  ctx.run(constant("("));
  const space = ctx.run(withFallback(whitespace, ""));
  const child = ctx.run(parseTerm0);
  const { children, spaces } = ctx.run(
    parseListAux({ children: [child], spaces: [space] })
  );
  return new List(children, spaces);
};

const parseListAux = ({
  children,
  spaces
}: {
  children: Array<AST>,
  spaces: Array<string>
}): Parser<{ children: Array<AST>, spaces: Array<string> }> => ctx => {
  const space = ctx.run(withFallback(whitespace, ""));
  return ctx.run(
    alternate([
      ctx => {
        ctx.run(constant(")"));
        return { children, spaces: [...spaces, space] };
      },
      ctx => {
        const child = ctx.run(parseTerm0);
        return ctx.run(
          parseListAux({
            children: [...children, child],
            spaces: [...spaces, space]
          })
        );
      }
    ])
  );
};

const parseTerm1: Parser<AST> = alternate([parseList, parseName, parseNumLit]);

const parseTerm0: Parser<AST> = alternate([parseIList, parseTerm1]);

export function parse(input: string): AST {
  const ctx = new ParseContext({ text: input, indents: [0] });
  return parseTerm0(ctx);
}
