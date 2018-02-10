// @flow

export type Event<A> = {
  start: number,
  end: number,
  value: A
};

function mapTime<A>(f: number => number): (Event<A>) => Event<A> {
  return event => ({
    ...event,
    start: f(event.start),
    end: f(event.end)
  });
}

export type Pattern<A> = (start: number, end: number) => Array<Event<A>>;

export function periodic<A>({
  period,
  duration,
  phase,
  value
}: {
  period: number,
  duration: number,
  phase: number,
  value: A
}): Pattern<A> {
  return (start, end) => {
    let events = [];
    for (let i = Math.floor(start / period) * period; i < end; i += period) {
      const time = i + phase;
      if (!(time >= start && time < end)) {
        continue;
      }
      events.push({ start: time, end: time + duration, value });
    }
    return events;
  };
}

export const beat: Pattern<void> = periodic({
  period: 1,
  duration: 1,
  phase: 0,
  value: undefined
});

export function query<A>(
  start: number,
  end: number,
  pattern: Pattern<A>
): Array<Event<A>> {
  return pattern(start, end);
}

export function stackPat<A>(children: Array<Pattern<A>>): Pattern<A> {
  return (start, end) => {
    let events = [];
    for (let i = 0; i < children.length; i += 1) {
      events = events.concat(query(start, end, children[i]));
    }
    return events.sort((a, b) => a.start - b.start);
  };
}

export type Transformer<A> = (Pattern<A>) => Pattern<A>;

export function shift<A>(n: number): Transformer<A> {
  return pattern => (start, end) => {
    return pattern(start - n, end - n).map(mapTime(x => x + n));
  };
}

export function slow<A>(k: number): Transformer<A> {
  return pattern => (start, end) => {
    return pattern(start / k, end / k).map(mapTime(x => x * k));
  };
}

export function fast<A>(k: number): Transformer<A> {
  return slow(1 / k);
}

export const silence: Pattern<any> = periodic({
  period: 1,
  duration: 1,
  phase: 0,
  value: undefined
});

const splitQueries = <A>(pattern: Pattern<A>): Pattern<A> => (start, end) => {
  let events = [];
  let i = start;
  /* if (i % 1 > 0) {
   *   events = events.concat(pattern(i, Math.min(Math.floor(i) + 1, end)));
   * }
   * i = Math.ceil(i); */
  for (; i < end; i += 1) {
    events = events.concat(pattern(i, Math.min(i + 1, end)));
  }
  return events;
};

export function alt<A>(children: Array<Transformer<A>>): Transformer<A> {
  return pattern => {
    return splitQueries((start, end) => {
      const n = children.length;
      const i = (Math.floor(start) % n + n) % n;
      const transform = children[i];
      return transform(pattern)(start, end);
    });
  };
}

export function compose<A>(children: Array<Transformer<A>>): Transformer<A> {
  return pattern => {
    let ret = pattern;
    for (const transform of children) {
      ret = transform(ret);
    }
    return ret;
  };
}

export function stack<A>(children: Array<Transformer<A>>): Transformer<A> {
  return pattern => {
    return stackPat(children.map(transform => transform(pattern)));
  };
}

export function and<A>(transform: Transformer<A>): Transformer<A> {
  return pattern => {
    return stackPat([pattern, transform(pattern)]);
  };
}
