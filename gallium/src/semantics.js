// @flow

type Event<A> = {
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

export function stack<A>(children: Array<Pattern<A>>): Pattern<A> {
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

function gateWith<A>(gatePat: Pattern<any>): Transformer<A> {
  return pattern => (start, end) => {
    const gates = query(start, end, gatePat);
    let events = [];
    for (const { start, end } of gates) {
      events = events.concat(query(start, end, pattern));
    }
    return events;
  };
}

export function gate<A>(phase: number, period: number): Transformer<A> {
  return gateWith(
    periodic({ period: period, duration: 1, phase, value: undefined })
  );
}

export const silence: Pattern<any> = () => [];

export function alt<A>(children: Array<Transformer<A>>): Transformer<A> {
  return pattern => {
    return stack(
      children.map((transform, i) => {
        return gate(i, children.length)(transform(pattern));
      })
    );
  };
}

export function and<A>(transform: Transformer<A>): Transformer<A> {
  return pattern => {
    return stack([pattern, transform(pattern)]);
  };
}
