// @flow
import { Ctx, parse, parseName, parseNumLit, parseList, parseIList } from "./";

describe("parseName", () => {
  it("parses names", () => {
    const ctx = new Ctx({ text: "foo 1", indents: [0] });
    const result = parseName(ctx);
    expect(result).toEqual({
      type: "Name",
      data: "foo"
    });
  });

  it("fails on whitespace", () => {
    const ctx = new Ctx({ text: "   foo 1", indents: [0] });
    expect(() => parseName(ctx)).toThrow("not a name");
  });
});

describe("parseNumLit", () => {
  it("parses numeric literals", () => {
    const ctx = new Ctx({ text: "100 asdf", indents: [0] });
    const result = parseNumLit(ctx);
    expect(result).toEqual({ type: "NumLit", data: 100 });
  });

  it("fails on whitespace", () => {
    const input = new Ctx({ text: "  100 asdf", indents: [0] });
    expect(() => parseNumLit(input)).toThrow("not a number");
  });
});

describe("parseList", () => {
  it("parses lists", () => {
    const ctx = new Ctx({ text: `(foo 1 2 1)`, indents: [0] });
    const result = parseList(ctx);
    expect(result).toEqual({
      type: "List",
      spaces: ["", " ", " ", " ", ""],
      children: [
        { type: "Name", data: "foo" },
        { type: "NumLit", data: 1 },
        { type: "NumLit", data: 2 },
        { type: "NumLit", data: 1 }
      ]
    });
  });
});

describe("parseIList", () => {
  it("parses indentation-based lists", () => {
    const text = `foo
  1
  2`;
    const ctx = new Ctx({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", data: "foo" },
        { type: "NumLit", data: 1 },
        { type: "NumLit", data: 2 }
      ]
    });
  });
  it("parses indentation-based lists with one child", () => {
    const text = `foo
  bar`;
    const ctx = new Ctx({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: [""],
      children: [{ type: "Name", data: "foo" }, { type: "Name", data: "bar" }]
    });
  });

  it("parses indentation-based lists with one child, with an extra new line", () => {
    const text = `foo

  bar`;
    const ctx = new Ctx({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: ["\n"],
      children: [{ type: "Name", data: "foo" }, { type: "Name", data: "bar" }]
    });
  });

  it("parses indentation-based lists with one child, with two extra new lines", () => {
    const text = `foo


  bar`;
    const ctx = new Ctx({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: ["\n\n"],
      children: [{ type: "Name", data: "foo" }, { type: "Name", data: "bar" }]
    });
  });

  it("parses nested indentation-based lists", () => {
    const text = `foo
  bar
    baz
    1
  2`;
    const ctx = new Ctx({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", data: "foo" },
        {
          type: "IList",
          indent: 4,
          extraSpaces: ["", ""],
          children: [
            { type: "Name", data: "bar" },
            { type: "Name", data: "baz" },
            { type: "NumLit", data: 1 }
          ]
        },
        { type: "NumLit", data: 2 }
      ]
    });
  });

  it("parses super nested indentation-based lists", () => {
    const text = `foo
  bar
    baz
      1
  2`;
    const ctx = new Ctx({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 2,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", data: "foo" },
        {
          type: "IList",
          indent: 4,
          extraSpaces: [""],
          children: [
            { type: "Name", data: "bar" },
            {
              type: "IList",
              indent: 6,
              extraSpaces: [""],
              children: [
                { type: "Name", data: "baz" },
                { type: "NumLit", data: 1 }
              ]
            }
          ]
        },
        { type: "NumLit", data: 2 }
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
    const ctx = new Ctx({ text, indents: [0] });
    const result = parseIList(ctx);
    expect(result).toEqual({
      type: "IList",
      indent: 4,
      extraSpaces: ["", ""],
      children: [
        { type: "Name", data: "foo" },
        {
          type: "IList",
          indent: 5,
          extraSpaces: [""],
          children: [
            { type: "Name", data: "bar" },
            {
              type: "IList",
              indent: 10,
              extraSpaces: ["", ""],
              children: [
                { type: "Name", data: "baz" },
                { type: "NumLit", data: 1 },
                { type: "NumLit", data: 2 }
              ]
            }
          ]
        },
        { type: "NumLit", data: 2 }
      ]
    });
  });
});

describe("parse/print round trip identity laws", () => {
  function testRoundTrip(input: string) {
    test(JSON.stringify(input), () => {
      const output = parse(input);
      expect(output.print()).toBe(input);
    });
  }
  testRoundTrip("(foo)");
  testRoundTrip("(foo bar)");
  testRoundTrip("( foo bar )");
  testRoundTrip("( foo bar  baz )");
  testRoundTrip("( foo (foo 1 2 3 ) baz )");

  testRoundTrip(`foo
  1`);
  testRoundTrip(`foo
  1

  foo


    bar
      sdf

  baz`);
});

describe("pretty printing properties", () => {
  function testPretty(input: string, expected: string) {
    test(JSON.stringify(input), () => {
      const output = parse(input);
      expect(output.pretty().print()).toBe(expected);
    });
  }
  testPretty("()", "()");
  testPretty("(foo)", "(foo)");
  testPretty("( foo )", "(foo)");
  testPretty("(foo bar)", "(foo bar)");
  testPretty("( foo  bar )", "(foo bar)");
  testPretty("( foo (foo 1 2 3 ) baz )", "(foo (foo 1 2 3) baz)");

  testPretty(
    `foo
  1

  foo


    bar
      sdf


  baz`,
    `foo
  1
  foo
    bar
      sdf
  baz`
  );
});
