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
  invert: boolean,
  output: MIDI.Device,
  outputs: { [string]: MIDI.Device },
  beat: number,
  bpm: number,
  pattern: Pattern<*>
};

const defaultText = `alt (do (note 127 126 124 127) (shift 1 2 3)) (do (note 125) (fast 2))
fast 2
shift 0.5 0 0 0
alt i m
shift 0.5
stack
  i
  do
    note 120 60 15 127
    slow 4
    alt i m
    fast 2 2 2 4 2 2 2 2
    fast 4
    shift 0 0 0 0 0 0 0 0 0 0.5
`;

export function makeInitialState(): AppState {
  return {
    loading: true,
    error: undefined,
    text: LocalStorage.loadText() || defaultText,
    intervalId: undefined,
    invert: LocalStorage.loadInvert() || false,
    output: MIDI.makeDummyDevice("mockDevice"),
    outputs: {},
    beat: 0,
    bpm: LocalStorage.loadBPM() || 160,
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
