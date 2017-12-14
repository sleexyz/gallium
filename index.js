// @flow

interface AST {
  type: string;
  children?: Array<AST>;
  print(): string;
  pretty(): AST;
  _pretty(indent: number): AST;
}

class Name implements AST {
  type = "Name";
  data: string;
  constructor(data: string) {
    this.data = data;
  }
  print() {
    return this.data;
  }
  pretty() {
    return this._pretty(0);
  }
  _pretty(indent: number) {
    return new Name(this.data);
  }
}

class List implements AST {
  type = "List";
  children: Array<AST>;
  spaces: Array<string>;
  constructor(children: Array<AST>, spaces: Array<string>) {
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
  pretty() {
    return this._pretty(0);
  }
  _pretty(indent: number) {
    const spaces = Array(this.children.length + 1).fill(" ");
    spaces[0] = "";
    spaces[this.children.length] = "";
    return new List(this.children.map(x => x._pretty(indent)), spaces);
  }
}

class IList implements AST {
  type = "IList";
  children: Array<AST>;
  indent: number;
  extraSpaces: Array<string>;
  constructor(
    children: Array<AST>,
    indent: number,
    extraSpaces: Array<string>
  ) {
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
  pretty() {
    return this._pretty(0);
  }
  _pretty(indent: number) {
    const children = this.children.map(x => x._pretty(indent + 2));
    const newIndent = indent + 2;
    const extraSpaces = Array(this.extraSpaces.length).fill("");
    return new IList(children, newIndent, extraSpaces);
  }
}

class NumLit implements AST {
  type = "NumLit";
  data: number;
  constructor(data: number) {
    this.data = data;
  }
  print() {
    return `${this.data}`;
  }
  pretty() {
    return this._pretty(0);
  }
  _pretty(indent: number) {
    return new NumLit(this.data);
  }
}

type State = {
  text: string,
  indents: Array<number>
};

export class Ctx {
  state: State;
  constructor(state: State) {
    this.state = state;
  }
  getText(): string {
    return this.state.text;
  }
  setText(next: string): void {
    this.state.text = next;
  }
  getIndents(): Array<number> {
    return this.state.indents;
  }
  setIndents(next: Array<number>): void {
    this.state.indents = next;
  }
  run<A>(parser: Parser<A>): A {
    return parser(this);
  }
}

type Parser<A> = Ctx => A;

class ParseError extends Error {}

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

export const constant = (substring: string): Parser<string> => ctx => {
  const text = ctx.getText();
  const i = text.indexOf(substring);
  if (i != 0) {
    throw new ParseError(
      `could not find constant ${JSON.stringify(substring)}`
    );
  }
  ctx.setText(text.substring(i + substring.length));
  return substring;
};

export function alternate<O>(options: Array<Parser<O>>): Parser<O> {
  return ctx => {
    for (const f of options) {
      const text = ctx.getText();
      const indents = ctx.getIndents();
      try {
        return f(ctx);
      } catch (e) {
        ctx.setText(text);
        ctx.setIndents(indents);
      }
    }
    throw new ParseError("alternation failed");
  };
}

export function parse(input: string): AST {
  const ctx = new Ctx({ text: input, indents: [0] });
  return parseTerm0(ctx);
}

const regExp = (r: RegExp): Parser<string> => ctx => {
  const text = ctx.getText();
  const match = text.match(r);
  if (!match) {
    throw new Error("no match");
  }
  ctx.setText(text.substring(match[0].length));
  return match[0];
};

const withDefault = function<A>(parser: Parser<A>, def: A): Parser<A> {
  return alternate([parser, () => def]);
};

const getSpaces: Parser<string> = regExp(/^\ +/);
const getNewline: Parser<string> = constant("\n");

const maybe = function<A>(parser: Parser<A>): Parser<?A> {
  return alternate([ctx => parser(ctx), () => undefined]);
};
const whitespace: Parser<string> = regExp(/^\s+/);
const optionalWhitespace: Parser<string> = withDefault(whitespace, "");

const headIndent: Parser<number> = ctx => {
  const indents = ctx.getIndents();
  return indents[indents.length - 1];
};

const pushIndent = (numSpaces: number): Parser<void> => ctx => {
  const indents = ctx.getIndents();
  ctx.setIndents([...indents, numSpaces]);
};

const popIndent: Parser<void> = ctx => {
  const indents = ctx.getIndents();
  const newIndents = [...indents];
  newIndents.pop();
  ctx.setIndents(newIndents);
};

const increasedIndentationNewline: Parser<{
  extraSpace: string,
  indent: number
}> = ctx => {
  const currentIndent = ctx.run(headIndent);
  ctx.run(maybe(getSpaces));
  ctx.run(getNewline);
  const extraSpace = ctx.run(withDefault(regExp(/^\s*\n+/), ""));
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
  const extraSpace = ctx.run(withDefault(regExp(/^\s*\n+/), ""));
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
  return new IList([term, ...children], indent, extraSpaces);
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
  const { children, spaces } = ctx.run(
    parseListAux({ children: [], spaces: [] })
  );
  return new List(children, spaces);
};

function parseListAux({
  children,
  spaces
}: {
  children: Array<AST>,
  spaces: Array<string>
}): Parser<{ children: Array<AST>, spaces: Array<string> }> {
  return ctx => {
    const space = ctx.run(optionalWhitespace);
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
}

const parseTerm1: Parser<AST> = alternate([parseList, parseName, parseNumLit]);
const parseTerm0: Parser<AST> = alternate([parseIList, parseTerm1]);
