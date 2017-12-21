// @flow
import {
  type Pattern,
  query,
  shift,
  fast,
  slow,
  beat,
  stackPat,
  periodic,
  gate,
  alt,
  silence,
  and
} from "./semantics";

describe("beat", () => {
  const pattern = beat;

  testQuery(pattern, 0, 1, [0]);
  testQuery(pattern, 0, 2, [0, 1]);
  testQuery(pattern, 0, 0.5, [0]);
  testQuery(pattern, 0.5, 1, []);
  testQuery(pattern, 1, 2, [1]);
  testQuery(pattern, 0.5, 1.5, [1]);
  testQuery(pattern, 0.5, 2.5, [1, 2]);
});

describe("shift(0.5)(beat)", () => {
  const pattern = shift(0.5)(beat);

  testQuery(pattern, 0, 1, [0.5]);
  testQuery(pattern, 0, 2, [0.5, 1.5]);
  testQuery(pattern, 0, 0.5, []);
  testQuery(pattern, 0.5, 1, [0.5]);
  testQuery(pattern, 1, 2, [1.5]);
  testQuery(pattern, 0.5, 1.5, [0.5]);
  testQuery(pattern, 0.5, 2.5, [0.5, 1.5]);
});

describe("slow(2)(beat)", () => {
  const pattern = slow(2)(beat);

  testQuery(pattern, 0, 1, [0]);
  testQuery(pattern, 0, 2, [0]);
  testQuery(pattern, 0, 4, [0, 2]);
  testQuery(pattern, 0, 0.5, [0]);
  testQuery(pattern, 0.5, 1, []);
  testQuery(pattern, 1, 2, []);
  testQuery(pattern, 0.5, 1.5, []);
  testQuery(pattern, 0.5, 2.5, [2]);
});

describe("fast(2)(beat)", () => {
  const pattern = fast(2)(beat);

  testQuery(pattern, 0, 1, [0, 0.5]);
  testQuery(pattern, 0, 2, [0, 0.5, 1, 1.5]);
  testQuery(pattern, 0, 0.5, [0]);
  testQuery(pattern, 0.5, 1, [0.5]);
  testQuery(pattern, 1, 2, [1, 1.5]);
  testQuery(pattern, 0.5, 1.5, [0.5, 1]);
  testQuery(pattern, 0.5, 2.5, [0.5, 1, 1.5, 2]);
});

const bd = periodic({ period: 1, duration: 1, phase: 0, value: "bd" });

const sn = periodic({ period: 1, duration: 1, phase: 0, value: "sn" });

describe("stackPat", () => {
  describe("stackPat", () => {
    const pattern = stackPat([bd, sn]);
    testQuery(pattern, 0, 1, [0, 0], ["bd", "sn"]);
    testQuery(pattern, 0, 2, [0, 0, 1, 1], ["bd", "sn", "bd", "sn"]);
  });

  describe("slow stackPat", () => {
    const pattern = slow(2)(stackPat([bd, sn]));
    testQuery(pattern, 0, 1, [0, 0], ["bd", "sn"]);
    testQuery(pattern, 0, 2, [0, 0], ["bd", "sn"]);
  });

  describe("shift stackPat", () => {
    const pattern = shift(0.5)(stackPat([bd, sn]));
    testQuery(pattern, 0, 1, [0.5, 0.5], ["bd", "sn"]);
    testQuery(pattern, 0, 2, [0.5, 0.5, 1.5, 1.5], ["bd", "sn", "bd", "sn"]);
  });
});

