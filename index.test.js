// @flow
import { parse, parseName, parseNumLit, parseList } from "./";

describe("parseName", () => {
  it("parses names", () => {
    const input = { text: "foo 1", indentation: 0 };
    const result = parseName(input);
    expect(result).toEqual({
      value: {
        type: "Name",
        data: "foo"
      },
      state: { text: " 1", indentation: 0 }
    });
  });

  it("fails on whitespace", () => {
    const input = { text: "   foo 1", indentation: 0 };
    expect(() => parseName(input)).toThrow("not a name");
  });
});

describe("parseNumLit", () => {
  it("parses numeric literals", () => {
    const input = { text: "100 asdf", indentation: 0 };
    const result = parseNumLit(input);
    expect(result).toEqual({
      value: { type: "NumLit", data: 100 },
      state: { text: " asdf", indentation: 0 }
    });
  });

  it("fails on whitespace", () => {
    const input = { text: "  100 asdf", indentation: 0 };
    expect(() => parseNumLit(input)).toThrow("not a number");
  });
});

describe("parseList", () => {
  it("parses lists", () => {
    const input = { text: `(foo 1 2 1)`, indentation: 0 };
    const result = parseList(input);
    expect(result).toEqual({
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
      state: { text: "", indentation: 0 }
    });
  });
});

describe("round trip identity laws", () => {
  function testRoundTrip(input: string) {
    test(JSON.stringify(input), () => {
      const output = parse({ text: input, indentation: 0 });
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
      const output = parse({ text: input, indentation: 0 });
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
