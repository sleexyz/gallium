// @flow
import {
  ParseContext,
  parseTopLevel,
  parse,
  parseName,
  parseNumLit,
  parseSExpr,
  parseOpenSExpr,
  parseIExpr
} from "./parser";

describe("parseTopLevel", () => {
  it("can parse expressions", () => {
    const result = parseTopLevel("foo");
    expect(result).toEqual({
      type: "IExpr",
      children: [{ type: "Name", value: "do" }, { type: "Name", value: "foo" }],
      extraSpaces: [""],
      indent: 0
    });
  });

  it("is robust to surrounding whitespace", () => {
    const result = parseTopLevel(`
foo

`);
    expect(result).toEqual({
      type: "IExpr",
      children: [{ type: "Name", value: "do" }, { type: "Name", value: "foo" }],
      extraSpaces: ["\n"],
      indent: 0
    });
  });

  it("accepts multiple lines", () => {
    const result = parseTopLevel(`

foo

bar
baz


`);
    expect(result).toEqual({
      type: "IExpr",
      children: [
        { type: "Name", value: "do" },
        { type: "Name", value: "foo" },
        { type: "Name", value: "bar" },
        { type: "Name", value: "baz" }
      ],
      extraSpaces: ["\n\n", "\n", ""],
      indent: 0
    });
  });
});

describe("parse", () => {
  it("parses 0", () => {
    const result = parse("0");
    expect(result).toEqual({ type: "NumLit", value: 0 });
  });

  it("parses decimals", () => {
    const result = parse("0.5");
    expect(result).toEqual({ type: "NumLit", value: 0.5 });
  });

  it("parses openSExprs", () => {
    const result = parse(`compose
  note 1
`);
    expect((result: any).children[1]).toEqual({
      type: "OpenSExpr",
      children: [{ type: "Name", value: "note" }, { type: "NumLit", value: 1 }],
      spaces: [" ", ""]
    });
  });
});

describe("parseName", () => {
  it("parses names", () => {
    const ctx = new ParseContext({ text: "foo 1", indents: [0] });
    const result = parseName(ctx);
    expect(result).toEqual({
      type: "Name",
      value: "foo"
    });
  });

  it("fails on whitespace", () => {
    const ctx = new ParseContext({ text: "   foo 1", indents: [0] });
    expect(() => parseName(ctx)).toThrow("not a name");
  });
});

describe("parseNumLit", () => {
  it("parses numeric literals", () => {
    const ctx = new ParseContext({ text: "100 asdf", indents: [0] });
    const result = parseNumLit(ctx);
    expect(result).toEqual({ type: "NumLit", value: 100 });
  });

  it("parses decimal literals", () => {
    const ctx = new ParseContext({ text: "0.5", indents: [0] });
    const result = parseNumLit(ctx);
    expect(result).toEqual({ type: "NumLit", value: 0.5 });
  });

  it("fails on whitespace", () => {
    const input = new ParseContext({ text: "  100 asdf", indents: [0] });
    expect(() => parseNumLit(input)).toThrow("not a number");
  });
});

describe("parseSExpr", () => {
  it("parses lists", () => {
    const ctx = new ParseContext({
      text: `(foo 1 2 1)`,
      indents: [0]
    });
    const result = parseSExpr(ctx);
    expect(result).toEqual({
      type: "SExpr",
      spaces: ["", " ", " ", " ", ""],
      children: [
        { type: "Name", value: "foo" },
        { type: "NumLit", value: 1 },
        { type: "NumLit", value: 2 },
        { type: "NumLit", value: 1 }
      ]
    });
  });

  it("parses unary lists", () => {
    const ctx = new ParseContext({ text: `(foo)`, indents: [0] });
    const result = parseSExpr(ctx);
    expect(result).toEqual({
      type: "SExpr",
      spaces: ["", ""],
      children: [{ type: "Name", value: "foo" }]
    });
  });
});

describe("parseOpenSExpr", () => {
  it("parses lists", () => {
    const ctx = new ParseContext({
      text: `foo 1 2 1`,
      indents: [0]
    });
    const result = parseOpenSExpr(ctx);
    expect(result).toEqual({
      type: "OpenSExpr",
      spaces: [" ", " ", " ", ""],
      children: [
        { type: "Name", value: "foo" },
        { type: "NumLit", value: 1 },
        { type: "NumLit", value: 2 },
        { type: "NumLit", value: 1 }
      ]
    });
  });
});

describe("parseIExpr", () => {
  it("parses indentation-based lists", () => {
    const text = `foo
  1
  2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIExpr(ctx);
    expect(result).toEqual({
      type: "IExpr",
      indent: 2,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", value: "foo" },
        { type: "NumLit", value: 1 },
        { type: "NumLit", value: 2 }
      ]
    });
  });
  it("parses indentation-based lists with one child", () => {
    const text = `foo
  bar`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIExpr(ctx);
    expect(result).toEqual({
      type: "IExpr",
      indent: 2,
      extraSpaces: [""],
      children: [{ type: "Name", value: "foo" }, { type: "Name", value: "bar" }]
    });
  });

  it("parses indentation-based lists with one child, with an extra new line", () => {
    const text = `foo

  bar`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIExpr(ctx);
    expect(result).toEqual({
      type: "IExpr",
      indent: 2,
      extraSpaces: ["\n"],
      children: [{ type: "Name", value: "foo" }, { type: "Name", value: "bar" }]
    });
  });

  it("parses indentation-based lists with one child, with two extra new lines", () => {
    const text = `foo


  bar`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIExpr(ctx);
    expect(result).toEqual({
      type: "IExpr",
      indent: 2,
      extraSpaces: ["\n\n"],
      children: [{ type: "Name", value: "foo" }, { type: "Name", value: "bar" }]
    });
  });

  it("parses nested indentation-based lists", () => {
    const text = `foo
  bar
    baz
    1
  2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIExpr(ctx);
    expect(result).toEqual({
      type: "IExpr",
      indent: 2,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", value: "foo" },
        {
          type: "IExpr",
          indent: 4,
          extraSpaces: ["", ""],
          children: [
            { type: "Name", value: "bar" },
            { type: "Name", value: "baz" },
            { type: "NumLit", value: 1 }
          ]
        },
        { type: "NumLit", value: 2 }
      ]
    });
  });

  it("parses super nested indentation-based lists", () => {
    const text = `foo
  bar
    baz
      1
  2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIExpr(ctx);
    expect(result).toEqual({
      type: "IExpr",
      indent: 2,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", value: "foo" },
        {
          type: "IExpr",
          indent: 4,
          extraSpaces: [""],
          children: [
            { type: "Name", value: "bar" },
            {
              type: "IExpr",
              indent: 6,
              extraSpaces: [""],
              children: [
                { type: "Name", value: "baz" },
                { type: "NumLit", value: 1 }
              ]
            }
          ]
        },
        { type: "NumLit", value: 2 }
      ]
    });
  });
  it("parses super nested indentation-based lists, with weird indentation", () => {
    const text = `foo
    bar
     baz
          1
          2
    2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIExpr(ctx);
    expect(result).toEqual({
      type: "IExpr",
      indent: 4,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", value: "foo" },
        {
          type: "IExpr",
          indent: 5,
          extraSpaces: [""],
          children: [
            { type: "Name", value: "bar" },
            {
              type: "IExpr",
              indent: 10,
              extraSpaces: ["", ""],
              children: [
                { type: "Name", value: "baz" },
                { type: "NumLit", value: 1 },
                { type: "NumLit", value: 2 }
              ]
            }
          ]
        },
        { type: "NumLit", value: 2 }
      ]
    });
  });
});
