// @flow
import * as TopLevel from "./top_level";
import { silence, type Pattern } from "./semantics";
import * as MIDIUtils from "./midi_utils";

const parse = (code: string): Pattern<TopLevel.Parameters> => {
  return TopLevel.interpret(TopLevel.parseAndResolve(code));
};

it("allows arguments", () => {
  const pattern = parse(`note 60 72`);
  expect(pattern(0, 1)).toEqual([
    { start: 0, end: 1, value: { channel: 0, pitch: 60, length: 1 } }
  ]);
  expect(pattern(1, 2)).toEqual([
    { start: 1, end: 2, value: { channel: 0, pitch: 72, length: 1 } }
  ]);
});

it("throws a type error when given a list processor with no arguments", () => {
  const parsePattern = () => parse(`note`);
  expect(parsePattern).toThrow();
});

it("throws a type error when given an invalid parenthesized argument", () => {
  const parsePattern = () => parse(`do (shift) 0.5`);
  expect(parsePattern).toThrow();
});

describe("channel", () => {
  test("setting", () => {
    const pattern = parse(`do (channel 1) (note 0)`);
    expect(pattern(0, 1)).toEqual([
      { start: 0, end: 1, value: { channel: 1, pitch: 0, length: 1 } }
    ]);
  });

  test("having multiple values type-errors", () => {
    expect(() => parse(`do (channel 0 1) (note 0)`)).toThrow();
  });

  test("extraneous changes result in no-op", () => {
    const pattern = parse(`do (channel 1) (note 0) (channel 1)`);
    expect(pattern(0, 1)).toEqual([
      { start: 0, end: 1, value: { channel: 1, pitch: 0, length: 1 } }
    ]);
  });

  test("is block-scoped", () => {
    const pattern = parse(`alt (do (channel 1) (note 0)) (note 0)`);
    expect(pattern(0, 1)).toEqual([
      { start: 0, end: 1, value: { channel: 1, pitch: 0, length: 1 } }
    ]);
    expect(pattern(1, 2)).toEqual([
      { start: 1, end: 2, value: { channel: 0, pitch: 0, length: 1 } }
    ]);
  });

  test("is block-scoped (2)", () => {
    const pattern = parse(`alt (do (channel 1) (do (channel 2) 0)) (note 0)`);
    expect(pattern(1, 2)).toEqual([
      { start: 1, end: 2, value: { channel: 0, pitch: 0, length: 1 } }
    ]);
    expect(pattern(0, 1)).toEqual([
      { start: 0, end: 1, value: { channel: 2, pitch: 0, length: 1 } }
    ]);
  });
});

test("i is a no-op", () => {
  expect(parse(`do (note 0) i`)(0, 1)).toEqual(parse(`do (note 0)`)(0, 1));
});

test("m mutes", () => {
  expect(parse(`do (note 0) m`)(0, 1)).toEqual([]);
});

test("alt1 switches every two beats", () => {
  expect(parse(`do (note 0) (alt1 (add 0) (add 7))`)(0, 4)).toEqual(
    parse(`note 0 0 7 7`)(0, 4)
  );
});

test("alt1 does not change speed of time as arguments percieve it", () => {
  expect(parse(`do (note 0 7) (alt1 (shift 0) (shift 0.5))`)(0, 4)).toEqual(
    parse(`do (note 0 7) (shift 0 0 .5 .5)`)(0, 4)
  );
});

test("out1 changes speed of time as arguments percieve it", () => {
  expect(parse(`do (note 0 7) (out1 (shift 0) (shift 0.5))`)(0, 4)).toEqual(
    parse(`do (note 0 7) (shift 0 0 1 1)`)(0, 4)
  );
});

test("len changes note lengths", () => {
  expect(parse(`do (note 0) (len .5)`)(0, 1)).toEqual([
    { start: 0, end: 1, value: { channel: 0, pitch: 0, length: 0.5 } }
  ]);
});
