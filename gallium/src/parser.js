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

import { type AST, Name, NumLit, IExp, SExp } from "./AST";

export { ParseContext } from "./parser_combinators.js";

export const parseName: Parser<AST> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^[a-zA-Z]+/);
  if (!match) {
    throw new ParseError("not a name");
  }
  const name = match[0];
  ctx.setText(text.substring(name.length));
  return new Name(name, undefined);
};

export const parseNumLit: Parser<AST> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^[0-9]+/);
  if (!match) {
    throw new ParseError("not a number");
  }
  const numString = match[0];
  ctx.setText(text.substring(numString.length));
  return new NumLit(parseInt(numString), undefined);
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

export const parseIExp: Parser<AST> = ctx => {
  const term = ctx.run(parseTerm1);
  const { extraSpace, indent } = ctx.run(increasedIndentationNewline);
  const child = ctx.run(parseTerm0);
  const { children, extraSpaces } = ctx.run(
    parseIExpAux({ children: [child], extraSpaces: [extraSpace] })
  );
  return new IExp([term, ...children], extraSpaces, indent, undefined);
};

function parseIExpAux({
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
        parseIExpAux({
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

export const parseSExp: Parser<AST> = ctx => {
  ctx.run(constant("("));
  const space = ctx.run(withFallback(whitespace, ""));
  const child = ctx.run(parseTerm0);
  const { children, spaces } = ctx.run(
    parseSExpAux({ children: [child], spaces: [space] })
  );
  return new SExp(children, spaces, undefined);
};

const parseSExpAux = ({
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
          parseSExpAux({
            children: [...children, child],
            spaces: [...spaces, space]
          })
        );
      }
    ])
  );
};

const parseTerm1: Parser<AST> = alternate([parseSExp, parseName, parseNumLit]);

const parseTerm0: Parser<AST> = alternate([parseIExp, parseTerm1]);

export function parse(input: string): AST {
  const ctx = new ParseContext({ text: input, indents: [0] });
  return parseTerm0(ctx);
}
