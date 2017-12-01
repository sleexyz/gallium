// @flow
import * as Parser from "./";

describe("parseName", () => {
  it("parses names", () => {
    const result = Parser.parseName("foo 1");
    expect(result.data).toEqual({
      value: { type: "Name", data: "foo" },
      rest: " 1"
    });
  });

  it("fails on incomplete data", () => {
    const result = Parser.parseName(" foo 1");
    expect(result.data).toEqual("not a name");
  });
});

describe("parseNumLit", () => {
  it("parses numeric literals", () => {
    const result = Parser.parseNumLit("100 asdf");
    expect(result.data).toEqual({
      value: { type: "NumLit", data: 100 },
      rest: " asdf"
    });
  });

  it("fails on incomplete data", () => {
    const result = Parser.parseNumLit(" 100");
    expect(result.data).toEqual("not a number");
  });
});

describe("parseSemi", () => {
  it("parses semicolons with no spaces", () => {
    const result = Parser.parseSemi("foo;bar");
    expect(result.data).toEqual({
      value: {
        type: "Semi",
        data: {
          left: { type: "Name", data: "foo" },
          right: { type: "Name", data: "bar" }
        }
      },
      rest: ""
    });
  });

  it("parses semicolons with spaces", () => {
    const result = Parser.parseSemi("foo  ;  bar");
    expect(result.data).toEqual({
      value: {
        type: "Semi",
        data: {
          left: { type: "Name", data: "foo" },
          right: { type: "Name", data: "bar" }
        }
      },
      rest: ""
    });
  });

  it("can parses multiple semicolons", () => {
    const result = Parser.parseSemi("foo  ;  bar ; baz");
    expect(result.data).toEqual({
      value: {
        type: "Semi",
        data: {
          left: { type: "Name", data: "foo" },
          right: {
            type: "Semi",
            data: {
              left: { type: "Name", data: "bar" },
              right: { type: "Name", data: "baz" }
            }
          }
        }
      },
      rest: ""
    });
  });
});
