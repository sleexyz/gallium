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

type State = {
  indentation: number,
  text: string
};

type Parser<A> = State => { value: A, state: State };

function bind<A, B>(x: Parser<A>, f: A => Parser<B>): Parser<B> {
  return state1 => {
    const { value, state } = x(state1);
    return f(value)(state);
  };
}

function map<A, B>(x: Parser<A>, f: A => B): Parser<B> {
  return state1 => {
    const { value, state } = x(state1);
    return {
      value: f(value),
      state
    };
  };
}

class ParseError extends Error {}

export const parseName: Parser<AST> = state => {
  const match = state.text.match(/^[a-zA-Z]+/);
  if (!match) {
    throw new ParseError("not a name");
  }
  const name = match[0];
  return {
    value: new Name(name),
    state: {
      ...state,
      text: state.text.substring(name.length)
    }
  };
};

export const parseNumLit: Parser<AST> = state => {
  const match = state.text.match(/^[0-9]+/);
  if (!match) {
    throw new ParseError("not a number");
  }
  const numString = match[0];
  return {
    value: new NumLit(parseInt(numString)),
    state: {
      ...state,
      text: state.text.substring(numString.length)
    }
  };
};

export const constant = (substring: string): Parser<void> => state => {
  const i = state.text.indexOf(substring);
  if (i != 0) {
    throw new ParseError("could not find constant");
  }
  return {
    value: undefined,
    state: {
      ...state,
      text: state.text.substring(i + substring.length)
    }
  };
};

export function alternate<O>(options: Array<Parser<O>>): Parser<O> {
  return state => {
    for (const f of options) {
      try {
        return f(state);
      } catch (e) {}
    }
    throw new ParseError("alternation failed");
  };
}

const parseTerm0: Parser<AST> = input => {
  return alternate([parseTerm1])(input);
};

const parseTerm1: Parser<AST> = input => {
  return alternate([parseList, parseName, parseNumLit])(input);
};

export function parse(state: State): AST {
  return parseTerm0(state).value;
}

const optionalWhitespace: Parser<string> = state => {
  const match = state.text.match(/^\s*/);
  if (!match) {
    return {
      state,
      value: ""
    };
  }
  return {
    state: {
      ...state,
      text: state.text.substring(match[0].length)
    },
    value: match[0]
  };
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
