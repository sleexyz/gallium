// @flow
import * as TopLevel from "./top_level";
import { type Pattern } from "./semantics";

const parse = (code: string): Pattern<Uint8Array> => {
  return TopLevel.interpret(TopLevel.parseAndResolve(code));
};

it("allows arguments", () => {
  const pattern = parse(`note 60 72`);
  expect(pattern(0, 1)).toEqual([
    { start: 0, end: 1, value: new Uint8Array([144, 60, 127]) }
  ]);
  expect(pattern(1, 2)).toEqual([
    { start: 1, end: 2, value: new Uint8Array([144, 72, 127]) }
  ]);
});

it("throws a type error when given a list processor with no arguments", () => {
  const parsePattern = () => parse(`note`);
  expect(parsePattern).toThrow();
});
