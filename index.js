// @flow

interface AST {
  type: string;
  children?: Array<AST>;
  print(): string;
  pretty(): AST;
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
    const spaces = Array(this.children.length + 1).fill(" ");
    spaces[0] = "";
    spaces[this.children.length] = "";
    return new List(this.children.map(x => x.pretty()), spaces);
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
    return new NumLit(this.data);
  }
}

type State = {
  text: string,
  indent: number
};

export class Ctx {
  state: State;
  constructor(state: State) {
    this.state = state;
  }
  getText(): string{
    return this.state.text;
  }
  setText(next: string): void{
    this.state.text = next;
  }
  getIndent(): number{
    return this.state.indent;
  }
  setIndent(next: number): void{
    this.state.indent = next;
  }
  run<B>(parser: Parser<B>): B {
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

export const constant = (substring: string): Parser<void> => ctx => {
  const text = ctx.getText();
  const i = text.indexOf(substring);
  if (i != 0) {
    throw new ParseError("could not find constant");
  }
  ctx.setText(text.substring(i + substring.length));
  return;
};

export function alternate<O>(options: Array<Parser<O>>): Parser<O> {
  return ctx => {
    for (const f of options) {
      const text = ctx.getText();
      const indent = ctx.getIndent();
      try {
        return f(ctx);
      } catch (e) {
        ctx.setText(text);
        ctx.setIndent(indent);
      }
    }
    throw new ParseError("alternation failed");
  };
}



export function parse(input: string): AST {
  const ctx = new Ctx({ text: input, indent: 0 });
  return parseTerm0(ctx);
}

const optionalWhitespace: Parser<string> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^\s*/);
  if (!match) {
    return "";
  }
  ctx.setText(text.substring(match[0].length));
  return match[0];
};

export const parseList: Parser<AST> = ctx => {
  ctx.run(constant("("));
  const { children, spaces } = ctx.run(parseListAux({ children: [], spaces: [] }));
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
    return ctx.run(alternate([
      ctx => {
        ctx.run(constant(")"));
        return { children, spaces: [...spaces, space] };
      },
      ctx => {
        const child = ctx.run(parseTerm0);
        return ctx.run(parseListAux({
          children: [...children, child],
          spaces: [...spaces, space]
        }));
      }
    ]))
  }
}

const parseTerm1: Parser<AST> = alternate([parseList, parseName, parseNumLit]);
const parseTerm0: Parser<AST> = alternate([parseTerm1]);
