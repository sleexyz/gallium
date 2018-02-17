// @flow
import * as React from "react";
import { connect, type Connect } from "./efx";
import styled from "styled-components";
import * as Styles from "./styles";
import * as Playback from "./playback";

type OwnProps = {};

type ContainerProps = {
  bpm: number
};

type State = {
  bpm: number
};

const mapStateToProps = ({ bpm }) => ({ bpm });

class _BPMSelector extends React.Component<
  Connect<OwnProps, ContainerProps>,
  State
> {
  constructor(props: *) {
    super(props);
    this.state = { bpm: props.bpm };
  }

  onBlur = (e: *) => {
    this.commit(e.target.value);
  };

  commit(bpm: number) {
    let value = bpm;
    value = Math.max(40, value);
    value = Math.min(800, value);
    this.props.dispatch(Playback.setBPM(value));
  }

  onChange = (e: *) => {
    this.setState({ bpm: e.target.value });
  };

  onKeyPress = (e: *) => {
    if (e.key === "Enter") {
      this.commit(e.target.value);
    }
  };

  componentWillReceiveProps(nextProps: *) {
    this.state.bpm = nextProps.bpm;
  }

  render() {
    return (
      <Outer>
        BPM:
        <Input
          type="number"
          value={this.state.bpm}
          onChange={this.onChange}
          onKeyPress={this.onKeyPress}
          onBlur={this.onBlur}
        />
      </Outer>
    );
  }
}

export const BPMSelector = connect(_BPMSelector, mapStateToProps);

const Outer = styled.div`
  font-family: monospace;
`;

const Input = styled.input`
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
  margin-left: 10px;
`;
