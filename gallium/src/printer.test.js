// @flow

import { print } from "./printer";
import { parse } from "./parser";

describe("parse/print round trip identity laws", () => {
  function testRoundTrip(input: string) {
    test(JSON.stringify(input), () => {
      const output = parse(input);
      expect(print(output)).toBe(input);
    });
  }
  testRoundTrip("(foo)");
  testRoundTrip("(foo bar)");
  testRoundTrip("( foo bar )");
  testRoundTrip("( foo bar  baz )");
  testRoundTrip("( foo (foo 1 2 3 ) baz )");

  testRoundTrip(`foo
  1`);
  testRoundTrip(`foo
  1

  foo 1 2


    bar
      sdf

  baz`);
});
