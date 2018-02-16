// @flow
import * as React from "react";
import styled from "styled-components";
import { parseTopLevel } from "gallium/lib/parser";
import { type ABT, resolve } from "gallium/lib/resolver";
import * as TopLevel from "gallium/lib/top_level";
import { silence } from "gallium/lib/semantics";
import { OutputSelector } from "./OutputSelector";
import * as MIDI from "./midi";
import * as MIDIActions from "./midi_actions";
import * as LocalStorage from "./local_storage";
import { connect, type Connect } from "./efx";
import * as Styles from "./styles";
import * as Playback from "./playback";
import * as AppActions from "./app_actions";
import { BPMSelector } from "./BPMSelector";
import { ToggleInvert } from "./ToggleInvert";
import * as Shader from "./shader";

type OwnProps = {};

type ContainerProps = {
  text: string,
  invert: boolean
};

const mapStateToProps = ({ text, invert }) => ({ text, invert });

type State = {
  text: string,
  error: ?string,
  isInitialized: boolean
};

export class _Editor extends React.Component<
  Connect<OwnProps, ContainerProps>,
  State
> {
  constructor(props: *) {
    super(props);
    this.state = {
      text: props.text,
      error: undefined,
      isInitialized: false
    };
  }

  textarea: HTMLTextAreaElement;

  textCanvas: HTMLCanvasElement;

  componentDidMount() {
    this.props.dispatch(AppActions.initialize());
    this.updateABT(this.state.text);
    setTimeout(() => this.setState({ isInitialized: true }), 0);
  }

  componentWillUnmount() {
    this.props.dispatch(Playback.stop());
  }

  onChange = (e: *) => {
    const text = e.target.value;
    this.setState({
      text
    });
    this.updateABT(text);
    if (this.textCanvas) {
      this.drawText(text);
    }
  };

  updateABT(text: string) {
    try {
      const abt = TopLevel.parseAndResolve(text);
      this.setState({
        error: undefined
      });
      this.props.dispatch(store => {
        store.state.pattern = TopLevel.interpret(abt);
      });
      LocalStorage.saveText(text);
    } catch (e) {
      this.setState({
        error: e.toString()
      });
    }
  }

  onKeyPress = (e: SyntheticKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const pos = e.currentTarget.selectionStart;
      const prefix = this.state.text.substr(0, pos);
      const suffix = this.state.text.substr(pos);

      const prePos = prefix.lastIndexOf("\n");
      const line = prefix.substring(prePos + 1);
      const spaceMatch = line.match(/^\ */g);
      if (!spaceMatch) {
        throw new Error("unexpected error: no match");
      }
      const indentation = spaceMatch[0];

      const extraText = "\n" + indentation;
      const newText = prefix + extraText + suffix;
      this.setState(
        {
          text: newText
        },
        () => {
          (this.textarea: any).focus();
          (this.textarea: any).setSelectionRange(
            pos + extraText.length,
            pos + extraText.length
          );
        }
      );
    }
  };

  registerContent = (ref: HTMLElement) => {
    if (!ref) {
      return;
    }
    const canvas: HTMLCanvasElement = (ref.children[1]: any);
    const textCanvas: HTMLCanvasElement = (ref.children[2]: any);

    (textCanvas.width = Math.max(window.innerHeight, window.innerWidth)),
      (textCanvas.height = textCanvas.width);

    this.textCanvas = textCanvas;
    this.drawText(this.state.text);
    Shader.registerWebGL({ canvas, textCanvas });
  };

  registerTextarea = (ref: HTMLTextAreaElement) => {
    if (!ref) {
      return;
    }
    ref.focus();
    this.textarea = ref;
  };

  drawText(text: string) {
    const ctx = this.textCanvas.getContext("2d");
    ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
    ctx.font = "16px mono";
    ctx.fillStyle = "white";
    const lineHeight = ctx.measureText("M").width * 1.8;
    const lines = text.split("\n");
    let y = 0;
    for (const line of lines) {
      ctx.fillText(line, 0, y);
      y += lineHeight;
    }
  }

  render() {
    const barStyle = this.state.error ? "dotted" : "solid";
    return (
      <Container
        isInitialized={this.state.isInitialized}
        style={{ filter: this.props.invert ? "invert()" : "" }}
      >
        <Pane style={{ top: 0 }}>
          <PaneChild>
            <Description>gallium.live</Description>
          </PaneChild>
          <PaneChild>
            <Link href="https://github.com/sleexyz/gallium">source</Link>
          </PaneChild>
        </Pane>
        <Content innerRef={this.registerContent}>
          <Textarea
            id="gallium-textarea"
            onChange={this.onChange}
            onKeyPress={this.onKeyPress}
            value={this.state.text}
            innerRef={this.registerTextarea}
            barStyle={barStyle}
          />
          <Canvas />
          <TextCanvas />
        </Content>
        <Pane style={{ bottom: 0 }}>
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

export const Editor = connect(_Editor, mapStateToProps);

export const Container: React$ComponentType<{
  isInitialized: boolean
}> = styled.div`
  width: 100%;
  height: 100%;
  opacity: ${props => (props.isInitialized ? 1 : 0)};
  transition: opacity 500ms ease-in-out;
`;

const paneHeight = 60;

const Pane = styled.div`
  height: ${paneHeight}px;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-items: center;
  ${Styles.transition};
  opacity: 1;
  &:hover {
    opacity: 1;
  }
  position: fixed;
  background-color: white;
`;

const PaneChild = styled.div`
  padding: 10px 20px;
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  display: 0;
  height: 100%;
`;

const Canvas = styled.canvas`
  position: fixed;
  z-index: -1;
  height: 100vmax;
  width: 100vmax;
  top: 0;
  left: 0;
  background-color: black;
`;

const TextCanvas = styled.canvas`
  display: none;
`;

export const Textarea: React.ComponentType<{
  barStyle: string
}> = styled.textarea`
  border: 0;
  font-size: 16px;
  margin: 0;
  height: calc(100% - 2*${paneHeight}px);
  background-color: transparent;
  font-family: monospace;
  outline: none;
  padding: 0;
  padding-left: 0.2em;
  border-left: 1px ${props => props.barStyle} #000;
  opacity: 1;
  width: calc(100% - 10px);
  margin-left: 10px;
  z-index: 0;
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
