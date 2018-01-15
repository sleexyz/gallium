// @flow
import * as React from "react";
import * as EFX from "efx";
import * as MIDI from "./midi";
import * as LocalStorage from "./local_storage";
import { type Pattern, silence } from "gallium/lib/semantics";

export type AppState = {
  loading: boolean,
  error: ?Error,
  text: string,
  intervalId: ?number,
  output: MIDI.Device,
  outputs: { [string]: MIDI.Device },
  beat: number,
  bpm: number,
  pattern: Pattern<*>
};

export function makeInitialState(): AppState {
  return {
    loading: true,
    error: undefined,
    text: LocalStorage.loadText() || "note 24",
    intervalId: undefined,
    output: MIDI.makeDummyDevice("mockDevice"),
    outputs: {},
    beat: 0,
    bpm: 160,
    pattern: silence
  };
}

type DefaultProps = {};

export function connect<OP: {}, CP: {}>(
  component: React.ComponentType<Connect<OP, CP>>,
  mapStateToProps: AppState => CP
): React.ComponentType<OP> {
  const defaultProps = {};
  return EFX.connect(component, mapStateToProps, defaultProps);
}

export type Connect<OP: {}, CP: {}> = EFX.Connect<
  OP,
  CP,
  AppState,
  DefaultProps
>;

export const Store: Class<EFX.Store<AppState>> = EFX.Store;

export const Provider: Class<EFX.Provider<AppState>> = EFX.Provider;

export type Action<A, B> = A => Store => B;

export const makeAction: <A, B>(Action<A, B>) => Action<A, B> = EFX.makeAction;
