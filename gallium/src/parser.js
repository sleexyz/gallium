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

import { type AST, Paren, Name, NumLit, HApp, VApp } from "./AST";

export { ParseContext } from "./parser_combinators.js";

export const parseName: Parser<AST> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^[a-zA-Z]+/);
  if (!match) {
    throw new ParseError("not a name");
  }
  const name = match[0];
  ctx.setText(text.substring(name.length));
  return new Name(name, {});
};

export const parseNumLit: Parser<AST> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^(\d+\.?\d*|\.\d+)/);
  if (!match) {
    throw new ParseError("not a number");
  }
  const numString = match[0];
  ctx.setText(text.substring(numString.length));
  return new NumLit(parseFloat(numString), {});
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
  const numSpaces = ctx.run(withFallback(getSpaces, "")).length;
  if (numSpaces === currentIndent) {
    return { extraSpace, indent: numSpaces };
  }
  throw new Error("not same indentation");
};

export const parseVApp: Parser<AST> = ctx => {
  const term = ctx.run(parseTerm1);
  const { extraSpace, indent } = ctx.run(increasedIndentationNewline);
  const child = ctx.run(parseTerm0);
  const { children, extraSpaces } = ctx.run(
    parseVAppAux({ children: [child], extraSpaces: [extraSpace] })
  );
  return new VApp([term, ...children], extraSpaces, indent, {});
};

function parseVAppAux({
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
        parseVAppAux({
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

export const parseParen: Parser<AST> = ctx => {
  ctx.run(constant("("));
  const space1 = ctx.run(withFallback(getSpaces, ""));
  const child = ctx.run(parseTerm1);
  const space2 = ctx.run(withFallback(getSpaces, ""));
  ctx.run(constant(")"));
  return new Paren([child], [space1, space2], {});
};

export const parseHApp: Parser<AST> = ctx => {
  const child1 = ctx.run(parseTerm2);
  const space = ctx.run(withFallback(getSpaces, ""));
  const child2 = ctx.run(parseTerm2);
  const { children, spaces } = ctx.run(
    parseHAppAux({ children: [child1, child2], spaces: [space] })
  );
  return new HApp(children, spaces, {});
};

const parseHAppAux = ({
  children,
  spaces
}: {
  children: Array<AST>,
  spaces: Array<string>
}): Parser<{ children: Array<AST>, spaces: Array<string> }> => ctx => {
  return ctx.run(
    alternate([
      ctx => {
        const space = ctx.run(withFallback(getSpaces, ""));
        const child = ctx.run(parseTerm2);
        return ctx.run(
          parseHAppAux({
            children: [...children, child],
            spaces: [...spaces, space]
          })
        );
      },
      ctx => {
        return { children, spaces };
      }
    ])
  );
};

const parseTerm2: Parser<AST> = alternate([parseParen, parseName, parseNumLit]);

const parseTerm1: Parser<AST> = alternate([parseHApp, parseTerm2]);

const parseTerm0: Parser<AST> = alternate([parseVApp, parseTerm1]);

export function parse(input: string): AST {
  const ctx = new ParseContext({ text: input, indents: [0] });
  return parseTerm0(ctx);
}

const parseTopLevelExpr: Parser<AST> = ctx => {
  const term = new Name("do", {});
  const extraSpace = ctx.run(withFallback(regExp(/^\s*\n+/), ""));
  const child = ctx.run(parseTerm0);
  const { children, extraSpaces } = ctx.run(
    parseVAppAux({ children: [child], extraSpaces: [extraSpace] })
  );
  return new VApp([term, ...children], extraSpaces, 0, {});
};

export function parseTopLevel(input: string): AST {
  const ctx = new ParseContext({ text: input, indents: [0] });
  return parseTopLevelExpr(ctx);
}
