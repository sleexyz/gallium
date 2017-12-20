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
      type: "number",
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
        type: {
          type: "function",
          input: { type: { type: "list", param: "number" } },
          output: "transformer"
        },
        value: (x: Array<number>) => {
          return `mockTransformer ${JSON.stringify(x)}`;
        }
      }),
      bar: new Term({
        type: "number",
        value: 100
      })
    };
    it("should return terms for bound variables", () => {
      const ast = parse("(foo bar 2 3)");
      const abt = resolve(context, ast);
      expect(abt.children[0].payload).toEqual({
        type: {
          type: "function",
          input: { type: { type: "list", param: "number" } },
          output: "transformer"
        },
        value: context.foo.value
      });
      expect(abt.children[1].payload).toEqual({
        type: "number",
        value: 100
      });
    });
  });
});

describe("interpretation", () => {
  const context = {
    foo: new Term({
      type: {
        type: "function",
        input: { type: { type: "list", param: "number" } },
        output: "transformer"
      },
      value: (x: Array<number>) => {
        return `fooTransformer ${JSON.stringify(x)}`;
      }
    }),
    bar: new Term({
      type: "number",
      value: 100
    })
  };

  it("should be able to interpret s-expressions", () => {
    const ast = parse("(foo bar 2 3)");
    const abt = resolve(context, ast);
    expect(abt.payload.getValue()).toBe("fooTransformer [100,2,3]");
  });

  it("should be able to interpret i-expressions", () => {
    const ast = parse(`foo
  bar
  2
  3`);
    const abt = resolve(context, ast);
    expect(abt.payload.getValue()).toBe("fooTransformer [100,2,3]");
  });
});
