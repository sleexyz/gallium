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
  headIndent,
  pushIndent,
  popIndent
} from "./parser_combinators";

import * as AST from "./AST";
export { ParseContext } from "./parser_combinators.js";

const multilineWhitespaceOrComment: Parser<string> = regExp(/^(\s|(#.*))*\n/);

const singlelineWhitespaceOrComment: Parser<string> = regExp(/^(\ |(#.*))*/);

export const parseName: Parser<AST.Base> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^[a-zA-Z][a-zA-Z0-9]*/);
  if (!match) {
    throw new ParseError("not a name");
  }
  const name = match[0];
  ctx.setText(text.substring(name.length));
  return new AST.Name(name, {});
};

export const parseNumLit: Parser<AST.Base> = ctx => {
  const text = ctx.getText();
  const match = text.match(/^(\d+\.?\d*|\.\d+)/);
  if (!match) {
    throw new ParseError("not a number");
  }
  const numString = match[0];
  ctx.setText(text.substring(numString.length));
  return new AST.NumLit(parseFloat(numString), {});
};

const increasedIndentationNewline: Parser<{
  extraSpaces: Array<string>,
  indent: number
}> = ctx => {
  const currentIndent = ctx.run(headIndent);
  const extraSpaces = [];
  extraSpaces.push(ctx.run(singlelineWhitespaceOrComment));
  ctx.run(getNewline);
  extraSpaces.push(ctx.run(withFallback(multilineWhitespaceOrComment, "")));
  const numSpaces = ctx.run(getSpaces).length;
  if (numSpaces > currentIndent) {
    ctx.run(pushIndent(numSpaces));
    return { extraSpaces, indent: numSpaces };
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
  const extraSpace = ctx.run(withFallback(multilineWhitespaceOrComment, ""));
  const numSpaces = ctx.run(withFallback(getSpaces, "")).length;
  if (numSpaces === currentIndent) {
    return { extraSpace, indent: numSpaces };
  }
  throw new Error("not same indentation");
};

export const parseVApp: Parser<AST.Base> = ctx => {
  const term = ctx.run(parseTerm1);
  const { extraSpaces: extraSpaces0, indent } = ctx.run(increasedIndentationNewline);
  const child = ctx.run(parseTerm0);
  const { children, extraSpaces: extraSpaces1 } = ctx.run(
    parseVAppAux({ children: [child], extraSpaces: [...extraSpaces0] })
  );
  return new AST.VApp([term, ...children], extraSpaces1, indent, {});
};

function parseVAppAux({
  children,
  extraSpaces
}: {
  children: Array<AST.Base>,
  extraSpaces: Array<string>
}): Parser<{ children: Array<AST.Base>, extraSpaces: Array<string> }> {
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

export const parseParen: Parser<AST.Base> = ctx => {
  ctx.run(constant("("));
  const space1 = ctx.run(withFallback(getSpaces, ""));
  const child = ctx.run(parseTerm1);
  const space2 = ctx.run(withFallback(getSpaces, ""));
  ctx.run(constant(")"));
  return new AST.Paren([child], [space1, space2], {});
};

export const parseHApp: Parser<AST.Base> = ctx => {
  const child1 = ctx.run(parseTerm2);
  const space = ctx.run(withFallback(getSpaces, ""));
  const child2 = ctx.run(parseTerm2);
  const { children, spaces } = ctx.run(
    parseHAppAux({ children: [child1, child2], spaces: [space] })
  );
  return new AST.HApp(children, spaces, {});
};

const parseHAppAux = ({
  children,
  spaces
}: {
  children: Array<AST.Base>,
  spaces: Array<string>
}): Parser<{ children: Array<AST.Base>, spaces: Array<string> }> => ctx => {
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

const parseTerm2: Parser<AST.Base> = alternate([
  parseParen,
  parseName,
  parseNumLit
]);

const parseTerm1: Parser<AST.Base> = alternate([parseHApp, parseTerm2]);

const parseTerm0: Parser<AST.Base> = alternate([parseVApp, parseTerm1]);

export function parse(input: string): AST.Base {
  const ctx = new ParseContext({ text: input, indents: [0] });
  const ret = parseTerm0(ctx);
  ctx.run(maybe(multilineWhitespaceOrComment));
  if (ctx.getText().length !== 0) {
    throw new Error("Parse error");
  }
  return ret;
}

const parseTopLevelExpr: Parser<AST.Base> = ctx => {
  const term = new AST.Name("do", {});
  const extraSpace = ctx.run(withFallback(multilineWhitespaceOrComment, ""));
  const child = ctx.run(parseTerm0);
  const { children, extraSpaces } = ctx.run(
    parseVAppAux({ children: [child], extraSpaces: [extraSpace] })
  );
  return new AST.VApp([term, ...children], extraSpaces, 0, {});
};

export function parseTopLevel(input: string): AST.Base {
  const ctx = new ParseContext({ text: input, indents: [0] });
  const ret = parseTopLevelExpr(ctx);
  ctx.run(maybe(multilineWhitespaceOrComment));
  if (ctx.getText().length !== 0) {
    throw new Error("Parse error");
  }
  return ret;
}
