// @flow
import * as React from "react";
import styled from "styled-components";
import * as Styles from "./styles";
import * as LocalStorage from "./local_storage";
import { connect, type Connect, type Action, makeAction } from "./efx";

type OwnProps = {};
type ContainerProps = {
  invert: boolean
};
export class _ToggleInvert extends React.Component<
  Connect<OwnProps, ContainerProps>
> {
  onChange = () => {
    this.props.dispatch(setInvert(!this.props.invert));
  };
  render() {
    return (
      <Toggle>
        <Box
          type="checkbox"
          onChange={this.onChange}
          checked={this.props.invert}
        />
        <Label>invert</Label>
      </Toggle>
    );
  }
}

export const ToggleInvert = connect(_ToggleInvert, ({ invert }) => ({
  invert
}));

const setInvert: Action<boolean, void> = makeAction(value => store => {
  store.state.invert = value;
  LocalStorage.saveInvert(value);
});

export const Box = styled.input`
  ${Styles.transition};
  &:hover {
    box-shadow: 0 0 0 1px #252525;
  }
}
`;
const Label = styled.span`
  font-family: monospace;
  padding-left: 8px;
`;

const Toggle = styled.div`
  ${Styles.box};
  display: flex;
  align-items: center;
`;
