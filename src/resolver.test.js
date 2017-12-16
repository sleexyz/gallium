// @flow
import { print } from "./printer";
import { pretty } from "./pretty";
import { parse } from "./parser";
import { resolve } from "./resolver";

describe("resolver", () => {
  it("should resolve top-level names", () => {
    const ast = parse("foo");
    const context = {
      foo: "a foo",
      bar: "a bar"
    };
    const abt = resolve(context)(ast);
    expect(abt.payload).toBe("a foo");
  });

  it("should resolve non-top-level names", () => {
    const ast = parse("(foo 1 bar 3)");
    const context = {
      foo: "a foo",
      bar: "a bar"
    };
    const abt = resolve(context)(ast);
    expect((abt.children: any)[0].payload).toBe("a foo");
    expect((abt.children: any)[2].payload).toBe("a bar");
  });

  it("should error when top-level variable is not found", () => {
    const context = {};
    const ast = parse("foo");
    expect(() => resolve(context)(ast)).toThrow(
      "Could not resolve variable foo"
    );
  });

  it("should error when non-top-level variable is not found", () => {
    const context = {};
    const ast = parse("(foo 1 bar 2)");
    expect(() => resolve(context)(ast)).toThrow(
      "Could not resolve variable foo"
    );
  });
});

describe("abt", () => {
  it("can still pretty print", () => {
    const context = {
      foo: "a foo",
      bar: "a bar"
    };
    const abt = resolve(context)(parse("(   foo 1 bar  2 )"));
    expect(print(pretty(abt))).toBe("(foo 1 bar 2)");
  });
});
