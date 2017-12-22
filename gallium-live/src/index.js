// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import { parse } from "gallium/lib/parser";
import {
  type Pattern,
  type Transformer,
  periodic,
  silence,
  alt,
  fast,
  slow,
  shift,
  stack,
  compose
} from "gallium/lib/semantics";
import { type ABT, Term, resolve } from "gallium/lib/resolver";

async function setupMIDI(name?: string) {
  const access = await (navigator: any).requestMIDIAccess();
  for (const output of access.outputs.values()) {
    if (!name || name === output.name) {
      const port = await output.open();
      return port;
    }
  }
  throw new Error(`could not find device named ${JSON.stringify(name)}`);
}

type PlaybackState = {
  output: { send: (any, number) => void },
  beat: number,
  pattern: Pattern<*>
};

const note = x =>
  periodic({
    period: 1,
    duration: 1,
    phase: 0,
    value: [0x90, x, 0x7f] //note-on
  });

function getBeatLength(bpm: number): number {
  return 1000 * 60 / bpm;
}

export function pitchMap(f: number => number): Transformer<Array<number>> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: [event.value[0], f(event.value[1]), event.value[2]]
    }));
  };
}

async function setup(): Promise<PlaybackState> {
  const bpm = 160;
  const beatLength = getBeatLength(bpm);
  const state = {
    output: await setupMIDI(),
    beat: 0,
    pattern: silence
  };
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
  setInterval(queryAndSend, beatLength);
  return state;
}

let globalPlaybackState;

const globalContext = {
  note: new Term({
    type: {
      type: "function",
      input: { type: "list", param: "number" },
      output: "transformer"
    },
    value: children =>
      alt(
        children.map(x => () =>
          periodic({
            period: 1,
            duration: 1,
            phase: 0,
            value: new Uint8Array([0x90, x, 0x7f]) //note-on
          })
        )
      )
  }),
  compose: new Term({
    type: {
      type: "function",
      input: { type: "list", param: "transformer" },
      output: "transformer"
    },
    value: compose
  }),
  alt: new Term({
    type: {
      type: "function",
      input: { type: "list", param: "transformer" },
      output: "transformer"
    },
    value: alt
  }),
  slow: new Term({
    type: {
      type: "function",
      input: { type: "list", param: "number" },
      output: "transformer"
    },
    value: xs => alt(xs.map(slow))
  }),
  fast: new Term({
    type: {
      type: "function",
      input: { type: "list", param: "number" },
      output: "transformer"
    },
    value: xs => alt(xs.map(fast))
  }),
  add: new Term({
    type: {
      type: "function",
      input: { type: "list", param: "number" },
      output: "transformer"
    },
    value: xs => alt(xs.map(n => pitchMap(x => x + n)))
  }),
  i: new Term({
    type: "transformer",
    value: x => x
  }),
  m: new Term({
    type: "transformer",
    value: () => silence
  }),
  stack: new Term({
    type: {
      type: "function",
      input: { type: "list", param: "transformer" },
      output: "transformer"
    },
    value: stack
  }),
  shift: new Term({
    type: {
      type: "function",
      input: { type: "list", param: "number" },
      output: "transformer"
    },
    value: xs => alt(xs.map(shift))
  })
};

type EditorState = {
  text: string,
  abt: ?ABT,
  error: ?string
};

const initialCode = `compose
  note 36
  fast 2 4
  add 0 2 7 15 31
  stack
    compose (add 12) (shift 1 2 3)
    i
  slow 1
`;

class Editor extends React.Component<{}, EditorState> {
  state = {
    text: initialCode,
    error: undefined,
    abt: undefined
  };
  componentDidMount() {
    this.updateABT(this.state.text);
  }
  onChange = e => {
    this.setState({
      text: e.target.value
    });
    this.updateABT(e.target.value);
  };
  updateABT(code: string) {
    try {
      const abt = resolve(globalContext, parse(code));
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
  renderDebug() {
    if (this.state.error) {
      return <pre>{this.state.error}</pre>;
    }
    return <pre>{JSON.stringify(this.state.abt, null, 2)}</pre>;
  }
  onMIDIOutputChange = async (choice: string) => {
    const newOutput = await setupMIDI(choice);
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
        <ChooseOutput onChange={this.onMIDIOutputChange} />
        {this.renderDebug()}
      </div>
    );
  }
}

class ChooseOutput extends React.Component<
  { onChange: string => Promise<void> },
  { loaded: boolean, value: any }
> {
  options: Array<string> = [];
  state = { loaded: false, value: undefined };

  constructor() {
    super();
    this.setOptions();
  }

  async setOptions() {
    const access = await (navigator: any).requestMIDIAccess();
    for (const output of access.outputs.values()) {
      this.options.push(output.name);
      this.setState({ loaded: true });
    }
  }

  onChange = e => {
    this.props.onChange(e.target.value);
  };

  render() {
    return (
      <select value={this.state.value} onChange={this.onChange}>
        {this.options.map(x => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    );
  }
}

setup().then(state => {
  globalPlaybackState = state;
  ReactDOM.render(<Editor />, document.getElementById("react-root"));
});
