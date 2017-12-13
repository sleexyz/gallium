// @flow

type AST = AST_<any>;

interface AST_<P> {
  type: string;
  space: string;
  data: P;
  children?: Array<AST>;
  print(): string;
}

class Name implements AST_<string> {
  type = "Name";
  data: string;
  space: string;
  constructor(data: string, space: string) {
    this.data = data;
    this.space = space;
  }
  print() {
    return `${this.space}${this.data}`;
  }
}

class Semi implements AST_<void> {
  type = "Semi";
  data = undefined;
  children: Array<AST>;
  space: string;
  constructor(children: [AST, AST], space: string) {
    this.children = [...children];
    this.space = space;
  }
  print() {
    return `${this.children[0].print()}${
      this.space
    };${this.children[1].print()}`;
  }
}

class NumLit implements AST_<number> {
  type = "NumLit";
  data: number;
  space: string;
  constructor(data: number, space: string) {
    this.data = data;
    this.space = space;
  }
  print() {
    return `${this.space}${this.data}`;
  }
}

type Parser<A> = string => Result<A, any>;

class Result<A, Data> {
  data: Data;
  constructor(data: Data) {
    this.data = data;
  }
}

class Fail<A> extends Result<A, string> {}

type SuccessData<A> = {
  value: A,
  rest: string
};
class Success<A> extends Result<A, SuccessData<A>> {}

function bind<A, B>(x: Parser<A>, f: A => Parser<B>): Parser<B> {
  return input => {
    const result = x(input);
    if (!(result instanceof Success)) {
      return new Fail(result.data);
    }
    const { value, rest } = result.data;
    return f(value)(rest);
  };
}

function map<A, B>(x: Parser<A>, f: A => B): Parser<B> {
  return input => {
    const result = x(input);
    if (!(result instanceof Success)) {
      return new Fail(result.data);
    }
    const { value, rest } = result.data;
    return new Success({
      value: f(value),
      rest
    });
  };
}

function mapRest<A>(x: Parser<A>, f: string => string): Parser<A> {
  return input => {
    const result = x(input);
    if (!(result instanceof Success)) {
      return new Fail(result.data);
    }
    const { value, rest } = result.data;
    return new Success({
      value,
      rest: f(rest)
    });
  };
}

export const parseName: Parser<AST> = input =>
  bind(getWhitespace, whitespace => {
    return input => {
      const match = input.match(/^[a-zA-Z]+/);
      if (!match) {
        return new Fail("not a name");
      }
      const name = match[0];
      const rest = input.substring(name.length);
      return new Success({
        value: new Name(name, whitespace),
        rest
      });
    };
  })(input);

export const parseNumLit: Parser<AST> = input => {
  return bind(getWhitespace, whitespace => {
    return input => {
      const match = input.match(/^[0-9]+/);
      if (!match) {
        return new Fail("not a number");
      }
      const numString = match[0];
      const rest = input.substring(numString.length);
      return new Success({
        value: new NumLit(parseInt(numString), whitespace),
        rest
      });
    };
  })(input);
};

export const constant = (substring: string): Parser<void> => input => {
  const i = input.indexOf(substring);
  if (i < 0) {
    return new Fail("not a semi");
  }
  return new Success({
    value: undefined,
    rest: input.substring(i + substring.length)
  });
};

export function alternate<O>(options: Array<Parser<O>>): Parser<O> {
  return input => {
    for (const f of options) {
      const result = f(input);
      if (result instanceof Success) {
        return result;
      }
    }
    return new Fail("alternation failed");
  };
}

const parseTerm0: Parser<AST> = input => {
  return alternate([parseSemi, parseTerm1])(input);
};

const parseTerm1: Parser<AST> = input => {
  return alternate([parseName, parseNumLit])(input);
};

export function parse(input: string): AST {
  const result = parseTerm0(input);
  if (!(result instanceof Success)) {
    throw new Error(`Parse Error: ${result.data.value}`);
  }
  return result.data.value;
}

const getWhitespace: Parser<string> = input => {
  const match = input.match(/^\s*/);
  if (!match) {
    return new Success({
      rest: input,
      value: ""
    });
  }
  return new Success({
    rest: input.substring(match[0].length),
    value: match[0]
  });
};

export function collectWhitespaceBefore<A>(
  parser: Parser<A>
): Parser<{ value: A, whitespace: string }> {
  return bind(getWhitespace, whitespace => {
    return map(parser, value => {
      return {
        value,
        whitespace
      };
    });
  });
}

export const parseSemi: Parser<AST> = bind(parseTerm1, left => {
  return bind(collectWhitespaceBefore(constant(";")), ({ whitespace }) => {
    return map(parseTerm0, right => {
      return new Semi([left, right], whitespace);
    });
  });
});
