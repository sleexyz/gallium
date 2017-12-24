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

import { type AST, Name, NumLit, OpenSExpr, IExpr, SExpr } from "./AST";

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
  const match = text.match(/^(\d+\.?\d*|\.\d+)/);
  if (!match) {
    throw new ParseError("not a number");
  }
  const numString = match[0];
  ctx.setText(text.substring(numString.length));
  return new NumLit(parseFloat(numString), undefined);
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

export const parseIExpr: Parser<AST> = ctx => {
  const term = ctx.run(parseTerm1);
  const { extraSpace, indent } = ctx.run(increasedIndentationNewline);
  const child = ctx.run(parseTerm0);
  const { children, extraSpaces } = ctx.run(
    parseIExprAux({ children: [child], extraSpaces: [extraSpace] })
  );
  return new IExpr([term, ...children], extraSpaces, indent, undefined);
};

function parseIExprAux({
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
        parseIExprAux({
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

export const parseOpenSExpr: Parser<AST> = ctx => {
  const child1 = ctx.run(parseTerm2);
  const space = ctx.run(withFallback(getSpaces, ""));
  const child2 = ctx.run(parseTerm2);
  const { children, spaces } = ctx.run(
    parseOpenSExprAux({ children: [child1, child2], spaces: [space] })
  );
  return new OpenSExpr(children, spaces, undefined);
};

const parseOpenSExprAux = ({
  children,
  spaces
}: {
  children: Array<AST>,
  spaces: Array<string>
}): Parser<{ children: Array<AST>, spaces: Array<string> }> => ctx => {
  const space = ctx.run(withFallback(getSpaces, ""));
  return ctx.run(
    alternate([
      ctx => {
        const child = ctx.run(parseTerm2);
        return ctx.run(
          parseOpenSExprAux({
            children: [...children, child],
            spaces: [...spaces, space]
          })
        );
      },
      ctx => {
        return { children, spaces: [...spaces, space] };
      }
    ])
  );
};
export const parseSExpr: Parser<AST> = ctx => {
  ctx.run(constant("("));
  const space = ctx.run(withFallback(whitespace, ""));
  const child = ctx.run(parseTerm2);
  const { children, spaces } = ctx.run(
    parseSExprAux({ children: [child], spaces: [space] })
  );
  return new SExpr(children, spaces, undefined);
};

const parseSExprAux = ({
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
        const child = ctx.run(parseTerm2);
        return ctx.run(
          parseSExprAux({
            children: [...children, child],
            spaces: [...spaces, space]
          })
        );
      }
    ])
  );
};

const parseTerm2: Parser<AST> = alternate([parseSExpr, parseName, parseNumLit]);

const parseTerm1: Parser<AST> = alternate([parseOpenSExpr, parseTerm2]);

const parseTerm0: Parser<AST> = alternate([parseIExpr, parseTerm1]);

export function parse(input: string): AST {
  const ctx = new ParseContext({ text: input, indents: [0] });
  return parseTerm0(ctx);
}

const parseTopLevelExpr: Parser<AST> = ctx => {
  const term = new Name("do", undefined);
  const extraSpace = ctx.run(withFallback(regExp(/^\s*\n+/), ""));
  const child = ctx.run(parseTerm0);
  const { children, extraSpaces } = ctx.run(
    parseIExprAux({ children: [child], extraSpaces: [extraSpace] })
  );
  return new IExpr([term, ...children], extraSpaces, 0, undefined);
};

export function parseTopLevel(input: string): AST {
  const ctx = new ParseContext({ text: input, indents: [0] });
  return parseTopLevelExpr(ctx);
}
