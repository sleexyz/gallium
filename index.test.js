// @flow
import { Ctx, parse, parseName, parseNumLit, parseList } from "./";

describe("parseName", () => {
  it("parses names", () => {
    const ctx = new Ctx({ text: "foo 1", indent: 0 });
    const result = parseName(ctx);
    expect(result).toEqual({
      type: "Name",
      data: "foo"
    });
  });

  it("fails on whitespace", () => {
    const ctx = new Ctx({ text: "   foo 1", indent: 0 });
    expect(() => parseName(ctx)).toThrow("not a name");
  });
});

describe("parseNumLit", () => {
  it("parses numeric literals", () => {
    const ctx = new Ctx({ text: "100 asdf", indent: 0 });
    const result = parseNumLit(ctx);
    expect(result).toEqual({ type: "NumLit", data: 100 });
  });

  it("fails on whitespace", () => {
    const input = new Ctx({ text: "  100 asdf", indent: 0 });
    expect(() => parseNumLit(input)).toThrow("not a number");
  });
});

describe("parseList", () => {
  it("parses lists", () => {
    const ctx = new Ctx({ text: `(foo 1 2 1)`, indent: 0 });
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

describe("round trip identity laws", () => {
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
});

describe("pretty printing", () => {
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
});
