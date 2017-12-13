// @flow

interface AST {
  type: string;
  children?: Array<AST>;
  print(): string;
  pretty(): AST;
}

class Name implements AST {
  type = "Name";
  data: string;
  constructor(data: string) {
    this.data = data;
  }
  print() {
    return this.data;
  }
  pretty() {
    return new Name(this.data);
  }
}

class List implements AST {
  type = "List";
  children: Array<AST>;
  spaces: Array<string>;
  constructor(children: Array<AST>, spaces: Array<string>) {
    this.children = [...children];
    this.spaces = spaces;
  }
  print() {
    let str = "(";
    for (let i = 0; i < this.children.length; i += 1) {
      str += this.spaces[i];
      str += this.children[i].print();
    }
    str += this.spaces[this.children.length];
    str += ")";
    return str;
  }
  pretty() {
    const spaces = Array(this.children.length + 1).fill(" ");
    spaces[0] = "";
    spaces[this.children.length] = "";
    return new List(this.children.map(x => x.pretty()), spaces);
  }
}

class NumLit implements AST {
  type = "NumLit";
  data: number;
  constructor(data: number) {
    this.data = data;
  }
  print() {
    return `${this.data}`;
  }
  pretty() {
    return new NumLit(this.data);
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

export const parseName: Parser<AST> = input => {
  const match = input.match(/^[a-zA-Z]+/);
  if (!match) {
    return new Fail("not a name");
  }
  const name = match[0];
  const rest = input.substring(name.length);
  return new Success({
    value: new Name(name),
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
    value: new NumLit(parseInt(numString)),
    rest
  });
};

export const constant = (substring: string): Parser<void> => input => {
  const i = input.indexOf(substring);
  if (i != 0) {
    return new Fail("could not find constant");
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
  return alternate([parseTerm1])(input);
};

const parseTerm1: Parser<AST> = input => {
  return alternate([parseList, parseName, parseNumLit])(input);
};

export function parse(input: string): AST {
  const result = parseTerm0(input);
  if (!(result instanceof Success)) {
    throw new Error(`Parse Error: ${result.data.value}`);
  }
  return result.data.value;
}

const optionalWhitespace: Parser<string> = input => {
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

export const parseList: Parser<AST> = bind(constant("("), () => {
  return map(
    parseListAux({ children: [], spaces: [] }),
    ({ children, spaces }) => {
      return new List(children, spaces);
    }
  );
});

function parseListAux({
  children,
  spaces
}: {
  children: Array<AST>,
  spaces: Array<string>
}): Parser<{ children: Array<AST>, spaces: Array<string> }> {
  return bind(optionalWhitespace, space => {
    return alternate([
      map(constant(")"), () => {
        return { children, spaces: [...spaces, space] };
      }),
      bind(parseTerm0, child => {
        return parseListAux({
          children: [...children, child],
          spaces: [...spaces, space]
        });
      })
    ]);
  });
}
