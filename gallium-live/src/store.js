// @flow
import * as React from "react";
import * as EFX from "./efx";
import * as MIDI from "./midi";
import * as LocalStorage from "./local_storage";
import { type Pattern, silence } from "gallium/lib/semantics";

export type AppState = {
  text: string,
  intervalId: ?number,
  output: MIDI.Device,
  beat: number,
  bpm: number,
  pattern: Pattern<*>
};

export function makeInitialState(): AppState {
  return {
    text: LocalStorage.loadText() || "note 24",
    intervalId: undefined,
    output: MIDI.makeDummyDevice("mockDevice"),
    beat: 0,
    bpm: 160,
    pattern: silence
  };
}

type DefaultProps = {};

export function connect<CP: {}, OP: {}>(
  component: React.ComponentType<Connect<OP, CP>>,
  mapStateToProps: AppState => CP
) {
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
