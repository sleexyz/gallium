// @flow
import { parse } from "./parser";
import { pure, resolve, type BindingContext } from "./resolver";
import { interpret, IContext } from "./interpreter";

const bindingContext: BindingContext = {
  join: {
    value: (xs: Array<string>) => {
      return pure(`(${xs.join(",")})`);
    }
  },
  lexicalJoinWithDoubledNumbers: {
    impureValue: (ctx: IContext) => {
      const oldState = ctx.state;
      ctx.state = {
        ...ctx.state,
        numLitInterpreter: x => ctx => `${x * 2}`
      };
      return xs => ctx => {
        ctx.state = {
          ...ctx.state,
          numLitInterpreter: oldState.numLitInterpreter
        };
        return `(${xs.join(",")})`;
      };
    }
  },
  lexicalJoinWithTripledNumbers: {
    impureValue: (ctx: IContext) => {
      const oldState = ctx.state;
      ctx.state = {
        ...ctx.state,
        numLitInterpreter: x => ctx => `${x * 3}`
      };
      return xs => ctx => {
        ctx.state = {
          ...ctx.state,
          numLitInterpreter: oldState.numLitInterpreter
        };
        return `(${xs.join(",")})`;
      };
    }
  },
  asdf: {
    value: "asdfValue"
  }
};

const makeInterpreterContext = (): IContext => {
  return new IContext({
    numLitInterpreter: x => ctx => `${x}`,
    channel: 0
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

describe("lexical impure computations", () => {
  test("top-level lexical impure computations", () => {
    const ast = parse(`lexicalJoinWithDoubledNumbers
  1
  2
  3`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(`(2,4,6)`);
  });

  test("lexical impure computations should not leak", () => {
    const ast = parse(`join
  1
  lexicalJoinWithDoubledNumbers 1
  1`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(`(1,(2),1)`);
  });

  test("lexical impure computations can be nested", () => {
    const ast = parse(`lexicalJoinWithDoubledNumbers
  1
  lexicalJoinWithTripledNumbers 1
  1`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(`(2,(3),2)`);
  });

  test("lexical impure computations should persist throughout scope", () => {
    const ast = parse(`lexicalJoinWithDoubledNumbers
  1
  join 1
  1`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(`(2,(2),2)`);
  });
});
