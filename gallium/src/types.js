// @flow

export const transformer: Type = "transformer";

export const number: Type = "number";
export const string: Type = "string";

export const listProcessor: Type = (input: Type, output: Type): Type => {
  return {
    tag: "listProcessor",
    input,
    output
  };
};

export const func: Type = (input: Type, output: Type): Type => {
  return {
    tag: "func",
    input,
    output
  };
};

export const list: Type = (value: Type): Type => {
  return {
    tag: "list",
    value
  };
};

export type Type = any;
