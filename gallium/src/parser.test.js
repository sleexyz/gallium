// @flow
import {
  ParseContext,
  parseTopLevel,
  parse,
  parseName,
  parseNumLit,
  parseParen,
  parseHApp,
  parseVApp
} from "./parser";

describe("parseTopLevel", () => {
  it("can parse expressions", () => {
    const result = parseTopLevel("foo");
    expect(result).toEqual({
      type: "VApp",
      payload: {},
      children: [
        { type: "Name", payload: {}, value: "do" },
        { type: "Name", payload: {}, value: "foo" }
      ],
      extraSpaces: [""],
      indent: 0
    });
  });

  it("is robust to surrounding whitespace", () => {
    const result = parseTopLevel(`
foo

`);
    expect(result).toEqual({
      type: "VApp",
      payload: {},
      children: [
        { type: "Name", payload: {}, value: "do" },
        { type: "Name", payload: {}, value: "foo" }
      ],
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
      type: "VApp",
      payload: {},
      children: [
        { type: "Name", payload: {}, value: "do" },
        { type: "Name", payload: {}, value: "foo" },
        { type: "Name", payload: {}, value: "bar" },
        { type: "Name", payload: {}, value: "baz" }
      ],
      extraSpaces: ["\n\n", "\n", ""],
      indent: 0
    });
  });
});

describe("parse", () => {
  it("parses 0", () => {
    const result = parse("0");
    expect(result).toMatchSnapshot();
  });

  it("parses decimals", () => {
    const result = parse("0.5");
    expect(result).toMatchSnapshot();
  });

  it("parses VApp's", () => {
    const result = parse(`compose
  note 1
`);
    expect(result).toMatchSnapshot();
  });

  it("parses multiple levels of parens", () => {
    const result = parse("( ( 1 ) )");
    expect(result).toMatchSnapshot();
  });
});

describe("parseName", () => {
  it("parses names", () => {
    const ctx = new ParseContext({ text: "foo 1", payload: {}, indents: [0] });
    const result = parseName(ctx);
    expect(result).toEqual({ type: "Name", payload: {}, value: "foo" });
  });

  it("fails on whitespace", () => {
    const ctx = new ParseContext({
      text: "   foo 1",
      payload: {},
      indents: [0]
    });
    expect(() => parseName(ctx)).toThrow("not a name");
  });
});

describe("parseNumLit", () => {
  it("parses numeric literals", () => {
    const ctx = new ParseContext({ text: "100 asdf", indents: [0] });
    const result = parseNumLit(ctx);
    expect(result).toEqual({ type: "NumLit", payload: {}, value: 100 });
  });

  it("parses decimal literals", () => {
    const ctx = new ParseContext({ text: "0.5", indents: [0] });
    const result = parseNumLit(ctx);
    expect(result).toEqual({ type: "NumLit", payload: {}, value: 0.5 });
  });

  it("fails on whitespace", () => {
    const input = new ParseContext({
      text: "  100 asdf",
      payload: {},
      indents: [0]
    });
    expect(() => parseNumLit(input)).toThrow("not a number");
  });
});

describe("parseParen", () => {
  it("parses with application inside", () => {
    const ctx = new ParseContext({
      text: `(foo 1 2 1)`,
      indents: [0]
    });
    const result = parseParen(ctx);
    expect(result).toMatchSnapshot();
  });

  it("parses unary lists", () => {
    const ctx = new ParseContext({ text: `(foo)`, indents: [0] });
    const result = parseParen(ctx);
    expect(result).toMatchSnapshot();
  });
});

describe("parseHApp", () => {
  it("parses lists", () => {
    const ctx = new ParseContext({
      text: `foo 1 2 1`,
      indents: [0]
    });
    const result = parseHApp(ctx);
    expect(result).toEqual({
      type: "HApp",
      spaces: [" ", " ", " "],
      payload: {},
      children: [
        { type: "Name", payload: {}, value: "foo" },
        { type: "NumLit", payload: {}, value: 1 },
        { type: "NumLit", payload: {}, value: 2 },
        { type: "NumLit", payload: {}, value: 1 }
      ]
    });
  });
});

describe("parseVApp", () => {
  it("parses indentation-based lists", () => {
    const text = `foo
  1
  2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseVApp(ctx);
    expect(result).toEqual({
      type: "VApp",
      indent: 2,
      extraSpaces: ["", ""],
      payload: {},
      children: [
        { type: "Name", payload: {}, value: "foo" },
        { type: "NumLit", payload: {}, value: 1 },
        { type: "NumLit", payload: {}, value: 2 }
      ]
    });
  });
  it("parses indentation-based lists with one child", () => {
    const text = `foo
  bar`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseVApp(ctx);
    expect(result).toMatchSnapshot();
  });

  it("parses indentation-based lists with one child, with an extra new line", () => {
    const text = `foo

  bar`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseVApp(ctx);
    expect(result).toMatchSnapshot();
  });

  it("parses indentation-based lists with one child, with two extra new lines", () => {
    const text = `foo


  bar`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseVApp(ctx);
    expect(result).toMatchSnapshot();
  });

  it("parses nested indentation-based lists", () => {
    const text = `foo
  bar
    baz
    1
  2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseVApp(ctx);
    expect(result).toMatchSnapshot();
  });

  it("parses super nested indentation-based lists", () => {
    const text = `foo
  bar
    baz
      1
  2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseVApp(ctx);
    expect(result).toMatchSnapshot();
  });

  it("parses super nested indentation-based lists, with weird indentation", () => {
    const text = `foo
    bar
     baz
          1
          2
    2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseVApp(ctx);
    expect(result).toMatchSnapshot();
  });
});
