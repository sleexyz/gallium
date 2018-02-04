// @flow
import { parse } from "./parser";
import { resolve, type BindingContext } from "./resolver";
import { interpret, IContext } from "./interpreter";

type State = {
  literalIntepretation: number => any
};

const bindingContext: BindingContext = {
  join: {
    value: (xs: Array<string>) => {
      return `(${xs.join(",")})`;
    }
  },
  joinWithDoubledNumbers: {
    impureValue: (ctx: IContext) => {
      ctx.state = {
        ...ctx.state,
        numLitInterpreter: x => `${x * 2}`
      };
      return bindingContext.join.value;
    }
  },
  joinWithTripledNumbers: {
    impureValue: (ctx: IContext) => {
      ctx.state = {
        ...ctx.state,
        numLitInterpreter: x => `${x * 3}`
      };
      return bindingContext.join.value;
    }
  },
  asdf: {
    value: "asdfValue"
  }
};

const makeInterpreterContext = (): IContext => {
  return new IContext({
    numLitInterpreter: x => `${x}`
  });
};

describe("interpretation", () => {
  it("interprets numbers", () => {
    const ast = parse("0");
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("0");
  });

  it("interprets decimals", () => {
    const ast = parse("0.5");
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("0.5");
  });

  it("interprets names", () => {
    const ast = parse("asdf");
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("asdfValue");
  });

  it("should be able to interpret horizontal application", () => {
    const ast = parse("(join 1 2 3)");
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("(1,2,3)");
  });

  it("should be able to interpret vertical application", () => {
    const ast = parse(`join
  1
  2
  3`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("(1,2,3)");
  });
});

describe("scoped impure computations", () => {
  test("top-level scoped impure computations", () => {
    const ast = parse(`joinWithDoubledNumbers
  1
  2
  3`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(`(2,4,6)`);
  });

  test("scoped impure computations should not leak", () => {
    const ast = parse(`join
  1
  joinWithDoubledNumbers 1
  1`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(`(1,(2),1)`);
  });

  test("scoped impure computations can be nested", () => {
    const ast = parse(`joinWithDoubledNumbers
  1
  joinWithTripledNumbers 1
  1`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(`(2,(3),2)`);
  });

  test("scoped impure computations should persist throughout scope", () => {
    const ast = parse(`joinWithDoubledNumbers
  1
  join 1
  1`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(`(2,(2),2)`);
  });
});
