// @flow
import {
  ParseContext,
  parse,
  parseName,
  parseNumLit,
  parseList,
  parseIList
} from "./parser";

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

  it("fails on whitespace", () => {
    const input = new ParseContext({ text: "  100 asdf", indents: [0] });
    expect(() => parseNumLit(input)).toThrow("not a number");
  });
});

describe("parseList", () => {
  it("parses lists", () => {
    const ctx = new ParseContext({
      text: `(foo 1 2 1)`,
      indents: [0]
    });
    const result = parseList(ctx);
    expect(result).toEqual({
      type: "List",
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
    const result = parseList(ctx);
    expect(result).toEqual({
      type: "List",
      spaces: ["", ""],
      children: [{ type: "Name", value: "foo" }]
    });
  });

  it("fails to parse nullary lists", () => {
    const ctx = new ParseContext({ text: `()`, indents: [0] });
    expect(() => parseList(ctx)).toThrow("alternation failed");
  });
});

describe("parseIList", () => {
  it("parses indentation-based lists", () => {
    const text = `foo
  1
  2`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
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
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: [""],
      children: [{ type: "Name", value: "foo" }, { type: "Name", value: "bar" }]
    });
  });

  it("parses indentation-based lists with one child, with an extra new line", () => {
    const text = `foo

  bar`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: ["\n"],
      children: [{ type: "Name", value: "foo" }, { type: "Name", value: "bar" }]
    });
  });

  it("parses indentation-based lists with one child, with two extra new lines", () => {
    const text = `foo


  bar`;
    const ctx = new ParseContext({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
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
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", value: "foo" },
        {
          type: "IList",
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
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", value: "foo" },
        {
          type: "IList",
          indent: 4,
          extraSpaces: [""],
          children: [
            { type: "Name", value: "bar" },
            {
              type: "IList",
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
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 4,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", value: "foo" },
        {
          type: "IList",
          indent: 5,
          extraSpaces: [""],
          children: [
            { type: "Name", value: "bar" },
            {
              type: "IList",
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
