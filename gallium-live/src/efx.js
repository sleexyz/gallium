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
  text2: string,
  intervalId: ?number,
  invert: boolean,
  output: MIDI.Device,
  outputs: { [string]: MIDI.Device },
  beat: number,
  bpm: number,
  pattern: Pattern<*>,
  pattern2: Pattern<*>
};

const defaultText = `note 60`;

export function makeInitialState(): AppState {
  return {
    loading: true,
    error: undefined,
    text: LocalStorage.loadText() || defaultText,
    text2: LocalStorage.loadText2() || "",
    intervalId: undefined,
    invert: LocalStorage.loadInvert() || false,
    output: MIDI.makeDummyDevice("mockDevice"),
    outputs: {},
    beat: 0,
    bpm: LocalStorage.loadBPM() || 160,
    pattern: silence,
    pattern2: silence
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
