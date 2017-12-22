// @flow

import { print } from "./printer";
import { parse } from "./parser";
import { pretty } from "./pretty";

describe("pretty printing properties", () => {
  function testPretty(input: string, expected: string) {
    test(JSON.stringify(input), () => {
      const output = parse(input);
      expect(print(pretty(output))).toBe(expected);
    });
  }
  testPretty("(foo)", "(foo)");
  testPretty("( foo )", "(foo)");
  testPretty("(foo bar)", "(foo bar)");
  testPretty("( foo  bar )", "(foo bar)");
  testPretty("( foo (foo 1 2 3 ) baz )", "(foo (foo 1 2 3) baz)");

  testPretty(
    `foo
  1

  foo     1  2  3


    bar
      sdf


  baz`,
    `foo
  1
  foo 1 2 3
    bar
      sdf
  baz`
  );
});
