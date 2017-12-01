// @flow

/*
   Syntax:

   note 2
   fast 2
   and
     note 1
     fast 3
   and
     note 1 ; fast 4
*/

type AST = Name | Semi | NumLit;
type Name = {
  type: "Name",
  data: string
};

type Semi = {
  type: "Semi",
  data: {
    left: AST,
    right: AST
  }
};

type NumLit = {
  type: "NumLit",
  data: number
};

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

export const parseName: Parser<AST> = input => {
  const match = input.match(/^[a-zA-Z]+/);
  if (!match) {
    return new Fail("not a name");
  }
  const name = match[0];
  const rest = input.substring(name.length);
  return new Success({
    value: { type: "Name", data: name },
    rest
  });
};

export const parseNumLit: Parser<AST> = input => {
  const match = input.match(/^[0-9]+/);
  if (!match) {
    return new Fail("not a number");
  }
  const numString = match[0];
  const rest = input.substring(numString.length);
  return new Success({
    value: { type: "NumLit", data: parseInt(numString) },
    rest
  });
};

function isDone<A>(result: Parser<A>): boolean {
  if (!(result instanceof Success)) {
    return false;
  }
  if (result.data.rest !== "") {
    return false;
  }
  return true;
}

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

export const parseTerm0: Parser<AST> = input => {
  return alternate([parseSemi, parseName, parseNumLit])(input);
};

export const parseTerm1: Parser<AST> = input => {
  return alternate([parseName, parseNumLit])(input);
};

export const whitespace = <A>(parser: Parser<A>): Parser<A> => {
  return input => {
    const match = input.match(/^\s*/);
    if (!match) {
      return new Fail("no whitespace");
    }
    return parser(input.substring(match[0].length));
  };
};

export const parseSemi: Parser<AST> = bind(parseTerm1, left => {
  return bind(whitespace(constant(";")), () => {
    return map(whitespace(parseTerm0), right => {
      return {
        type: "Semi",
        data: {
          left,
          right
        }
      };
    });
  });
});
