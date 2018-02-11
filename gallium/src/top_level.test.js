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
    { start: 0, end: 1, value: { channel: 0, pitch: 60 } }
  ]);
  expect(pattern(1, 2)).toEqual([
    { start: 1, end: 2, value: { channel: 0, pitch: 72 } }
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
      { start: 0, end: 1, value: { channel: 1, pitch: 0 } }
    ]);
  });

  test("having multiple values type-errors", () => {
    expect(() => parse(`do (channel 0 1) (note 0)`)).toThrow();
  });

  test("extraneous changes result in no-op", () => {
    const pattern = parse(`do (channel 1) (note 0) (channel 1)`);
    expect(pattern(0, 1)).toEqual([
      { start: 0, end: 1, value: { channel: 1, pitch: 0 } }
    ]);
  });

  test("is block-scoped", () => {
    const pattern = parse(`alt (do (channel 1) (note 0)) (note 0)`);
    expect(pattern(0, 1)).toEqual([
      { start: 0, end: 1, value: { channel: 1, pitch: 0 } }
    ]);
    expect(pattern(1, 2)).toEqual([
      { start: 1, end: 2, value: { channel: 0, pitch: 0 } }
    ]);
  });

  test("is block-scoped (2)", () => {
    const pattern = parse(`alt (do (channel 1) (do (channel 2) 0)) (note 0)`);
    expect(pattern(1, 2)).toEqual([
      { start: 1, end: 2, value: { channel: 0, pitch: 0 } }
    ]);
    expect(pattern(0, 1)).toEqual([
      { start: 0, end: 1, value: { channel: 2, pitch: 0 } }
    ]);
  });
});

test("i is a no-op", () => {
  expect(parse(`do (note 0) i`)(0, 1)).toEqual(parse(`do (note 0)`)(0, 1));
});

test("m mutes", () => {
  const events = parse(`do (note 0) m`)(0, 1);
  expect(events[0].value.mute).toBe(true);
});

test("river of time flows even silence", () => {
  expect(parse(`do (fast 2) (note 0)`)(0, 1)).toEqual(
    parse(`do (note 0) (fast 2)`)(0, 1)
  );
});

test("can do pitch transformations when pitch is zero", () => {
  expect(parse(`do (note 0) (add 12)`)(0, 1)).toEqual(
    parse(`do (note 12)`)(0, 1)
  );
});
