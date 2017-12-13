// @flow
import { parse, parseName, parseNumLit, parseList } from "./";

describe("parseName", () => {
  it("parses names", () => {
    const input = "foo 1";
    const result = parseName(input);
    expect(result.data).toEqual({
      value: {
        type: "Name",
        data: "foo"
      },
      rest: " 1"
    });
  });

  it("fails on whitespace", () => {
    const input = "   foo 1";
    const result = parseName(input);
    expect(result.data).toEqual("not a name");
  });
});

describe("parseNumLit", () => {
  it("parses numeric literals", () => {
    const input = "100 asdf";
    const result = parseNumLit(input);
    expect(result.data).toEqual({
      value: { type: "NumLit", data: 100 },
      rest: " asdf"
    });
  });

  it("fails on whitespace", () => {
    const input = "  100 asdf";
    const result = parseNumLit(input);
    expect(result.data).toEqual("not a number");
  });
});

describe("parseList", () => {
  it("parses lists", () => {
    const input = `(foo 1 2 1)`;
    const result = parseList(input);
    expect(result.data).toEqual({
      value: {
        type: "List",
        spaces: ["", " ", " ", " ", ""],
        children: [
          { type: "Name", data: "foo" },
          { type: "NumLit", data: 1 },
          { type: "NumLit", data: 2 },
          { type: "NumLit", data: 1 }
        ]
      },
      rest: ""
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
