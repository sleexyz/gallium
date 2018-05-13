// @flow
import * as React from "react";
import styled from "styled-components";
import { connect, type Connect } from "./efx";
import { Editor } from "./Editor";
import { OutputSelector } from "./OutputSelector";
import { BPMSelector } from "./BPMSelector";
import { ToggleInvert } from "./ToggleInvert";
import { PlaybackControls } from "./PlaybackControls";
import * as Styles from "./styles";

type OwnProps = {};

type ContainerProps = {
  invert: boolean
};

type State = {
  isInitialized: boolean
};

const mapStateToProps = ({ invert }) => ({ invert });

export class _App extends React.Component<
  Connect<OwnProps, ContainerProps>,
  State
> {
  constructor(props: *) {
    super(props);
    this.state = { isInitialized: false };
  }
  componentDidMount() {
    setTimeout(() => this.setState({ isInitialized: true }), 0);
  }

  render() {
    return (
      <Container
        isInitialized={this.state.isInitialized}
        style={{ filter: this.props.invert ? "invert(100%)" : "" }}
      >
        <Pane>
          <PaneChild>
            <PlaybackControls />
          </PaneChild>
          <PaneChild>
            <Description>gallium.live</Description>
          </PaneChild>
          <PaneChild>
            <Link href="https://github.com/sleexyz/gallium">source</Link>
          </PaneChild>
        </Pane>
        <Content>
          <Editor />
        </Content>
        <Pane>
          <PaneChild>
            <BPMSelector />
          </PaneChild>
          <PaneChild>
            <ToggleInvert />
          </PaneChild>
          <PaneChild>
            <OutputSelector />
          </PaneChild>
        </Pane>
      </Container>
    );
  }
}

export const App = connect(_App, mapStateToProps);

export const Container: React$ComponentType<{
  isInitialized: boolean
}> = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: ${props => (props.isInitialized ? 1 : 0)};
  transition: opacity 500ms ease-in-out;
  background-color: white;
`;

const Pane = styled.div`
  flex: 0 1 auto;
  min-height: 50px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0px 20px;
  ${Styles.transition};
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
`;

const PaneChild = styled.div`
  padding: 10px 20px;
`;

const Content = styled.div`
  padding: 10vh 10vw;
  flex-grow: 1;
  flex-shrink: 0;
  display: flex;
  background-color: white;
`;

const Description = styled.div`
  ${Styles.text};
  font-style: italic;
  letter-spacing: 0.25em;
`;

const Link = styled.a`
  ${Styles.text};
  opacity: 0.75;
  &:visited {
    color: inherit;
  }
`;
