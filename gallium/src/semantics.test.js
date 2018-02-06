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
  compose,
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

  describe("event distribution", () => {
    test("even distribution of events without alt", () => {
      const transform = compose([fast(2), slow(2)]);
      const pattern = transform(bd);
      expect(query(0, 1, pattern).length).toBe(1);
      expect(query(1, 2, pattern).length).toBe(1);
    });

    test("even distribution of events with alt", () => {
      const transform = compose([alt([fast(2)]), slow(2)]);
      const pattern = transform(bd);
      expect(query(0, 1, pattern).length).toBe(1);
      expect(query(1, 2, pattern).length).toBe(1);
      expect(query(2, 3, pattern).length).toBe(1);
      expect(query(3, 4, pattern).length).toBe(1);
    });
  });

  test("can take negative queries", () => {
    const pattern = alt([() => bd, () => sn])(silence);
    expect(query(-1, 0, pattern)).toEqual([{ start: -1, end: 0, value: "sn" }]);
  });
});

describe("and", () => {
  describe("bd ; and sn", () => {
    const pattern = and([() => sn])(bd);
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
