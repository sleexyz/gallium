// @flow

import * as React from "react";
import { connect, type Connect } from "./efx";
import styled from "styled-components";
import * as Playback from "./playback";

type OwnProps = {
  depth: number
};

type ContainerProps = {
  beat: number
};

const mapStateToProps = ({ beat }) => {
  return { beat };
};

const scale = 3;

export class _Clock extends React.PureComponent<
  Connect<OwnProps, ContainerProps>
> {
  makeButtonOnClick = (i: number) => () => {
    this.props.dispatch(store => {
      const maskReset = ~((1 << ((this.props.depth + 1) * scale)) - 1);
      const foo = i << (this.props.depth * scale);
      store.state.beat = (store.state.beat & maskReset) | foo;
    });
  };
  makeButtonOnClick2 = (i: number) => () => {
    this.props.dispatch(store => {
      const maskReset = ~(((1 << scale) - 1) << (this.props.depth * scale));
      const foo = i << (this.props.depth * scale);
      store.state.beat = (store.state.beat & maskReset) | foo;
    });
  };
  render() {
    const buttons = [];
    for (let i = 0; i < 1 << scale; i++) {
      const masked =
        (this.props.beat >> (this.props.depth * scale)) & ((1 << scale) - 1);
      const isOn = masked === i;
      buttons.push(
        <Section key={`${i}`} isOn={isOn} onClick={this.makeButtonOnClick(i)} />
      );
    }
    return <ClockWrapper>{buttons}</ClockWrapper>;
  }
}

export const Clock = connect(_Clock, mapStateToProps);

const ClockWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Section = styled.div`
  background-color: ${props => (props.isOn ? "black" : "white")};
  border: 1px dotted black;
  width: 50px;
  height: 50px;
`;
