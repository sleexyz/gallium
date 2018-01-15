// @flow
import * as EFX from "./";

type State = {
  foo: number
};

const Store: Class<EFX.Store<State>> = EFX.Store;

type Action<A, B> = A => Store => B;

const makeAction: <A, B>(Action<A, B>) => Action<A, B> = EFX.makeAction;

// Type tests
() => {
  const store: EFX.Store<{ foo: number }> = new Store({
    foo: 100
  });

  const addFoo: Action<number, number> = makeAction(input => store => {
    return input + store.state.foo;
  });

  // ok
  store.dispatch(addFoo(1));

  // $ExpectError - invalid input
  store.dispatch(addFoo());

  // $ExpectError - invalid output
  const foo: string = store.dispatch(addFoo(1));
};

test("actions can be dispatched by the store", () => {
  const store: EFX.Store<{ foo: number }> = new Store({
    foo: 100
  });

  const addFoo: Action<number, number> = makeAction(input => store => {
    return input + store.state.foo;
  });

  const result = store.dispatch(addFoo(2));

  expect(result).toBe(102);
});

test("async action completion can be awaited after invocation", async () => {
  const store: EFX.Store<{ foo: number }> = new Store({
    foo: 100
  });

  const addToFooAsync: Action<number, Promise<void>> = makeAction(
    input => async store => {
      await new Promise(resolve => setTimeout(resolve, 100));
      store.state.foo = input + store.state.foo;
    }
  );

  store.dispatch(addToFooAsync(2));
  expect(store.state.foo).toBe(100);

  await addToFooAsync.toFinish();
  expect(store.state.foo).toBe(102);
});

test("async action completion can be awaited even before invocation", async () => {
  const store: EFX.Store<{ foo: number }> = new Store({
    foo: 100
  });

  const doSomethingAsync: Action<void, Promise<void>> = makeAction(
    () => async store => {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  );

  const addToFooAsync: Action<number, Promise<void>> = makeAction(
    input => async store => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await store.dispatch(doSomethingAsync());
      store.state.foo = input + store.state.foo;
    }
  );

  store.dispatch(addToFooAsync(2));
  expect(store.state.foo).toBe(100);

  await doSomethingAsync.toFinish();
  expect(store.state.foo).toBe(102);
});

test("async action completion resolves on rejection", async () => {
  const store: EFX.Store<{ foo: number }> = new Store({
    foo: 100
  });

  const doSomethingAsync: Action<void, Promise<void>> = makeAction(
    () => async store => {
      store.state.foo = 150;
      await new Promise(resolve => setTimeout(resolve, 100));
      store.state.foo = 200;
      throw new Error("asdf");
    }
  );

  store.dispatch(doSomethingAsync());
  await doSomethingAsync.toFinish();
  expect(store.state.foo).toBe(200);
});
