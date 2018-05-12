// @flow

import * as React from "react";
import { connect, type Connect } from "./efx";
import styled from "styled-components";
import * as Playback from "./playback";
import { Clock } from "./Clock";

type OwnProps = {};

type ContainerProps = {
  beat: number
};

const mapStateToProps = ({ intervalId, beat }) => {
  return { isPlaying: !!intervalId, beat };
};

class _PlaybackControls extends React.PureComponent<
  Connect<OwnProps, ContainerProps>
> {
  togglePlayback = () => {
    if (this.props.isPlaying) {
      this.props.dispatch(Playback.pause());
    } else {
      this.props.dispatch(Playback.start());
    }
  };

  render() {
    let message = this.props.isPlaying ? "Pause" : "Play";
    const clocks = [];
    for (let i = 0; i < 4; i++) {
      clocks.push(<Clock depth={i} key={i} />);
    }
    return (
      <Controls>
        <Clocks>{clocks}</Clocks>

        <Button onClick={this.togglePlayback}>{message}</Button>
        <BeatCounter value={this.props.beat} />
      </Controls>
    );
  }
}
const Controls = styled.div`
  display: flex;
`;

const Clocks = styled.div`
  display: flex;
  flex-direction: row;
`;

const BeatCounter = styled.input``;

const Button = styled.button``;

export const PlaybackControls = connect(_PlaybackControls, mapStateToProps);