describe("gate", () => {
  describe("beat; gate(0, 4)", () => {
    const pattern = gate(0, 4)(beat);
    testQuery(pattern, 0, 4, [0]);
    testQuery(pattern, 0, 8, [0, 4]);
    testQuery(pattern, 1, 4, []);
    testQuery(pattern, 1, 8, [4]);
  });

  describe("beat; gate(1, 4)", () => {
    const pattern = gate(1, 4)(beat);
    testQuery(pattern, 0, 4, [1]);
    testQuery(pattern, 0, 8, [1, 5]);
    testQuery(pattern, 1, 4, [1]);
    testQuery(pattern, 1, 8, [1, 5]);
  });

  describe("beat; gate(1, 4) ; shift 1", () => {
    const pattern = shift(1)(gate(1, 4)(beat));
    testQuery(pattern, 0, 4, [2]);
    testQuery(pattern, 0, 8, [2, 6]);
    testQuery(pattern, 1, 4, [2]);
    testQuery(pattern, 1, 8, [2, 6]);
  });

  describe("beat; gate(1, 4) ; shift 1", () => {
    const pattern = shift(2)(gate(1, 4)(beat));
    testQuery(pattern, 0, 4, [3]);
    testQuery(pattern, 0, 8, [3, 7]);
    testQuery(pattern, 1, 4, [3]);
    testQuery(pattern, 1, 8, [3, 7]);
  });

  describe("beat; gate(1, 4) ; fast 2", () => {
    const pattern = fast(2)(gate(1, 4)(beat));
    testQuery(pattern, 0, 2, [0.5]);
    testQuery(pattern, 0, 4, [0.5, 2.5]);
    testQuery(pattern, 0, 8, [0.5, 2.5, 4.5, 6.5]);
    testQuery(pattern, 1, 4, [2.5]);
    testQuery(pattern, 1, 8, [2.5, 4.5, 6.5]);
  });
});

describe("alt", () => {
  describe("alt bd sn", () => {
    const pattern = alt([() => bd, () => sn])(silence);
    testQuery(pattern, 0, 1, [0], ["bd"]);
    testQuery(pattern, 0, 2, [0, 1], ["bd", "sn"]);
    testQuery(pattern, 0, 4, [0, 1, 2, 3], ["bd", "sn", "bd", "sn"]);
    testQuery(pattern, 1, 3, [1, 2], ["sn", "bd"]);
  });

  describe("alt (alt bd sn) sn", () => {
    const pattern = alt([alt([() => bd, () => sn]), () => sn])(silence);
    testQuery(pattern, 0, 1, [0], ["bd"]);
    testQuery(pattern, 0, 2, [0, 1], ["bd", "sn"]);
    testQuery(pattern, 0, 4, [0, 1, 2, 3], ["bd", "sn", "bd", "sn"]);
    testQuery(pattern, 1, 3, [1, 2], ["sn", "bd"]);
  });

  describe("alt (alt bd sn; fast 2) sn", () => {
    const pattern = alt([x => fast(2)(alt([() => bd, () => sn])(x)), () => sn])(
      silence
    );
    testQuery(pattern, 0, 1, [0, 0.5], ["bd", "sn"]);
    testQuery(pattern, 0, 2, [0, 0.5, 1], ["bd", "sn", "sn"]);
    testQuery(
      pattern,
      0,
      4,
      [0, 0.5, 1, 2, 2.5, 3],
      ["bd", "sn", "sn", "bd", "sn", "sn"]
    );
    testQuery(pattern, 1, 3, [1, 2, 2.5], ["sn", "bd", "sn"]);
  });
});

describe("and", () => {
  describe("bd ; and sn", () => {
    const pattern = and(() => sn)(bd);
    testQuery(pattern, 0, 1, [0, 0], ["bd", "sn"]);
    testQuery(pattern, 0, 2, [0, 0, 1, 1], ["bd", "sn", "bd", "sn"]);
  });
});

function testQuery<A>(
  pattern: Pattern<A>,
  start: number,
  end: number,
  expectedTimes: Array<number>,
  expectedValues?: Array<A>
) {
  test(`(${start}, ${end})`, () => {
    const events = query(start, end, pattern);
    expect(events.map(x => x.start)).toEqual(expectedTimes);
    if (expectedValues) {
      expect(events.map(x => x.value)).toEqual(expectedValues);
    }
  });
}
