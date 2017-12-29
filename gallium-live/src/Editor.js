// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import { parseTopLevel } from "gallium/lib/parser";
import { type ABT, T, Term, resolve } from "gallium/lib/resolver";
import { globalContext } from "./context";
import { type Pattern, silence } from "gallium/lib/semantics";
import { OutputSelector } from "./OutputSelector";
import * as MIDI from "./midi";

type PlaybackState = {
  isPlaying: boolean,
  output: MIDI.Device,
  beat: number,
  pattern: Pattern<*>
};

export const globalPlaybackState: PlaybackState = {
  isPlaying: false,
  output: MIDI.makeDummyDevice("mockDevice"),
  beat: 0,
  pattern: silence
};

export function start(state: PlaybackState): void => void {
  const beatLength = 1000 * 60 / 160;
  function sendEvent(event) {
    const timestamp =
      performance.now() + (event.start - state.beat) * beatLength;
    state.output.send(event.value, timestamp);
  }
  function queryAndSend() {
    const events = state.pattern(state.beat, state.beat + 1);
    for (let i = 0; i < events.length; i++) {
      sendEvent(events[i]);
    }
    state.beat += 1;
  }
  const intervalId = setInterval(queryAndSend, beatLength);
  state.isPlaying = true;

  return function stop() {
    clearInterval(intervalId);
    state.isPlaying = false;
  };
}

type EditorState = {
  text: string,
  abt: ?ABT,
  error: ?string
};

const initialCode = `note 24 48
fast 2 1
fast 1 1 .5
add 0 2 7 15 31
stack
  i
  do
    add 12 14
    shift 1 2 3
fast 2 0.5 2 1
`;

export class Editor extends React.Component<{}, EditorState> {
  state = {
    text: initialCode,
    error: undefined,
    abt: undefined
  };
  stop: void => void;
  componentDidMount() {
    this.stop = start(globalPlaybackState);
    this.updateABT(this.state.text);
  }
  componentWillUnmount() {
    this.stop();
  }
  onChange = (e: *) => {
    this.setState({
      text: e.target.value
    });
    this.updateABT(e.target.value);
  };
  updateABT(code: string) {
    try {
      const abt = resolve(globalContext, parseTopLevel(code));
      this.setState({
        abt,
        error: undefined
      });
      globalPlaybackState.pattern = (abt.payload.getValue(): any)(silence);
    } catch (e) {
      this.setState({
        error: e.toString()
      });
    }
  }
  onMIDIOutputChange = async (choice: string) => {
    const newOutput = await MIDI.connectToOutputPort(choice);
    globalPlaybackState.output = newOutput;
  };
  render() {
    return (
      <div>
        <h1>
          <i style={{ letterSpacing: "0.5em" }}>gallium</i>
        </h1>
        <div>
          <a href="https://github.com/sleexyz/gallium">github</a>
        </div>
        <div style={{ marginTop: "20px" }}>
          <textarea
            onChange={this.onChange}
            value={this.state.text}
            rows="24"
            cols="60"
          />
        </div>
        <OutputSelector onChange={this.onMIDIOutputChange} />
      </div>
    );
  }
}
