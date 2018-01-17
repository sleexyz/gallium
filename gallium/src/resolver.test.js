// @flow
import { print } from "./printer";
import { pretty } from "./pretty";
import { parse } from "./parser";
import { resolve } from "./resolver";

describe("resolve", () => {
  it("should resolve numeric literals ", () => {
    const ast = parse("1");
    const context = {};
    const abt = resolve(context, ast);
    expect(abt.data).toEqual({
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
      foo: {
        value: (x: Array<number>) => {
          return `mockTransformer ${JSON.stringify(x)}`;
        }
      },
      bar: {
        value: 100
      }
    };
    it("should return terms for bound variables", () => {
      const ast = parse("(foo bar 2 3)");
      const abt = resolve(context, ast);
      expect((abt: any).children[0].children[0].data).toEqual({
        value: context.foo.value
      });
      expect((abt: any).children[0].children[1].data).toEqual({
        value: 100
      });
    });
  });
});
