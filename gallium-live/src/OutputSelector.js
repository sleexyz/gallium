// @flow
import * as React from "react";

type State = {
  loading: boolean,
  error: ?string,
  value: any
};

export class OutputSelector extends React.Component<
  { onChange: string => Promise<void> },
  State
> {
  options: Array<string> = [];

  state = { loading: true, error: undefined, value: undefined };

  constructor() {
    super();
  }

  componentDidMount() {
    this.loadOptions();
  }

  async loadOptions() {
    try {
      const access = await (navigator: any).requestMIDIAccess();
      for (const output of access.outputs.values()) {
        this.options.push(output.name);
        this.setState({ loading: false });
      }
    } catch (e) {
      this.setState({ error: e.toString() });
    }
  }

  onChange = (e: *) => {
    this.props.onChange(e.target.value);
  };

  render() {
    if (this.state.error) {
      return <div>Your browser does not seem to support WebMIDI</div>;
    }
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
