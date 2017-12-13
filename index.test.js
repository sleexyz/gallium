// @flow
import { parse, parseName, parseNumLit, parseSemi } from "./";

describe("parseName", () => {
  it("parses names", () => {
    const input = "foo 1";
    const result = parseName(input);
    expect(result.data).toEqual({
      value: {
        type: "Name",
        space: "",
        data: "foo"
      },
      rest: " 1"
    });
  });

  it("recognizes whitespace", () => {
    const input = "   foo 1";
    const result = parseName(input);
    expect(result.data).toEqual({
      value: {
        type: "Name",
        space: "   ",
        data: "foo"
      },
      rest: " 1"
    });
  });
});

describe("parseNumLit", () => {
  it("parses numeric literals", () => {
    const input = "100 asdf";
    const result = parseNumLit(input);
    expect(result.data).toEqual({
      value: { type: "NumLit", space: "", data: 100 },
      rest: " asdf"
    });
  });

  it("recognizes whitespace", () => {
    const input = "  100 asdf";
    const result = parseNumLit(input);
    expect(result.data).toEqual({
      value: { type: "NumLit", space: "  ", data: 100 },
      rest: " asdf"
    });
  });
});

describe("parseSemi", () => {
  it("parses semicolons with no spaces", () => {
    const input = `foo;bar`;
    const result = parseSemi(input);
    expect(result.data).toEqual({
      value: {
        type: "Semi",
        data: undefined,
        space: "",
        children: [
          { type: "Name", space: "", data: "foo" },
          { type: "Name", space: "", data: "bar" }
        ]
      },
      rest: ""
    });
  });

  it("parses semicolons with spaces", () => {
    const input = `foo  ;  bar`;
    const result = parseSemi(input);
    expect(result.data).toEqual({
      value: {
        type: "Semi",
        data: undefined,
        space: "  ",
        children: [
          { type: "Name", space: "", data: "foo" },
          { type: "Name", space: "  ", data: "bar" }
        ]
      },
      rest: ""
    });
  });

  it("can parses multiple semicolons", () => {
    const input = `foo  ;  bar  ; baz`;
    const result = parseSemi(input);
    expect(result.data).toEqual({
      value: {
        type: "Semi",
        data: undefined,
        space: "  ",
        children: [
          { type: "Name", space: "", data: "foo" },
          {
            type: "Semi",
            data: undefined,
            space: "  ",
            children: [
              { type: "Name", space: "  ", data: "bar" },
              { type: "Name", space: " ", data: "baz" }
            ]
          }
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
  testRoundTrip("foo");
  testRoundTrip("foo;bar");
  testRoundTrip("foo ; bar");
  testRoundTrip(" foo ; bar");
  testRoundTrip("baz; foo; bar; asdf");
});
