// @flow
import { print } from "./printer";
import { pretty } from "./pretty";
import { parse } from "./parser";
import { type AST, type ASTxF, type ASTx, Name, traverse } from "./AST";
import { Term, resolve } from "./resolver";

describe("resolve", () => {
  it("should resolve numeric literals ", () => {
    const ast = parse("1");
    const context = {};
    const abt = resolve(context, ast);
    expect(abt.payload).toEqual({
      value: 1
    });
  });

  it("should fail on non-existent names", () => {
    const ast = parse("foo");
    const context = {};
    expect(() => resolve(context, ast)).toThrow(
      "Could not resolve variable foo"
    );
  });

  describe("name resolution", () => {
    const context = {
      foo: new Term({
        value: (x: Array<number>) => {
          return `mockTransformer ${JSON.stringify(x)}`;
        }
      }),
      bar: new Term({
        value: 100
      })
    };
    it("should return terms for bound variables", () => {
      const ast = parse("(foo bar 2 3)");
      const abt = resolve(context, ast);
      expect((abt: any).children[0].children[0].payload).toEqual({
        value: context.foo.value
      });
      expect((abt: any).children[0].children[1].payload).toEqual({
        value: 100
      });
    });
  });
});

describe("interpretation", () => {
  const context = {
    foo: new Term({
      value: (x: Array<number>) => {
        return `fooTransformer ${JSON.stringify(x)}`;
      }
    }),
    bar: new Term({
      value: 100
    })
  };

  it("should be able to interpret 0's", () => {
    const ast = parse("0");
    const abt = resolve(context, ast);
    expect(abt.payload.getValue()).toBe(0);
  });

  it("should be able to interpret decimals", () => {
    const ast = parse("0.5");
    const abt = resolve(context, ast);
    expect(abt.payload.getValue()).toBe(0.5);
  });

  it("should be able to interpret horizontal application", () => {
    const ast = parse("(foo bar 2 3)");
    const abt = resolve(context, ast);
    expect(abt.payload.getValue()).toBe("fooTransformer [100,2,3]");
  });

  it("should be able to interpret vertical application", () => {
    const ast = parse(`foo
  bar
  2
  3`);
    const abt = resolve(context, ast);
    expect(abt.payload.getValue()).toBe("fooTransformer [100,2,3]");
  });

  it("should be able to interpret function application", () => {
    const ast = parse("foo 1 2");
    const context = {
      foo: new Term({
        value: (x: Array<number>) => {
          return `mockTransformer ${JSON.stringify(x)}`;
        }
      })
    };
    const abt = resolve(context, ast);
    expect(abt.payload.getValue()).toBe("mockTransformer [1,2]");
  });
});
