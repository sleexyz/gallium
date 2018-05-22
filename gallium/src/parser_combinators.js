// @flow

export type ParseState = {
  text: string,
  indents: Array<number>
};

export class ParseContext {
  state: ParseState;
  constructor(state: ParseState) {
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

export type Parser<A> = ParseContext => A;

export class ParseError extends Error {}

export const constant = (str: string): Parser<string> => ctx => {
  const text = ctx.getText();
  const i = text.indexOf(str);
  if (i != 0) {
    throw new ParseError(`could not find constant ${JSON.stringify(str)}`);
  }
  ctx.setText(text.substring(i + str.length));
  return str;
};

export function alternate<O>(options: Array<Parser<O>>): Parser<O> {
  return ctx => {
    for (const parser of options) {
      const text = ctx.getText();
      const indents = ctx.getIndents();
      try {
        return parser(ctx);
      } catch (e) {
        ctx.setText(text);
        ctx.setIndents(indents);
      }
    }
    throw new ParseError("alternation failed");
  };
}

export const regExp = (r: RegExp): Parser<string> => ctx => {
  const text = ctx.getText();
  const match = text.match(r);
  if (!match) {
    throw new Error("no match");
  }
  ctx.setText(text.substring(match[0].length));
  return match[0];
};

export const withFallback = function<A>(parser: Parser<A>, def: A): Parser<A> {
  return alternate([parser, () => def]);
};

export const getSpaces: Parser<string> = regExp(/^\ +/);

export const getNewline: Parser<string> = constant("\n");

export const maybe = function<A>(parser: Parser<A>): Parser<?A> {
  return alternate([ctx => parser(ctx), () => undefined]);
};

export const headIndent: Parser<number> = ctx => {
  const indents = ctx.getIndents();
  return indents[indents.length - 1];
};

export const pushIndent = (numSpaces: number): Parser<void> => ctx => {
  const indents = ctx.getIndents();
  ctx.setIndents([...indents, numSpaces]);
};

export const popIndent: Parser<void> = ctx => {
  const indents = ctx.getIndents();
  const newIndents = [...indents];
  newIndents.pop();
  ctx.setIndents(newIndents);
};
