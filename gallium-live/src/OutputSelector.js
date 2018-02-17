// @flow
import * as React from "react";
import { connect, type Connect } from "./efx";
import styled from "styled-components";
import * as LocalStorage from "./local_storage";
import * as Styles from "./styles";
import * as MIDI from "./midi";
import * as MIDIActions from "./midi_actions";

type OwnProps = {};

type ContainerProps = {
  output: MIDI.Device,
  error: ?Error,
  outputs: { [string]: MIDI.Device }
};

export class _OutputSelector extends React.Component<
  Connect<OwnProps, ContainerProps>
> {
  onChange = (e: *) => {
    const outputPortName = e.target.value;
    this.props.dispatch(MIDIActions.changePort(outputPortName));
  };

  render() {
    if (this.props.error) {
      return <i>{this.props.error.toString()}</i>;
    }
    return (
      <Selector value={this.props.output.name} onChange={this.onChange}>
        {Object.keys(this.props.outputs).map(key => {
          const output = this.props.outputs[key];
          return (
            <option key={output.name} value={output.name}>
              {output.name}
            </option>
          );
        })}
      </Selector>
    );
  }
}

export const OutputSelector = connect(
  _OutputSelector,
  ({ output, outputs, error }) => ({
    output,
    outputs,
    error
  })
);

const Selector = styled.select`
  ${Styles.transition};
  ${Styles.box};
  background: none;
  border: none;
  font-family: monospace;
  cursor: pointer;
  outline: none;
  color: #252525;
  &:active,
  &:hover {
    box-shadow: 0 0 0 1px #252525;
  }
`;
