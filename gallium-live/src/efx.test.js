// @flow
import * as React from "react";
import { mount } from "enzyme";
import * as TestUtils from "./test_utils";
import * as EFX from "./efx";

type AppState = {
  foo: number
};

type DefaultProps = {
  asdf: number
};

type Connect<OP: {}, CP: {}> = EFX.Connect<OP, CP, AppState, DefaultProps>;

function connect<CP: {}, OP: {}>(
  component: React.ComponentType<Connect<OP, CP>>,
  mapStateToProps: AppState => CP
): React.ComponentType<OP> {
  const defaultProps = { asdf: 1 };
  return EFX.connect(component, mapStateToProps, defaultProps);
}

type OwnProps = {
  id: number
};

type ContainerProps = {
  foo: number
};

class ExampleComponent extends React.Component<
  Connect<OwnProps, ContainerProps>
> {
  render() {
    return (
      <div>
        {this.props.foo} {this.props.id}
      </div>
    );
  }
}

() => {
  // ok
  const Wrapped = connect(ExampleComponent, ({ foo }) => ({ foo }));

  // ok
  <Wrapped id={1} />;

  // should fail when missing own props
  // $ExpectError
  <Wrapped />;

  // should fail when accessing the store incorrectly
  // $ExpectError
  connect(ExampleComponent, ({ baz }) => ({ foo: baz }));

  // should fail when returning the wrong ContainerProps
  // $ExpectError
  connect(ExampleComponent, () => ({ baz: 1 }));
};

() => {
  class ExampleComponent extends React.Component<
    Connect<{ id: number }, {| foo: number |}>
  > {}

  // should fail when returning extraneous container props, when given exact ContainerProps
  // $ExpectError
  connect(ExampleComponent, ({ foo }) => ({ foo, bar: 1 }));
};

describe("connect", () => {
  it("initializes with state", () => {
    const store: EFX.Store<{ foo: number }> = new EFX.Store({
      foo: 1
    });
    const Connected = connect(ExampleComponent, ({ foo }) => ({
      foo
    }));
    const wrapper = mountWithStore(<Connected id={2} />, { store });
    expect(wrapper.text()).toBe("1 2");
  });

  it("propagates data changes when store is mutated", () => {
    const store: EFX.Store<{ foo: number, bar: number }> = new EFX.Store({
      foo: 1,
      bar: 100
    });
    const Connected = connect(ExampleComponent, ({ foo }) => ({ foo }));
    const wrapper = mountWithStore(<Connected id={2} />, { store });
    store.state.foo += 1;
    expect(wrapper.text()).toBe("2 2");
  });

  it("does not trigger data changes when an irrelevant field in store gets mutated", () => {
    TestUtils.spyOn(ExampleComponent.prototype, "render");
    const store: EFX.Store<{ foo: number, bar: number }> = new EFX.Store({
      foo: 1,
      bar: 100
    });
    const Connected = connect(ExampleComponent, ({ foo }) => ({ foo }));
    const wrapper = mountWithStore(<Connected id={2} />, { store });
    store.state.bar += 1;
    expect(
      wrapper.find(ExampleComponent).instance().render
    ).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes from store when unmounted", () => {
    const store: EFX.Store<{ foo: number, bar: number }> = new EFX.Store({
      foo: 1,
      bar: 100
    });
    const Connected = connect(ExampleComponent, ({ foo }) => ({ foo }));
    const wrapper = mountWithStore(<Connected id={2} />, { store });
    wrapper.unmount();
    expect(store.subscriptions).toEqual([undefined]);
  });
});

function mountWithStore<S>(
  element: React.Node,
  options: { store: EFX.Store<S> }
) {
  const store = options.store;
  return mount(<EFX.Provider store={store}>{element}</EFX.Provider>);
}
